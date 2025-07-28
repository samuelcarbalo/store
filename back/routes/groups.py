# --- Imports ---
from flask import Blueprint, request, jsonify, session
from datetime import datetime
from bson import ObjectId
from functools import wraps
from pymongo import MongoClient
import os
import re
import random
# Assuming 'models.torunaments' is correctly spelled and accessible
from models.squads import Squad

# --- Blueprint Initialization ---
squad_bp = Blueprint('groups', __name__)

# --- Database Connection ---
client = MongoClient(os.getenv("MONGO_URI"))
db = client.sports_web

# --- Decorators ---


def admin_required(f):
    """
    Decorator to ensure that only super users can access certain routes.
    Checks for 'superUser' in the Flask session.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('superUser', False):
            return jsonify({"error": "Acceso no autorizado"}), 403
        return f(*args, **kwargs)
    return decorated_function


def validar_correo(email):
    patron = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if re.fullmatch(patron, email):
        return True
    else:
        return False


@squad_bp.route('/squads/<squad_id>/<squad_name>', methods=['GET'])
@admin_required
def get_squad_id(squad_id, squad_name):
    try:
        squad = Squad.find_squad(squad_id, squad_name)
        if not squad:
            return jsonify({"error": "Equipo no encontrado"}), 404
        return jsonify(squad)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Consider changing to PUT method
@squad_bp.route('/<Squad_id>/squads/update/<squad_id>/', methods=['POST'])
@admin_required
def update_squad_id(Squad_id, squad_id):
    try:
        data = request.get_json()
        email = data["squad_email"]
        validate_ = validar_correo(email)
        print(validate_)
        if validate_ == False:
            # Consider 404 if ID not found
            return jsonify({"warning": "El correo no es valido"}), 500

        squad = Squad.update_squad(Squad_id, squad_id, data)
        if not squad:
            print(squad)  # Consider using a proper logger instead of print
            return jsonify({"error": "Equipo no encontrado o no se pudo actualizar"}), 404
        # Return a success message rather than the updated object
        return jsonify(squad)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Consider changing to PUT method
@squad_bp.route('/<Squad_id>/squads/update/', methods=['POST'])
@admin_required
def update_squad_c(Squad_id):
    try:
        data = request.get_json()
        squad_id = None
        print(data)  # Consider using a proper logger instead of print
        squad = Squad.update_squad(Squad_id, squad_id, data)
        if not squad:
            print(squad)  # Consider using a proper logger instead of print
            return jsonify({"error": "Equipo no encontrado o no se pudo actualizar"}), 404
        # Return a success message rather than the updated object
        return jsonify(squad)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Consider changing to DELETE method
@squad_bp.route('/squads/delete/<squad_id>/', methods=['GET'])
@admin_required
def delete_squad_id(squad_id):
    try:
        squad = Squad.delete_squad(squad_id)
        if not squad:
            return jsonify({"error": "Equipo no encontrado"}), 404
        # Return success message
        return jsonify({"success": True, "message": "Equipo eliminado"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
