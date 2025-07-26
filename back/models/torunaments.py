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

class Tournament:
    @staticmethod
    def create_tournament(nombre, tipo, modalidad, lugar, temporada, fechaInicio):
        print("aqui estoy")
        if db.tournaments.find_one({"nombre": nombre}):
            print(db.tournaments.find_one({"nombre": nombre}))
            return None  # Usuario ya existe
        date = datetime.datetime.utcnow()
        id = session["user_id"]
        tournament = {
            "nombre": nombre,
            "tipo": tipo,
            "modalidad": modalidad,
            "lugar": lugar,
            "fechaInicio": fechaInicio,
            "temporada": temporada,
            "creadoPor": id,
            "fechaCreacion": date,
            "eliminacionDirecta": {
                "rondaInicial": "",
                "partido3erPuesto": False
            },
            "faseGrupos": {
                "cantidadGrupos": "",
                "equiposPorGrupo": "",
                "equiposClasifican": "",
                "idaVuelta": False
            },
            "tieneEliminacionDirecta": False,
            "tieneFaseGrupos": False,
            "estado": "activo"
        }
        print(tournament)
        result = db.tournaments.insert_one(tournament)
        try:
            if result.acknowledged:
                print(f"Document inserted successfully. ID: {result.inserted_id}")
                # This will work because insert_result is an InsertOneResult object
                print(f"Type of inserted_id: {type(result.inserted_id)}")
                returned_id_str = str(result.inserted_id) # This line will NOT cause an error
                print(f"Returned ID as string: {returned_id_str}")
                return returned_id_str
            else:
                print("Insert operation was not acknowledged.")
                return None
        except:
            return None

    @staticmethod
    def find_tournament(tournament_id):
        tournament = db.tournaments.find_one({"_id": tournament_id})
        return tournament
   
    @staticmethod
    def find_tournament_squads(tournament_id):
        tournament = db.tournaments.find_one({"_id": ObjectId(tournament_id)})
        print(tournament, "tournament-----")
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

    @staticmethod
    def find_all_tournament():
        tournament = list(db.tournaments.find({}))
        # Convertir ObjectId y datetime a strings
        for torneo in tournament:
            torneo['_id'] = str(torneo['_id'])
            torneo['fechaInicio'] = torneo['fechaInicio']
        return tournament
        
    @staticmethod
    def find_tournament(_id):
        torneo = db.tournaments.find_one({"_id": ObjectId(_id)})
        print(torneo, "find_tournament...")
        return torneo
    
    @staticmethod
    def update_tournaments(data, torneo_id):
        update_data = data
        # Eliminar campos None
        update_data = {k: v for k, v in update_data.items() if v is not None}
        
        result = db.tournaments.update_one(
            {"_id": ObjectId(torneo_id)},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            return None
        else:
            if "cupoEquipos" in data:
                list_squads = list(db.squads.find({"torneo_id": torneo_id}))
                cantd = int(data["cupoEquipos"])
                current_cantd = len(list_squads)
                count = 0
                if cantd == current_cantd:
                    pass
                elif current_cantd < cantd:
                    diff = cantd - current_cantd
                    for _ in range(diff):
                        # Add a new, empty dictionary. You might want to customize this.
                        count += 1
                        squad = {
                            "squad_name": "equipo " + str(count),
                            "squad_owner": "",
                            "squad_email": "",
                            "squad_phone": "",
                            "pj": 0,
                            "pg": 0,
                            "pp": 0,
                            "pe": 0,
                            "gf": 0,
                            "gc": 0,
                            "dg": 0,
                            "pts": 0,
                            "red_cards": 0,
                            "yellow_cards": 0,
                            "torneo_id": torneo_id
                        }
                        res = db.squads.insert_one(squad)
                elif current_cantd > cantd:
                    diff = current_cantd - cantd
                    delete_item_ids = [] # Store ObjectIds for deletion
                    for _ in range(diff):
                        if list_squads:
                            # Corrected line: Call .pop() to get the item
                            removed_item = list_squads.pop()
                            delete_item_ids.append(removed_item["_id"]) # Append the ObjectId

                    if delete_item_ids:
                        # Delete many documents by their IDs
                        db.squads.delete_many({"_id": {"$in": delete_item_ids}})
            return result

    @staticmethod
    def delete_tournament(_id):
        torneo = db.tournaments.delete_one({"_id": ObjectId(_id)})
        return {
            "deleted": True
        }

    








    