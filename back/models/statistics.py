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


class Stats:
    @staticmethod
    def get_stats_squad(tournament_id):
        stat_squads = list(db.player.find(
            {"tournament_id": tournament_id}))
        result = {
            "squad": stat_squads,
            "count_squad": len(stat_squads)
        }
        return result
