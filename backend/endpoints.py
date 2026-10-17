from typing import Dict, Union

from data import blooms
from data.follows import follow, get_followed_usernames, get_inverse_followed_usernames
from data.users import (
    UserRegistrationError,
    get_suggested_follows,
    get_user,
    register_user,
)
from flask import Response, jsonify, make_response, request
from flask_jwt_extended import (
    create_access_token,
    get_current_user,
    jwt_required,
)
from datetime import timedelta

MINIMUM_PASSWORD_LENGTH = 5


def login():
    data = request.get_json(silent=True) or {}
    if not data:
        return make_response(
            jsonify({"success": False, "message": "Missing or invalid JSON body"}),
            400,
        )

    type_check_error = verify_request_fields({"username": str, "password": str})
    if type_check_error is not None:
        return type_check_error

    user = get_user(data["username"])
    if user is None:
        return make_response(
            jsonify({"success": False, "message": "Unknown user"}), 403
        )

    if not user.check_password(data["password"]):
        return make_response(
            jsonify({"success": False, "message": "Incorrect password"}), 403
        )

    access_token = create_access_token(
        identity=data["username"], expires_delta=timedelta(days=1)
    )
    return jsonify(
        {
            "success": True,
            "token": access_token,
        }
    )


def register():
    type_check_error = verify_request_fields({"username": str, "password": str})
    if type_check_error is not None:
        return type_check_error

    request_data = request.get_json() or {}
    username = request_data["username"]
    password = request_data["password"]

    if len(password) < MINIMUM_PASSWORD_LENGTH:
        return make_response(
            jsonify(
                {
                    "success": False,
                    "message": f"Password must be at least {MINIMUM_PASSWORD_LENGTH} characters long",
                }
            ),
            400,
        )
    try:
        register_user(username, password)
    except UserRegistrationError as error:
        return make_response(
            jsonify(
                {
                    "success": False,
                    "message": error.reason,
                }
            ),
            400,
        )
    access_token = create_access_token(
        identity=username, expires_delta=timedelta(days=1)
    )
    return jsonify(
        {
            "success": True,
            "token": access_token,
        }
    )


@jwt_required()
def self_profile():
    username = get_current_user().username

    # Check if the user exists
    user = get_user(username)
    if user is None:
        return make_response(
            jsonify({"success": False, "message": "User not found"}), 404
        )

    return jsonify(
        {
            "username": username,
            "follows": get_followed_usernames(user),
            "followers": get_inverse_followed_usernames(user),
        }
    )


@jwt_required(optional=True)
def other_profile(profile_username):
    # Check if the user exists
    profile_user = get_user(profile_username)
    if profile_user is None:
        return make_response(
            jsonify(
                {
                    "success": False,
                    "message": f"User {profile_username} not found",
                }
            ),
            404,
        )

    current_user = get_current_user()
    followers = get_inverse_followed_usernames(profile_user)
    all_blooms = blooms.get_blooms_for_user(profile_username)
    all_blooms.reverse()

    return jsonify(
        {
            "username": profile_username,
            "recent_blooms": all_blooms[:10],
            "follows": get_followed_usernames(profile_user),
            "followers": list(followers),
            "is_following": current_user is not None
            and current_user.username in followers,
            "is_self": current_user is not None
            and current_user.username == profile_username,
            "total_blooms": len(all_blooms),
        }
    )


@jwt_required()
def do_follow():
    type_check_error = verify_request_fields({"follow_username": str})
    if type_check_error is not None:
        return type_check_error

    current_user = get_current_user()

    request_data = request.get_json() or {}
    follow_username = request_data["follow_username"]
    follow_user = get_user(follow_username)
    if follow_user is None:
        return make_response(
            jsonify(
                {
                    "success": False,
                    "message": f"Cannot follow {follow_username} - user does not exist",
                }
            ),
            404,
        )

    follow(current_user, follow_user)
    return jsonify(
        {
            "success": True,
        }
    )


