from backend.db.session import engine, Base
import backend.models.models as models

print("Creating tables...")
try:
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully.")
except Exception as e:
    print(f"Error creating tables: {e}")
