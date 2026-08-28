import os
import json
import firebase_admin
from firebase_admin import credentials, firestore

firebase_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
firebase_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH")

def _resolve_service_account_path(p):
    if p:
        p = p.strip()
        if os.path.exists(p):
            return p
    # Check relative to backend/ directory
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    if p:
        rel_path = os.path.join(base_dir, p)
        if os.path.exists(rel_path):
            return rel_path
    default_json = os.path.join(base_dir, "firebase-service-account.json")
    if os.path.exists(default_json):
        return default_json
    return None

resolved_path = _resolve_service_account_path(firebase_path)

if not firebase_admin._apps:
    if firebase_json:
        try:
            print("Initializing Firebase from environment JSON...")
            cred = credentials.Certificate(json.loads(firebase_json))
            firebase_admin.initialize_app(cred)
        except Exception as e:
            print(f"Warning: Failed to initialize Firebase from JSON env var: {e}")
            raise
    elif resolved_path:
        print(f"Initializing Firebase from file: {resolved_path}")
        cred = credentials.Certificate(resolved_path)
        firebase_admin.initialize_app(cred)
    else:
        try:
            print("Attempting default Firebase initialization with projectId...")
            firebase_admin.initialize_app(options={"projectId": "levelup-d7753"})
        except Exception as e:
            raise RuntimeError(
                "Firebase initialization failed. Set FIREBASE_SERVICE_ACCOUNT_JSON "
                "or FIREBASE_SERVICE_ACCOUNT_PATH."
            ) from e

db = firestore.client()

def init_firebase_app():
    return firebase_admin.get_app()
