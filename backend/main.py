import os
import random

from custom_json_provider import CustomJsonProvider
from data import blooms, follows, lookup_user, register_user, users

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

CORS(app)

MINIMUM_PASSWORD_LENGTH = 5


@app.route("/login", methods=["POST"])
def login():
    type_check_error = verify_request_fields({"username": str, "password": str})
    if type_check_error is not None:
        return type_check_error
    if request.json["username"] not in users:
        return make_response(({"success": False, "reason": "Unknown user"}, 403))
    user = users[request.json["username"]]
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
    if request.json["username"] in users:
        return make_response(({"success": False, "reason": "User already exists"}, 400))
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
    register_user(request.json["username"], request.json["password"])
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

    return jsonify(
        {
            "username": username,
            "follows": list(follows.get(username)),
            "followers": list(follows.get_inverse(username)),
        }
    )


@app.route("/profile/<profile_username>")
@jwt_required(optional=True)
def other_profile(profile_username):
    current_user = get_current_user()

    followers = follows.get_inverse(profile_username)
    all_blooms = blooms.get_blooms_for_user(profile_username)
    all_blooms.reverse()
    return jsonify(
        {
            "username": profile_username,
            "recent_blooms": all_blooms[:10],
            "follows": list(follows.get(profile_username)),
            "followers": list(followers),
            "is_following": current_user is not None
            and current_user.username in followers,
            "is_self": current_user is not None
            and current_user.username == profile_username,
            "total_blooms": len(all_blooms),
        }
    )


@app.route("/follow", methods=["POST"])
@jwt_required()
def follow():
    type_check_error = verify_request_fields({"follow_username": str})
    if type_check_error is not None:
        return type_check_error

    username = get_current_user().username

    follow_username = request.json["follow_username"]
    if follow_username not in users:
        return make_response(
            (f"Cannot follow {follow_username} - user does not exist", 404)
        )

    follows.add(username, follow_username)
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

    username = get_current_user().username

    blooms.add_bloom(sender=username, content=request.json["content"])

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
    current_user = get_current_user().username

    followed_users = follows.get(current_user)
    nested_user_blooms = [
        blooms.get_blooms_for_user(followed_user, limit=50)
        for followed_user in followed_users
    ]
    user_blooms = [bloom for blooms in nested_user_blooms for bloom in blooms]
    sorted_user_blooms = list(
        sorted(user_blooms, key=lambda bloom: bloom.sent_timestamp, reverse=True)
    )

    return jsonify(sorted_user_blooms)


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

    current_user = get_current_user().username

    existing_follows = follows.get(current_user)

    suggestions = []
    all_users = list(users.keys())
    random.shuffle(all_users)
    for user in all_users:
        if user == current_user:
            continue
        if user not in existing_follows:
            suggestions.append({"username": user})
        if len(suggestions) >= limit_int:
            break
    return jsonify(suggestions)


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
