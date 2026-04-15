import requests
import json

BASE_URL = "http://localhost:8000/api"

def reproduce():
    # 1. Login to get token (assuming user tejas@example.com exists)
    # If not, we might need to verify the user first.
    # But often session 1 is available.
    
    # Let's try to hit it directly first to see if it's an auth error or logic error.
    # Given the logs, it's a 500, not 401.
    
    url = f"{BASE_URL}/sessions/1/messages"
    print(f"Testing {url}...")
    
    headers = {
        "Authorization": "Bearer test_token" # We need a real token usually
    }
    
    # Let's try without token to see if we get 401 (proves server is up)
    try:
        resp = requests.get(url)
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text}")
    except Exception as e:
        print(f"Fetch failed: {e}")

if __name__ == "__main__":
    reproduce()
