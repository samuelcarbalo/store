from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash
import os
from dotenv import load_dotenv
from bson import ObjectId
from flask import session
import datetime
load_dotenv()

client = MongoClient(os.getenv("MONGO_URI"))
db = client.sports_web


class Template:
    @staticmethod
    def add_template_squad(tournament_id, squad_id, jugadores):
        for player in jugadores:
            # Usando una comprensión de diccionario
            cleaned_dict = {
                key: value
                for key, value in player.items()
                if value is not None and value != "" and value != [] and value != {}
            }
            player_item = {
                "squad_id": squad_id,
                "tournament_id": tournament_id,
                "number": cleaned_dict["NUMERO"],
                "name_player": cleaned_dict["NOMBRE COMPLETO"],
                "document": cleaned_dict["DOCUMENTO DE IDENTIDAD"],
                "phone": cleaned_dict["NUMERO DE CELULAR"],
                "age": cleaned_dict["EDAD"],
                "blood_type": cleaned_dict["TIPO DE SANGRE"],
                "date_birth": cleaned_dict["FECHA DE NACIMEINTO"],
                "goals": 0,
                "pj": 0,
                "red_cards": 0,
                "yellow_cards": 0,
                "email": "",
            }
            if "BAUTIZADO (SI/NO)" in cleaned_dict:
                player_item["baptized"] = cleaned_dict["BAUTIZADO (SI/NO)"]
            if "NOMBRE DE LA IGLESIA (SOLO PARA INVITADOS)" in cleaned_dict:
                player_item["guest_church"] = cleaned_dict[
                    "NOMBRE DE LA IGLESIA (SOLO PARA INVITADOS)"]
            if "VETERANO (SI/NO)" in cleaned_dict:
                player_item["veteran"] = cleaned_dict["VETERANO (SI/NO)"]
            player_squad = db.player.insert_one(player_item)

        print(jugadores)
        return len(jugadores)

    @staticmethod
    def get_template_squad(tournament_id, squad_id):
        from datetime import datetime, date
        player_squad = list(db.player.find(
            {"tournament_id": tournament_id, "squad_id": squad_id}))
        for player in player_squad:
            # Fecha de nacimiento como string
            fecha_str = player["date_birth"]
            # Convertir a objeto datetime
            try:
                fecha_nacimiento = fecha_str.date()
            except:
                fecha_nacimiento = datetime.strptime(fecha_str, '%Y-%m-%d')
            hoy = date.today()

            # Calcular edad
            edad = hoy.year - fecha_nacimiento.year - \
                ((hoy.month, hoy.day) < (fecha_nacimiento.month, fecha_nacimiento.day))
            player["age"] = edad
            player["_id"] = str(player["_id"])
        sort_player_squad = sorted(
            player_squad, key=lambda item: item['number'])
        print(sort_player_squad)
        result = {
            "squad": sort_player_squad,
            "count_squad": len(player_squad)
        }
        return result

    def get_player_squad(tournament_id, squad_id, user_id):
        from datetime import datetime, date
        player_squad = db.player.find_one({
            "_id": ObjectId(user_id),
            "tournament_id": tournament_id,
            "squad_id": squad_id
        })

        fecha_str = player_squad["date_birth"]
        # Convertir a objeto datetime
        try:
            fecha_nacimiento = fecha_str.date()
        except:
            fecha_nacimiento = datetime.strptime(fecha_str, '%Y-%m-%d')
        hoy = date.today()

        # Calcular edad
        edad = hoy.year - fecha_nacimiento.year - \
            ((hoy.month, hoy.day) < (fecha_nacimiento.month, fecha_nacimiento.day))
        player_squad["age"] = edad
        player_squad["_id"] = str(player_squad["_id"])

        return player_squad

    def update_player_squad(tournament_id, squad_id, user_id, data):
        update_data = data
        try:
            player = db.player.find_one({"_id": ObjectId(user_id)})
            if player:
                # Eliminar campos None
                update_data = {k: v for k,
                               v in update_data.items() if v is not None}
                result = db.player.update_one(
                    {"_id": ObjectId(user_id)},
                    {"$set": update_data}
                )
                if result.modified_count == 0:
                    return None
                else:
                    return {
                        "succes": True
                    }
        except:
            player_item = {
                "squad_id": squad_id,
                "tournament_id": tournament_id,
                "goals": 0,
                "pj": 0,
                "red_cards": 0,
                "yellow_cards": 0,
            }
            player_item.update(data)
            player_squad = db.player.insert_one(player_item)
            return {
                "succes": True,
                "result": "jugador agregado exitosamente"
            }

    @staticmethod
    def delete_player(_id):
        player = db.player.delete_one({"_id": ObjectId(_id)})
        return {
            "deleted": True
        }

    @staticmethod
    def delete_groups(tournament_id):
        tournament_ = str(tournament_id)
        group = db.groups.delete_many(
            {"template_id": ObjectId(tournament_)})
        return {
            "deleted": True
        }

    def add_groups(docs_para_insertar):
        group = db.groups.insert_many(docs_para_insertar)
        return {
            "success":  True
        }

    def find_groups(tournament_id):
        groups = list(db.groups.find(
            {"template_id": ObjectId(tournament_id)}))
        # Convertir ObjectId a string para que sea serializable en
        try:
            count = 0
            for grupo in groups:
                grupo['_id'] = str(grupo['_id'])
                grupo['template_id'] = str(grupo['template_id'])
                grupo['tournament_id'] = str(grupo['template_id'])
                for equipo in grupo['squads']:
                    count += 1
                    equipo['squad_id'] = str(equipo['squad_id'])
                    squad_ = db.squads.find_one(
                        {"_id": ObjectId(equipo['squad_id'])})
                    equipo['pj'] = squad_["pj"]
                    equipo['pg'] = squad_["pg"]
                    equipo['pp'] = squad_["pp"]
                    equipo['pe'] = squad_["pe"]
                    equipo['gf'] = squad_["gf"]
                    equipo['gc'] = squad_["gc"]
                    equipo['dg'] = squad_["dg"]
                    equipo['pts'] = squad_["pts"]
        except Exception as e:
            print("Error al convertir ObjectId a string:", str(e))
            print(count)
            return []
        return groups

    @staticmethod
    def find_template_squads(tournament_id):
        tournament = db.tournaments.find_one({"_id": ObjectId(tournament_id)})
        list_squads = list(db.squads.find(
            {"torneo_id": tournament_id}, {
                "_id": 1,
                "squad_name": 1,
                "logo": 1,
                "squad_owner": 1,
                "squad_email": 1,
                "squad_phone": 1,
                "torneo_id": 1,
            }
        ))
        result = {}
        if tournament:
            if "cupoEquipos" in tournament:
                result["cupoEquipos"] = tournament["cupoEquipos"]
            else:
                result["cupoEquipos"] = 8
        for squad in list_squads:
            squad.pop("plantilla", None)
            squad["_id"] = str(squad["_id"])
        result["squads"] = list_squads
        return result
