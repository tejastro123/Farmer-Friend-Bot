
import httpx

def test_login():
    url = "http://127.0.0.1:8000/api/auth/login"
    data = {
        "username": "test@example.com",
        "password": "password123"
    }
    
    print(f"Testing login at {url}...")
    try:
        # FastAPI's OAuth2PasswordRequestForm expects form-encoded data
        response = httpx.post(url, data=data)
        print(f"Status Code: {response.status_code}")
        print(f"Response Body: {response.text}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_login()