@jwt_required()
def send_bloom():
    type_check_error = verify_request_fields({"content": str})
    if type_check_error is not None:
        return type_check_error

    request_data = request.get_json() or {}
    content = request_data["content"]

    if len(content) > 280:
        return make_response(
            jsonify(
                {
                    "success": False,
                    "message": "Bloom content cannot exceed 280 characters",
                }
            ),
            400,
        )

    user = get_current_user()
    blooms.add_bloom(sender=user, content=content)
    return jsonify(
        {
            "success": True,
        }
    )


def get_bloom(id_str):
    try:
        id_int = int(id_str)
    except ValueError:
        return make_response(
            jsonify({"success": False, "message": "Invalid bloom id"}), 400
        )
    bloom = blooms.get_bloom(id_int)
    if bloom is None:
        return make_response(
            jsonify({"success": False, "message": "Bloom not found"}), 404
        )
    return jsonify(bloom)


@jwt_required()
def home_timeline():
    current_user = get_current_user()

    # Get blooms from followed users
    followed_users = get_followed_usernames(current_user)
    nested_user_blooms = [
        blooms.get_blooms_for_user(followed_user, limit=50)
        for followed_user in followed_users
    ]

    # Flatten list of blooms from followed users
    followed_blooms = [
        bloom for blooms in nested_user_blooms for bloom in blooms
    ]

    # Get the current user's own blooms
    own_blooms = blooms.get_blooms_for_user(current_user.username, limit=50)

    # Combine own blooms with followed blooms
    all_blooms = followed_blooms + own_blooms

    # Sort by timestamp (newest first)
    sorted_blooms = list(
        sorted(
            all_blooms, key=lambda bloom: bloom.sent_timestamp, reverse=True
        )
    )

    return jsonify(sorted_blooms)


def user_blooms(profile_username):
    user_blooms = blooms.get_blooms_for_user(profile_username)
    user_blooms.reverse()
    return jsonify(user_blooms)


@jwt_required()
def suggested_follows(limit_str):
    try:
        limit_int = int(limit_str)
    except ValueError:
        return make_response(
            jsonify({"success": False, "message": "Invalid limit"}), 400
        )

    current_user = get_current_user()

    suggestions = [
        {"username": username}
        for username in get_suggested_follows(current_user, limit_int)
    ]
    return jsonify(suggestions)


def hashtag(hashtag):
    return jsonify(blooms.get_blooms_with_hashtag(hashtag))


def verify_request_fields(
    names_to_types: Dict[str, type]
) -> Union[Response, None]:
    data = request.get_json(silent=True)
    if data is None:
        return make_response(
            jsonify(
                {"success": False, "message": "Missing or invalid JSON body"}
            ),
            400,
        )
    for name, expected_type in names_to_types.items():
        if name not in data:
            return make_response(
                jsonify(
                    {"success": False, "message": f"Request missing field: {name}"}
                ),
                400,
            )
        actual_type = type(data[name])
        if actual_type != expected_type:
            return make_response(
                jsonify(
                    {
                        "success": False,
                        "message": f"Request field {name} had wrong type - expected {expected_type.__name__} but got {actual_type.__name__}",
                    }
                ),
                400,
            )
    return None


@jwt_required()
def rebloom(id_str):
    try:
        original_bloom_id = int(id_str)
    except ValueError:
        return make_response(
            jsonify({"success": False, "message": "Invalid bloom id"}), 
            400
        )

    current_user = get_current_user()
    
    new_rebloom = blooms.add_rebloom(
        current_user=current_user, 
        original_bloom_id=original_bloom_id
    )
    
    if new_rebloom is None:
        return make_response(
            jsonify({"success": False, "message": "Original bloom not found"}), 
            404
        )

    return jsonify({
        "success": True,
        "bloom": new_rebloom
    })
