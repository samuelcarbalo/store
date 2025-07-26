from flask import Blueprint, request, jsonify
from flask import session
from models.user import User
import jwt
import os
from datetime import datetime, timedelta
from functools import wraps
auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        print(1)
        data = request.get_json()
        if not data:
            return jsonify({"error": "No se proporcionaron datos"}), 400
            
        email = data.get('email')
        password = data.get('password')
        name = data.get('name')
        
        if not all([email, password, name]):
            return jsonify({"error": "Faltan campos requeridos"}), 400
        
        user_id = User.create_user(email, password, name)
        if not user_id:
            return jsonify({"error": "El usuario ya existe"}), 409
        
        # Crear token JWT para auto-login después de registro
        token = jwt.encode({
            'sub': user_id,
            'email': email,
            'name': name,
            'exp': datetime.utcnow() + timedelta(hours=24)
        }, os.getenv("SECRET_KEY"), algorithm='HS256')
        session["sub"] = user_id
        session["email"] = email
        session["token"] = token
        session["name"] = name
        return jsonify({
            "message": "Usuario registrado exitosamente",
            "user_id": user_id,
            "name": name,
            "email": email,
            "token": token
        }), 201
        
    except Exception as e:
        print("Error en registro:", str(e))
        return jsonify({"error": "Error interno del servidor"}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No se proporcionaron datos"}), 400
         
        email = data.get('email')
        password = data.get('password')
        
        user = User.authenticate_user(email, password)
        if not user:
            return jsonify({"error": "Credenciales inválidas"}), 401
        
        # Crear token JWT
        token = jwt.encode({
            'sub': str(user['_id']),
            'email': user['email'],
            'name': user['name'],
            'exp': datetime.utcnow() + timedelta(hours=24)
        }, os.getenv("SECRET_KEY"), algorithm='HS256')
        if token:
            session["token"] = token
            session["logged_in"] = True
            if "superUser" in user:
                super_ = user["superUser"]
                type_ = user["type"]
                if super_ == True:
                    session["superUser"] = user["superUser"]
                    session["type"] = user["type"][0]
                    data_sup = super_
            else:
                session["superUser"] = False


        if user:
            session["user_id"] = str(user['_id'])
            session["name"] = user['name']
            session["email"] = user['email']
        return jsonify({
            "token": token,
            "user_id": str(user['_id']),
            "name": user['name'],
            "email": user['email'],
        })
        
    except Exception as e:
        print("Error en login:", str(e))
        return jsonify({"error": "Error interno del servidor"}), 

@auth_bp.route('/check-session', methods=['POST'])
def check_session():
    if not session.get('logged_in'):
        return jsonify({"authenticated": False}), 200
    
    return jsonify({
        "authenticated": True,
        "user": {
            "id": session.get('user_id'),
            "name": session.get('name'),
            "email": session.get('email'),
            "is_superuser": session.get('superUser')
        }
    }), 200
@auth_bp.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({"message": "Sesión cerrada"})
    # Decorador para proteger rutas que requieren autenticación


