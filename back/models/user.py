from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash
import os
from dotenv import load_dotenv

load_dotenv()

client = MongoClient(os.getenv("MONGO_URI"))
db = client.sports_web

class User:
    @staticmethod
    def create_user(email, password, name):
        if db.users.find_one({"email": email}):
            return None  # Usuario ya existe
        
        hashed_pw = generate_password_hash(password)
        user = {
            "email": email,
            "password": hashed_pw,
            "name": name,
            "favorite_sports": []
        }
        
        result = db.users.insert_one(user)
        return str(result.inserted_id)

    @staticmethod
    def authenticate_user(email, password):
        user = db.users.find_one({"email": email})
        if user and check_password_hash(user["password"], password):
            return user
        return None

    @staticmethod
    def add_favorite_sport(user_id, sport):
        db.users.update_one(
            {"_id": user_id},
            {"$addToSet": {"favorite_sports": sport}}
        )
   
    @staticmethod
    def find_token(user_id):
        user = db.users.find_one({"_id": user_id})
        return user
        
    