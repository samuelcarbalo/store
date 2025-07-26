# --- Imports ---
import os
import re
import random
from flask import Blueprint, request, jsonify, session
from datetime import datetime
from bson import ObjectId
from functools import wraps
from pymongo import MongoClient
from models.torunaments import Tournament 

# --- Blueprint Initialization ---
tournament_bp = Blueprint('competition', __name__)

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

# --- Tournament Routes ---

# --- GET Endpoints ---
@tournament_bp.route('/list', methods=['GET'])
@admin_required
def get_tournaments():
    """
    Retrieves a list of all tournaments.
    Requires admin privileges.
    """
    try:
        result = Tournament.find_all_tournament()
        print("----find_all_tournament-----", result) # Consider using a proper logger instead of print
        return jsonify(result)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@tournament_bp.route('/<tournament_id>', methods=['GET'])
@admin_required
def get_tournament(tournament_id):
    """
    Retrieves a single tournament by its ID for editing purposes.
    Requires admin privileges.
    """
    try:
        torneo = Tournament.find_tournament(tournament_id)
        print(torneo) # Consider using a proper logger instead of print
        if not torneo:
            return jsonify({"error": "Torneo no encontrado"}), 404
        
        # Convert ObjectId and datetime objects for JSON serialization
        torneo['_id'] = str(torneo['_id'])
        if 'fechaInicio' in torneo and isinstance(torneo['fechaInicio'], datetime):
            torneo['fechaInicio'] = torneo['fechaInicio'].isoformat() # Ensure date is correctly formatted
            
        return jsonify(torneo)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@tournament_bp.route('/config/<tournament_id>/squads', methods=['GET'])
@admin_required
def get_squads_config(tournament_id):
    """
    Retrieves the squads associated with a specific tournament for configuration.
    Requires admin privileges.
    """
    try:
        squads = Tournament.find_tournament_squads(tournament_id)
        if not squads:
            return jsonify({"error": "Torneo o equipos no encontrados"}), 404
        return jsonify(squads)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- POST Endpoints ---
@tournament_bp.route('/torneos', methods=['POST'])
@admin_required
def create_tournament():
    """
    Creates a new tournament with the provided data.
    Requires admin privileges.
    """
    print("crear torneo") # Consider using a proper logger instead of print
    try:
        data = request.get_json()
        
        # Basic validation for required fields
        required_fields = ['nombre', 'tipo', 'modalidad', 'lugar', 'fechaInicio', 'temporada']
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Faltan campos requeridos"}), 400
        
        result = Tournament.create_tournament(
            data['nombre'],
            data['tipo'],
            data['modalidad'],
            data['lugar'],
            data['temporada'],
            data['fechaInicio'],
        )
        
        if result:
            return jsonify({
                "success": True,
                "tournament_id": result # Assuming result is the ID of the created tournament
            })
        else:
            return jsonify({
                "success": False,
                "tournament_id": "no se pudo crear"
            })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- PUT Endpoints ---
@tournament_bp.route('/v1/<tournament_id>', methods=['PUT'])
@admin_required
def update_tournament(tournament_id):
    """
    Updates an existing tournament by its ID.
    Requires admin privileges.
    """
    try:
        data = request.get_json()
        print("-----update_torneo-------", data) # Consider using a proper logger instead of print
        # Convert fechaInicio string to datetime object
        if 'fechaInicio' in data and data['fechaInicio']:
            data["fechaInicio"] = datetime.fromisoformat(data['fechaInicio'])
        else:
            data.pop('fechaInicio', None) # Remove if empty or not provided

        data["actualizadoEn"] = datetime.utcnow()
        result = Tournament.update_tournaments(data, tournament_id)
        print("resultado acutalizacion-----------", result)
        if not result:
            return jsonify({"warning": "No se realizaron cambios"}), 200 # Consider 404 if ID not found
            
        return jsonify({"success": True, "message": "Torneo actualizado"})
        
    except Exception as e:
        print({"error": str(e)})
        return jsonify({"error": str(e)}), 500

# --- DELETE Endpoints ---
@tournament_bp.route('/delete/<tournament_id>', methods=['DELETE']) # Changed to DELETE method
@admin_required
def delete_tournament(tournament_id):
    """
    Deletes a tournament by its ID.
    Requires admin privileges.
    note: It's more conventional to use the DELETE HTTP method for deletion.
    """
    try:
        # Assuming delete_tournament returns True on success, False if not found
        success = Tournament.delete_tournament(tournament_id)
        if not success:
            return jsonify({"error": "Torneo no encontrado"}), 404
        return jsonify({"success": True, "message": "Torneo eliminado correctamente"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500