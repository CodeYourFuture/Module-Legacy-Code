import os
import random

from custom_json_provider import CustomJsonProvider
from data import blooms
from data.follows import follow, get_followed_usernames, get_inverse_followed_usernames
from data.users import UserRegistrationError, get_all_users, get_user, lookup_user, register_user

from dotenv import load_dotenv
from flask import Flask, Response, jsonify, make_response, request
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    get_current_user,
    jwt_required,
)

from datetime import timedelta
from typing import Dict, Union

app = Flask("PurpleForest")

app.json = CustomJsonProvider(app)

# Configure CORS to handle preflight requests
# TODO Daniel not sure what I should have been doing so have just bunged this in for now
CORS(
    app,
    supports_credentials=True,
    resources={
        r"/*": {
            "origins": "*",
            "allow_headers": ["Content-Type", "Authorization"],
            "methods": ["GET", "POST", "OPTIONS"]
        }
    }
)

MINIMUM_PASSWORD_LENGTH = 5


@app.route("/login", methods=["POST"])
def login():
    type_check_error = verify_request_fields({"username": str, "password": str})
    if type_check_error is not None:
        return type_check_error
    user = get_user(request.json["username"])
    if user is None:
        return make_response(({"success": False, "reason": "Unknown user"}, 403))
    if not user.check_password(request.json["password"]):
        return make_response(({"success": False, "reason": "Incorrect password"}, 403))
    access_token = create_access_token(
        identity=request.json["username"], expires_delta=timedelta(days=1)
    )
    return jsonify(
        {
            "success": True,
            "token": access_token,
        }
    )


@app.route("/register", methods=["POST"])
def register():
    type_check_error = verify_request_fields({"username": str, "password": str})
    if type_check_error is not None:
        return type_check_error
    if len(request.json["password"]) < MINIMUM_PASSWORD_LENGTH:
        return make_response(
            (
                {
                    "success": False,
                    "reason": f"Password must be at least {MINIMUM_PASSWORD_LENGTH} characters long",
                },
                400,
            )
        )
    try:
      register_user(request.json["username"], request.json["password"])
    except UserRegistrationError as error:
        return jsonify(
            {
                "success": False,
                "reason": error.reason,
            }
        )
    access_token = create_access_token(
        identity=request.json["username"], expires_delta=timedelta(days=1)
    )
    return jsonify(
        {
            "success": True,
            "token": access_token,
        }
    )


@app.route("/profile")
@jwt_required()
def self_profile():
    username = get_current_user().username
    
    # Check if the user exists
    user = get_user(username)
    if user is None:
        return make_response(jsonify({
            "success": False,
            "reason": "User not found"
        }), 404)

    return jsonify(
        {
            "username": username,
            "follows": get_followed_usernames(user),
            "followers": get_inverse_followed_usernames(user),
        }
    )


@app.route("/profile/<profile_username>")
@jwt_required(optional=True)
def other_profile(profile_username):
    # Check if the user exists
    profile_user = get_user(profile_username)
    if profile_user is None:
        return make_response(jsonify({
            "success": False,
            "reason": f"User {profile_username} not found"
        }), 404)
        
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
            "is_following": current_user is not None and current_user.username in followers,
            "is_self": current_user is not None and current_user.username == profile_username,
            "total_blooms": len(all_blooms),
        }
    )


@app.route("/follow", methods=["POST"])
@jwt_required()
def do_follow():
    type_check_error = verify_request_fields({"follow_username": str})
    if type_check_error is not None:
        return type_check_error

    current_user = get_current_user()

    follow_username = request.json["follow_username"]
    follow_user = get_user(follow_username)
    if follow_user is None:
        return make_response(
            (f"Cannot follow {follow_username} - user does not exist", 404)
        )

    follow(current_user, follow_user)
    return jsonify(
        {
            "success": True,
        }
    )


@app.route("/bloom", methods=["POST"])
@jwt_required()
def send_bloom():
    type_check_error = verify_request_fields({"content": str})
    if type_check_error is not None:
        return type_check_error

    user = get_current_user()

    blooms.add_bloom(sender=user, content=request.json["content"])

    return jsonify(
        {
            "success": True,
        }
    )


@app.route("/bloom/<id_str>", methods=["GET"])
def get_bloom(id_str):
    try:
        id_int = int(id_str)
    except ValueError:
        return make_response((f"Invalid bloom id", 400))
    bloom = blooms.get_bloom(id_int)
    if bloom is None:
        return make_response((f"Bloom not found", 404))
    return jsonify(bloom)


@app.route("/home")
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
    followed_blooms = [bloom for blooms in nested_user_blooms for bloom in blooms]
    
    # Get the current user's own blooms
    own_blooms = blooms.get_blooms_for_user(current_user.username, limit=50)
    
    # Combine own blooms with followed blooms
    all_blooms = followed_blooms + own_blooms
    
    # Sort by timestamp (newest first)
    sorted_blooms = list(
        sorted(all_blooms, key=lambda bloom: bloom.sent_timestamp, reverse=True)
    )

    return jsonify(sorted_blooms)


@app.route("/blooms/<profile_username>")
def user_blooms(profile_username):
    user_blooms = blooms.get_blooms_for_user(profile_username)
    user_blooms.reverse()
    return jsonify(user_blooms)


@app.route("/suggested-follows/<limit_str>")
@jwt_required()
def suggested_follows(limit_str):
    try:
        limit_int = int(limit_str)
    except ValueError:
        return make_response((f"Invalid limit", 400))

    current_user = get_current_user()

    existing_follows = get_followed_usernames(current_user)

    suggestions = []
    all_users = get_all_users()
    random.shuffle(all_users)
    for user in all_users:
        if user == current_user.username:
            continue
        if user not in existing_follows:
            suggestions.append({"username": user})
        if len(suggestions) >= limit_int:
            break
    return jsonify(suggestions)


@app.route("/hashtag/<hashtag>")
def hashtag(hashtag):
    return jsonify(blooms.get_blooms_with_hashtag(hashtag))


def verify_request_fields(names_to_types: Dict[str, type]) -> Union[Response, None]:
    for name, expected_type in names_to_types.items():
        if name not in request.json:
            return make_response((f"Request missing field: {name}", 400))
        actual_type = type(request.json[name])
        if actual_type != expected_type:
            return make_response(
                (
                    f"Request field {name} had wrong type - expected {expected_type.__name__} but got {actual_type.__name__}",
                    400,
                )
            )
    return None


def main():
    load_dotenv()

    app.config["JWT_SECRET_KEY"] = os.environ["JWT_SECRET_KEY"]
    jwt = JWTManager(app)
    jwt.user_lookup_loader(lookup_user)

    app.run(host="0.0.0.0", port="3000", debug=True)


if __name__ == "__main__":
    main()
