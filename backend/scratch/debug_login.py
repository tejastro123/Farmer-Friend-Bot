
import sys
import os
import sqlite3
from passlib.context import CryptContext

# Set up paths
sys.path.append(os.getcwd())

from backend.db.db_utils import get_user_by_email, create_user
from backend.utils.auth_utils import verify_password, get_password_hash

DB_PATH = "krishimitra.db"

def debug_auth():
    print("--- AUTH DEBUGGER ---")
    
    email = "test@example.com"
    user = get_user_by_email(email)
    
    if not user:
        print(f"User {email} not found. Creating...")
        pw = "password123"
        hashed = get_password_hash(pw)
        uid = create_user(email, hashed, "Test User")
        print(f"Created user {email} with id {uid} and password '{pw}'")
        user = get_user_by_email(email)
    
    print(f"User details: {dict(user)}")
    
    test_pw = "password123"
    is_valid = verify_password(test_pw, user["hashed_password"])
    print(f"Verify '{test_pw}' against stored hash: {is_valid}")
    
    # Try another common password if the first one failed
    if not is_valid:
        test_pw2 = "password"
        is_valid2 = verify_password(test_pw2, user["hashed_password"])
        print(f"Verify '{test_pw2}' against stored hash: {is_valid2}")

if __name__ == "__main__":
    debug_auth()
