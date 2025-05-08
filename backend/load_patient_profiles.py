"""Script to load patient profiles from CSV into the database."""
import csv
import json
from datetime import datetime
from app import create_app, db
from app.models import Profile

def parse_date(date_str):
    """Parse a date string in YYYY-MM-DD format."""
    if not date_str:
        return None
    return datetime.strptime(date_str, '%Y-%m-%d').date()

def load_profiles_from_csv(csv_file):
    """Load patient profiles from a CSV file into the database."""
    print(f"Loading patient profiles from {csv_file}...")
    
    # Count existing profiles
    with app.app_context():
        existing_count = Profile.query.count()
        print(f"Found {existing_count} existing profiles in the database.")
        if existing_count > 0:
            print("Skipping import as profiles already exist.")
            return
    
    profiles_added = 0
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            try:
                with app.app_context():
                    # Create a new profile
                    profile = Profile(
                        first_name=row['first_name'],
                        last_name=row['last_name'],
                        date_of_birth=parse_date(row['date_of_birth']),
                        age=int(row['age']),
                        gender=row['gender'],
                        email=row['email'],
                        phone=row['phone'],
                        address=row['address'],
                        city=row['city'],
                        state=row['state'],
                        zip_code=row['zip_code'],
                        height=float(row['height']) if row['height'] else None,
                        weight=float(row['weight']) if row['weight'] else None,
                        blood_type=row['blood_type'],
                        bmi=float(row['bmi']) if row['bmi'] else None,
                        allergies=row['allergies'],
                        medications=row['medications'],
                        chronic_conditions=row['chronic_conditions'],
                        medical_history=row['medical_history'],
                        surgical_history=row['surgical_history'],
                        family_medical_history=row['family_medical_history'],
                        immunizations=row['immunizations'],
                        smoking_status=row['smoking_status'],
                        alcohol_consumption=row['alcohol_consumption'],
                        exercise_frequency=row['exercise_frequency'],
                        diet_restrictions=row['diet_restrictions'],
                        occupation=row['occupation'],
                        emergency_contact_name=row['emergency_contact_name'],
                        emergency_contact_phone=row['emergency_contact_phone'],
                        emergency_contact_relationship=row['emergency_contact_relationship'],
                        primary_physician=row['primary_physician'],
                        primary_physician_phone=row['primary_physician_phone'],
                        insurance_provider=row['insurance_provider'],
                        insurance_policy_number=row['insurance_policy_number']
                    )
                    
                    # Add to database
                    db.session.add(profile)
                    db.session.commit()
                    profiles_added += 1
                    print(f"Added profile: {profile.first_name} {profile.last_name}")
            except Exception as e:
                print(f"Error adding profile {row.get('first_name')} {row.get('last_name')}: {str(e)}")
    
    print(f"Successfully added {profiles_added} patient profiles to the database.")

if __name__ == "__main__":
    # Create Flask app
    app = create_app()
    
    # Load profiles from CSV
    load_profiles_from_csv('patient_profiles.csv')
    
    print("Done!")
