# --- Imports ---
import os
import re
import random
from flask import Blueprint, request, jsonify, session
from datetime import datetime
from bson import ObjectId
from functools import wraps
from pymongo import MongoClient
from models.templates import Template
from models.torunaments import Tournament


# --- Blueprint Initialization ---
roster_bp = Blueprint('roster', __name__)

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


# Consider changing to PUT method
@roster_bp.route('/<template_id>/squads/<squad_id>/template/edit', methods=['POST'])
@admin_required
def update_template_squad_id(template_id, squad_id):
    import pandas as pd
    if 'plantilla' not in request.files:
        return jsonify({"error": "No se envió archivo"}), 400
    try:
        file = request.files['plantilla']
        if file.filename == '':
            return jsonify({"error": "Nombre de archivo vacío"}), 400
        if file and allowed_file(file.filename):
            # Procesar el archivo Excel
            df = pd.read_excel(file)
            # Convertir a formato JSON para guardar en MongoDB
            df = df.loc[:, ~df.columns.str.contains('^Unnamed')]
            jugadores = df.to_dict('records')
            # Actualizar la plantilla en la base de datos
            print(jugadores)
            squad = Template.add_template_squad(
                template_id, squad_id, jugadores)
            if not squad:
                return jsonify({"error": "Plantilla no actualizada"}), 404

            return jsonify({
                "success": True,
                "message": "Plantilla actualizada",
                "jugadores": squad
            })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


def allowed_file(filename):
    return '.' in filename and \
        filename.rsplit('.', 1)[1].lower() in ['xlsx', 'xls']


@roster_bp.route('/<template_id>/squad/<squad_id>/template', methods=['GET'])
@admin_required
def ver_plantilla(template_id, squad_id):
    try:
        squad = Template.get_template_squad(template_id, squad_id)
        # equipo = db.equipos.find_one({"_id": ObjectId(squad_id)})
        if not squad:
            return jsonify({"error": "Plantilla no encontrada"}), 404

        # # Convertir ObjectId y otros campos necesarios
        # equipo['_id'] = str(equipo['_id'])

        # # Obtener estadísticas del equipo
        # estadisticas = db.estadisticas.find_one({"equipoId": ObjectId(squad_id)}) or {}

        # Obtener partidos del equipo
        # partidos = list(db.partidos.find({
        #     "$or": [
        #         {"equipoLocalId": ObjectId(squad_id)},
        #         {"equipoVisitanteId": ObjectId(squad_id)}
        #     ]
        # }).sort("fecha", 1))
        return squad
        # return render_template(
        #     'plantilla_equipo.html',
        #     equipo=equipo,
        #     estadisticas=estadisticas,
        #     partidos=partidos
        # )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@roster_bp.route('/<template_id>/squad/<squad_id>/<user_id>', methods=['GET'])
@admin_required
def get_player_edit(template_id, squad_id, user_id):
    user_squad = Template.get_player_squad(template_id, squad_id, user_id)
    try:
        if not user_squad:
            return jsonify({"error": "Jugador no encontrado"}), 404
        return user_squad
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@roster_bp.route('/<template_id>/squad/<squad_id>/player/<user_id>', methods=['POST'])
@admin_required
def update_player_edit(template_id, squad_id, user_id):
    try:
        data = request.get_json()
        email = data["squad_email"]
        if email:
            validate_ = validar_correo(email)
            if validate_ == False:
                # Consider 404 if ID not found
                return jsonify({"warning": "El correo no es valido"}), 500

        user_squad = Template.update_player_squad(
            template_id, squad_id, user_id, data)
        if not user_squad:
            return jsonify({"error": "Jugador no encontrado"}), 404
        return user_squad
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Consider changing to DELETE method
@roster_bp.route('/player/delete/<squad_id>/', methods=['GET'])
@admin_required
def delete_player_id(squad_id):
    try:
        player = Template.delete_player(squad_id)
        if not player:
            return jsonify({"error": "Jugador no encontrado"}), 404
        # Return success message
        return jsonify({"success": True, "message": "Jugador eliminado"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@roster_bp.route('/<template_id>/generate-groups/', methods=['POST'])
@admin_required
def generate_random_groups(template_id):
    try:
        list_squads = Template.find_template_squads(template_id)
        torneo = Tournament.find_tournament(template_id)
        if not torneo or not torneo.get('tieneFaseGrupos'):
            return jsonify({"error": "Este torneo no tiene configurada una fase de grupos."}), 400
        # 2. Obtener datos de la fase de grupos
        fase_grupos_config = torneo.get('faseGrupos', {})
        try:
            cantidad_grupos = int(fase_grupos_config.get('cantidadGrupos', 1))
        except (ValueError, TypeError):
            return jsonify({"error": "La cantidad de grupos no es un número válido."}), 400

        if not list_squads:
            return jsonify({"error": "Jugador no encontrado"}), 404
        group_delete = Template.delete_groups(template_id)
        squads = list_squads["squads"]
        random.shuffle(squads)
        # 6. Distribuir equipos en grupos (Round-robin)
        groups_dis = [[] for _ in range(cantidad_grupos)]
        for i, equipo in enumerate(squads):
            grupo_index = i % cantidad_grupos
            groups_dis[grupo_index].append({
                "squad_id": equipo['_id'],
                "squad_name": equipo['squad_name'],
                "logo": equipo.get('logo', '')
            })

        # 7. Guardar los nuevos groups en la colección 'groups'
        docs_para_insertar = []
        for i, grupo_squads in enumerate(groups_dis):
            doc_grupo = {
                "template_id": ObjectId(template_id),
                "squad_name": f"Grupo {chr(65 + i)}",  # Grupo A, Grupo B, etc.
                "squads": grupo_squads
            }
            docs_para_insertar.append(doc_grupo)

        if docs_para_insertar:
            group_add = Template.add_groups(docs_para_insertar)
        return jsonify({"message": f"Se han generado {cantidad_grupos} groups exitosamente."}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@roster_bp.route('/<tournament_id>/groups/', methods=['GET'])
@admin_required
def get_groups(tournament_id):
    try:
        # Consultar todos los groups para el template_id especificado
        groups = Template.find_groups(tournament_id)

        if not groups:
            return jsonify({"error": "Grupos no encontrados"}), 404

        return jsonify(groups), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
