# backend/database.py
import os
import json
from bson import ObjectId
import pymongo
import firebase_admin
from firebase_admin import credentials, firestore

class DatabaseManager:
    def __init__(self):
        self.db_type = "json"  # default fallback
        self.mongo_client = None
        self.mongo_db = None
        self.firestore_db = None
        # Ensure we use the root db.json (parent of backend folder) to sync with Node.js
        backend_dir = os.path.dirname(os.path.abspath(__file__))
        self.json_file_path = os.path.join(os.path.dirname(backend_dir), "db.json")

        # 1. Attempt MongoDB initialization
        mongo_uri = os.getenv("MONGODB_URI")
        if mongo_uri:
            try:
                self.mongo_client = pymongo.MongoClient(mongo_uri, serverSelectionTimeoutMS=2000)
                # Test connection
                self.mongo_client.server_info()
                self.mongo_db = self.mongo_client["finai_budget"]
                self.db_type = "mongodb"
                print("Database: Connected to MongoDB successfully.")
                return
            except Exception as e:
                print(f"Database: MongoDB connection failed ({e}). Trying Firebase...")

        # 2. Attempt Firebase initialization
        firebase_key_path = os.getenv("FIREBASE_CREDENTIALS_JSON")
        if firebase_key_path and os.path.exists(firebase_key_path):
            try:
                cred = credentials.Certificate(firebase_key_path)
                firebase_admin.initialize_app(cred)
                self.firestore_db = firestore.client()
                self.db_type = "firestore"
                print("Database: Connected to Firebase Firestore successfully.")
                return
            except Exception as e:
                print(f"Database: Firebase initialization failed ({e}).")
        
        # 3. Fallback to Local JSON
        print("Database: Running in local JSON database mode (db.json).")
        if not os.path.exists(self.json_file_path):
            with open(self.json_file_path, "w", encoding="utf-8") as f:
                json.dump({"users": [], "budgets": []}, f, indent=2, ensure_ascii=False)

    def _read_json(self):
        try:
            with open(self.json_file_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {"users": [], "budgets": []}

    def _write_json(self, data):
        with open(self.json_file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

    # --- User Operations ---

    def get_user_by_username(self, username: str):
        if self.db_type == "mongodb":
            user = self.mongo_db["users"].find_one({"username": username})
            if user:
                user["id"] = str(user["_id"])
                return user
            return None

        elif self.db_type == "firestore":
            docs = self.firestore_db.collection("users").where("username", "==", username).limit(1).get()
            for doc in docs:
                user = doc.to_dict()
                user["id"] = doc.id
                return user
            return None

        else:  # JSON
            db = self._read_json()
            user = next((u for u in db["users"] if u["username"] == username), None)
            return user

    def create_user(self, username: str, password_hash: str):
        user_data = {
            "username": username,
            "password": password_hash
        }

        if self.db_type == "mongodb":
            res = self.mongo_db["users"].insert_one(user_data)
            user_data["id"] = str(res.inserted_id)
            return user_data

        elif self.db_type == "firestore":
            doc_ref = self.firestore_db.collection("users").document()
            doc_ref.set(user_data)
            user_data["id"] = doc_ref.id
            return user_data

        else:  # JSON
            db = self._read_json()
            user_id = str(int(ObjectId().generation_time.timestamp() * 1000))  # unique timestamp-based ID
            user_data["id"] = user_id
            db["users"].append(user_data)
            self._write_json(db)
            return user_data

    # --- Budget Operations ---

    def get_budget_by_user_id(self, user_id: str):
        if self.db_type == "mongodb":
            budget = self.mongo_db["budgets"].find_one({"userId": user_id})
            if budget:
                budget.pop("_id", None)
                return budget
            return None

        elif self.db_type == "firestore":
            docs = self.firestore_db.collection("budgets").where("userId", "==", user_id).limit(1).get()
            for doc in docs:
                return doc.to_dict()
            return None

        else:  # JSON
            db = self._read_json()
            budget = next((b for b in db["budgets"] if b["userId"] == user_id), None)
            return budget

    def save_budget(self, user_id: str, budget_data: dict):
        budget_data["userId"] = user_id

        if self.db_type == "mongodb":
            self.mongo_db["budgets"].replace_one(
                {"userId": user_id},
                budget_data,
                upsert=True
            )
            return budget_data

        elif self.db_type == "firestore":
            # Check if budget exists
            docs = self.firestore_db.collection("budgets").where("userId", "==", user_id).limit(1).get()
            doc_id = None
            for doc in docs:
                doc_id = doc.id
            
            if doc_id:
                self.firestore_db.collection("budgets").document(doc_id).set(budget_data)
            else:
                self.firestore_db.collection("budgets").document().set(budget_data)
            return budget_data

        else:  # JSON
            db = self._read_json()
            index = next((i for i, b in enumerate(db["budgets"]) if b["userId"] == user_id), -1)
            if index != -1:
                db["budgets"][index] = budget_data
            else:
                db["budgets"].append(budget_data)
            self._write_json(db)
            return budget_data

db_manager = DatabaseManager()
