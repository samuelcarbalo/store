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


class Squad:
    @staticmethod
    def find_squad(squad_id, squad_name):
        squad = db.squads.find_one(
            {"_id": ObjectId(squad_id), "squad_name": squad_name})
        squad["_id"] = str(squad["_id"])
        return squad

    @staticmethod
    def update_squad(torneo_id, squad_id, data):
        update_data = data
        if squad_id:
            squad = db.squads.find_one({"_id": ObjectId(squad_id)})
            if squad:
                # Eliminar campos None de los datos que queremos actualizar
                # Esto asegura que no intentamos establecer un campo a None si no se proporcionó un valor
                fields_to_update = {k: v for k,
                                    v in update_data.items() if v is not None}

                # Si no hay campos válidos para actualizar, salimos
                if not fields_to_update:
                    print("No hay campos válidos para actualizar.")
                    return None

                # Usar $set solo para los campos que están en fields_to_update
                result = db.squads.update_one(
                    {"_id": ObjectId(squad_id)},
                    {"$set": fields_to_update}
                )

                if result.modified_count == 0:
                    print("No se realizaron cambios o el documento no se encontró.")
                    return None
                else:
                    print("...actualizado...")
                    return {
                        "succes": True
                    }
            else:
                print("Escuadra no encontrada para el ID proporcionado.")
                return None  # O podrías lanzar una excepción o devolver un error diferente
        else:
            # Esto es para la creación de un nuevo documento, lo cual ya funciona bien.
            # Solo asegúrate de que 'torneo_id' se añada correctamente.
            create_data = {k: v for k, v in update_data.items()
                           if v is not None}
            create_data["torneo_id"] = torneo_id
            result = db.squads.insert_one(create_data)
            return {
                "succes": True,
                # Opcional: devolver el ID del nuevo documento
                "id": str(result.inserted_id)
            }

    @staticmethod
    def delete_squad(_id):
        squad = db.squads.delete_one({"_id": ObjectId(_id)})
        return {
            "deleted": True
        }
