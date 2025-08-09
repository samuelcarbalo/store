# --- Imports ---
import os
import re
import random
from flask import Blueprint, request, jsonify, session
from datetime import datetime
from bson import ObjectId
from functools import wraps
from pymongo import MongoClient
from models.statistics import Stats
from models.torunaments import Tournament


# --- Blueprint Initialization ---
stats_bp = Blueprint('stats', __name__)

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


@stats_bp.route('/admin/<tournament_id>', methods=['GET'])
@admin_required
def get_stats(tournament_id):
    try:
        squad = Stats.get_stats_squad(tournament_id)
        # equipo = db.equipos.find_one({"_id": ObjectId(squad_id)})
        if not squad:
            return jsonify({"error": "Plantilla no encontrada"}), 404

        return squad
    except Exception as e:
        return jsonify({"error": str(e)}), 500
