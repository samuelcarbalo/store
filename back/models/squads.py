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
        squad = db.squads.find_one({"_id": ObjectId(squad_id), "squad_name": squad_name})
        squad["_id"] = str(squad["_id"])
        return squad
    
    @staticmethod
    def update_squad(torneo_id, squad_id, data):
        update_data = data
        if squad_id:
            squad = db.squads.find_one({"_id": ObjectId(squad_id)})
            if squad:
                # Eliminar campos None
                update_data = {k: v for k, v in update_data.items() if v is not None}
                
                result = db.squads.update_one(
                    {"_id": ObjectId(squad_id)},
                    {"$set": update_data}
                )
                
                if result.modified_count == 0:
                    print("......")
                    return None
                else:
                    print("...actualizado...")
                    return {
                        "succes": True
                    }
        else:
            update_data = {k: v for k, v in update_data.items() if v is not None}
            update_data["torneo_id"] = torneo_id
            result = db.squads.insert_one(update_data)
            return {
                "succes": True
            }


    @staticmethod
    def delete_squad(_id):
        squad = db.squads.delete_one({"_id": ObjectId(_id)})
        return {
            "deleted": True
        }










