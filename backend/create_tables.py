"""Script to create database tables for the Nuverse Hackathon project."""
from app import create_app, db
from app.models import Item, SymptomAssessment, PubMedReference, Profile, MedicalDocument

# Create Flask app
app = create_app()

# Create database tables
with app.app_context():
    print("Creating database tables...")
    db.create_all()
    print("Database tables created successfully!")
