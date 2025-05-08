"""Script to generate 20 random patient profiles and insert them into the database."""
import random
import json
from datetime import datetime, timedelta
import sys
from app import create_app, db
from app.models import Profile

# Create Flask app context
app = create_app()
app.app_context().push()

# Lists for generating realistic data
first_names = [
    "Emma", "Liam", "Olivia", "Noah", "Ava", "William", "Sophia", "James", 
    "Isabella", "Benjamin", "Mia", "Ethan", "Charlotte", "Alexander", "Amelia", 
    "Henry", "Harper", "Michael", "Evelyn", "Daniel", "Abigail", "Matthew", 
    "Emily", "Joseph", "Elizabeth", "David", "Sofia", "Carter", "Madison", "Jayden"
]

last_names = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", 
    "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", 
    "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", 
    "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson"
]

blood_types = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]

chronic_conditions_list = [
    "Hypertension", "Diabetes Type 2", "Asthma", "Allergic Rhinitis", 
    "Osteoarthritis", "Hypothyroidism", "Hyperlipidemia", "GERD", 
    "Anxiety Disorder", "Depression", "Migraine", "Insomnia", 
    "Eczema", "Psoriasis", "Irritable Bowel Syndrome", "Fibromyalgia",
    "Osteoporosis", "Kidney Stones", "Gout", "Chronic Fatigue Syndrome"
]

allergy_list = [
    "Penicillin", "Peanuts", "Tree nuts", "Shellfish", "Dairy", 
    "Eggs", "Wheat", "Soy", "Fish", "Latex", "Ibuprofen", "Sulfa drugs", 
    "Aspirin", "Pollen", "Dust mites", "Pet dander", "Mold", "Bee stings"
]

insurance_providers = [
    "Medicare", "Medicaid", "BlueCross BlueShield", "Aetna", "UnitedHealthcare", 
    "Cigna", "Humana", "Kaiser Permanente", "Centene", "Molina Healthcare", 
    "Health Net", "WellCare", "Anthem", "TRICARE", "Highmark", "GEHA"
]

medical_history_templates = [
    "Patient has a history of {condition1} diagnosed {years1} ago. {treatment1}. Also reports {condition2} with {treatment2}. No surgical history.",
    "Patient underwent {surgery} in {surgery_year}. Has been managing {condition1} with {treatment1} and {condition2} with {treatment2}.",
    "No significant past medical history until {years1} ago when diagnosed with {condition1}. Recently developed {condition2} and is currently on {treatment2}.",
    "Family history of {condition1}. Patient diagnosed with {condition2} {years2} ago, managed with {treatment2}. Regular check-ups show stable condition.",
    "Patient reports {surgery} at age {surgery_age}. Has been on medication for {condition1} ({treatment1}) for the past {years1} years with good control."
]

conditions = [
    "hypertension", "type 2 diabetes", "asthma", "migraines", "hypothyroidism", 
    "hyperlipidemia", "osteoarthritis", "anxiety disorder", "depression", "GERD", 
    "chronic sinusitis", "vitamin D deficiency", "anemia", "insomnia", 
    "seasonal allergies", "eczema", "IBS", "PCOS", "gout", "prediabetes"
]

treatments = [
    "on lisinopril", "taking metformin", "uses albuterol inhaler as needed", 
    "manages with sumatriptan", "on levothyroxine", "taking atorvastatin", 
    "using NSAIDs for pain management", "on sertraline", "taking fluoxetine", 
    "on omeprazole", "using nasal steroids", "taking supplements", 
    "on iron supplements", "using OTC sleep aids", "taking antihistamines", 
    "using topical corticosteroids", "manages with dietary changes", 
    "on combination birth control", "taking allopurinol", "lifestyle modifications"
]

surgeries = [
    "appendectomy", "cholecystectomy", "tonsillectomy", "hernia repair", 
    "knee arthroscopy", "cesarean section", "hysterectomy", "thyroidectomy", 
    "cataract surgery", "LASIK", "wisdom teeth extraction", "ACL reconstruction", 
    "hip replacement", "spinal fusion", "carpal tunnel release"
]

