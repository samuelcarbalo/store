from flask import Blueprint, request, jsonify
from models.user import User
import jwt
import os

sports_bp = Blueprint('sports', __name__)

SPORTS_DATA = {
    "football": {
        "name": "Fútbol",
        "news": [],
        "events": []
    },
    "basketball": {
        "name": "Baloncesto",
        "news": [],
        "events": []
    },
    "tennis": {
        "name": "Tenis",
        "news": [],
        "events": []
    },
    "swimming": {
        "name": "Natación",
        "news": [],
        "events": []
    }
}

@sports_bp.route('/', methods=['GET'])
def get_sports():
    return jsonify(SPORTS_DATA)

@sports_bp.route('/<sport_name>/favorite', methods=['POST'])
def add_favorite_sport(sport_name):
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({"error": "Token requerido"}), 401
    
    try:
        payload = jwt.decode(token, os.getenv("SECRET_KEY"), algorithms=['HS256'])
        user_id = payload['sub']
        
        if sport_name not in SPORTS_DATA:
            return jsonify({"error": "Deporte no válido"}), 400
            
        User.add_favorite_sport(user_id, sport_name)
        return jsonify({"message": f"{SPORTS_DATA[sport_name]['name']} añadido a favoritos"})
    
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token expirado"}), 401
    except jwt.JWTError:
        return jsonify({"error": "Token inválido"}), 401