def generate_random_profile():
    """Generate a random patient profile."""
    gender = random.choice(["Male", "Female"])
    first_name = random.choice(first_names)
    last_name = random.choice(last_names)
    
    age = random.randint(18, 85)
    # Generate a random birth date
    today = datetime.now()
    birth_year = today.year - age
    birth_month = random.randint(1, 12)
    birth_day = random.randint(1, 28)  # Using 28 to avoid month/day validation issues
    date_of_birth = datetime(birth_year, birth_month, birth_day).date()
    
    email = f"{first_name.lower()}.{last_name.lower()}{random.randint(1, 999)}@example.com"
    phone = f"+1-{random.randint(200, 999)}-{random.randint(100, 999)}-{random.randint(1000, 9999)}"
    
    # Generate random height (in cm) and weight (in kg) appropriate for age
    if age < 18:
        height = random.randint(120, 170)
        weight = random.randint(30, 70)
    else:
        height = random.randint(150, 195) if gender == "Male" else random.randint(145, 180)
        weight = random.randint(60, 110) if gender == "Male" else random.randint(45, 95)
    
    # Randomly decide if the patient has chronic conditions
    has_chronic = random.random() < 0.7  # 70% chance to have at least one chronic condition
    chronic_count = random.randint(1, 4) if has_chronic else 0
    chronic_conditions = random.sample(chronic_conditions_list, chronic_count) if chronic_count > 0 else []
    
    # Randomly decide if the patient has allergies
    has_allergies = random.random() < 0.4  # 40% chance to have allergies
    allergy_count = random.randint(1, 3) if has_allergies else 0
    allergies = random.sample(allergy_list, allergy_count) if allergy_count > 0 else []
    
    # Generate medical history
    condition1 = random.choice(conditions)
    condition2 = random.choice([c for c in conditions if c != condition1])
    treatment1 = random.choice(treatments)
    treatment2 = random.choice([t for t in treatments if t != treatment1])
    years1 = random.randint(1, min(15, age))
    years2 = random.randint(1, years1)
    surgery = random.choice(surgeries)
    surgery_year = birth_year + random.randint(10, min(age-5, 40))
    surgery_age = surgery_year - birth_year
    
    template = random.choice(medical_history_templates)
    medical_history = template.format(
        condition1=condition1,
        condition2=condition2,
        treatment1=treatment1,
        treatment2=treatment2,
        years1=years1,
        years2=years2,
        surgery=surgery,
        surgery_year=surgery_year,
        surgery_age=surgery_age
    )
    
    # Create profile object with fields that match the Profile model
    return {
        "first_name": first_name,
        "last_name": last_name,
        "date_of_birth": date_of_birth,
        "email": email,
        "phone": phone,
        "gender": gender,
        "age": age,
        "blood_type": random.choice(blood_types),
        "height": height,
        "weight": weight,
        "allergies": json.dumps(allergies) if allergies else None,
        "chronic_conditions": json.dumps(chronic_conditions) if chronic_conditions else None,
        "primary_physician": f"Dr. {random.choice(last_names)}",
        "insurance_provider": random.choice(insurance_providers),
        "medical_history": medical_history
    }

def create_profiles(count):
    """Create a specified number of patient profiles and insert into the database."""
    print(f"Generating {count} patient profiles...")
    
    # Check if profiles already exist
    existing_count = Profile.query.count()
    if existing_count > 0:
        print(f"Database already contains {existing_count} profiles.")
    
    # Generate and insert profiles
    profiles_created = 0
    
    for _ in range(count):
        profile_data = generate_random_profile()
        
        # Check if profile with this name already exists
        existing = Profile.query.filter_by(
            first_name=profile_data["first_name"],
            last_name=profile_data["last_name"]
        ).first()
        
        if existing:
            print(f"Profile for {profile_data['first_name']} {profile_data['last_name']} already exists, skipping.")
            continue
        
        # Create a new profile
        new_profile = Profile(**profile_data)
        db.session.add(new_profile)
        
        try:
            db.session.commit()
            profiles_created += 1
            print(f"Created profile for {profile_data['first_name']} {profile_data['last_name']}")
        except Exception as e:
            db.session.rollback()
            print(f"Error creating profile: {str(e)}")
    
    print(f"Successfully created {profiles_created} new patient profiles.")
    return profiles_created

if __name__ == "__main__":
    # Get number of profiles to create from command line argument, default to 20
    count = 20
    if len(sys.argv) > 1:
        try:
            count = int(sys.argv[1])
        except ValueError:
            print(f"Invalid count: {sys.argv[1]}. Using default of 20.")
    
    # Create profiles
    create_profiles(count)
