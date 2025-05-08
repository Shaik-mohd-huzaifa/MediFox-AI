from flask import Blueprint, jsonify, request
import json
from datetime import datetime
from . import db
from .models import Item, Profile

def parse_date(date_str):
    """Parse a date string in YYYY-MM-DD format."""
    if not date_str:
        return None
    return datetime.strptime(date_str, '%Y-%m-%d').date()

# Create Blueprint
main_bp = Blueprint('main', __name__, url_prefix='/api')

@main_bp.route('/items', methods=['GET'])
def get_items():
    """Get all items."""
    items = Item.query.all()
    return jsonify([item.to_dict() for item in items])

@main_bp.route('/items/<int:item_id>', methods=['GET'])
def get_item(item_id):
    """Get a specific item by ID."""
    item = Item.query.get_or_404(item_id)
    return jsonify(item.to_dict())

@main_bp.route('/items', methods=['POST'])
def create_item():
    """Create a new item."""
    data = request.get_json()
    
    if not data or 'name' not in data:
        return jsonify({'error': 'Name is required'}), 400
    
    new_item = Item(
        name=data['name'],
        description=data.get('description')
    )
    
    db.session.add(new_item)
    db.session.commit()
    
    return jsonify(new_item.to_dict()), 201

@main_bp.route('/items/<int:item_id>', methods=['PUT'])
def update_item(item_id):
    """Update an existing item."""
    item = Item.query.get_or_404(item_id)
    data = request.get_json()
    
    if 'name' in data:
        item.name = data['name']
    if 'description' in data:
        item.description = data['description']
    
    db.session.commit()
    
    return jsonify(item.to_dict())

@main_bp.route('/items/<int:item_id>', methods=['DELETE'])
def delete_item(item_id):
    """Delete an item."""
    item = Item.query.get_or_404(item_id)
    
    db.session.delete(item)
    db.session.commit()
    
    return jsonify({'message': f'Item {item_id} deleted successfully'})


# Profile Routes
@main_bp.route('/profiles', methods=['GET'])
def get_profiles():
    """Get all patient profiles."""
    profiles = Profile.query.all()
    return jsonify([profile.to_dict() for profile in profiles])

@main_bp.route('/profiles/<int:profile_id>', methods=['GET'])
def get_profile(profile_id):
    """Get a specific patient profile by ID."""
    profile = Profile.query.get_or_404(profile_id)
    return jsonify(profile.to_dict())

@main_bp.route('/profiles', methods=['POST'])
def create_profile():
    """Create a new patient profile."""
    data = request.get_json()
    
    if not data or 'first_name' not in data or 'last_name' not in data:
        return jsonify({'error': 'First name and last name are required'}), 400
    
    # Convert JSON strings to Python objects where needed
    allergies = json.dumps(data.get('allergies', [])) if data.get('allergies') else None
    medications = json.dumps(data.get('medications', [])) if data.get('medications') else None
    chronic_conditions = json.dumps(data.get('chronic_conditions', [])) if data.get('chronic_conditions') else None
    surgical_history = json.dumps(data.get('surgical_history', [])) if data.get('surgical_history') else None
    immunizations = json.dumps(data.get('immunizations', [])) if data.get('immunizations') else None
    
    new_profile = Profile(
        first_name=data['first_name'],
        last_name=data['last_name'],
        date_of_birth=parse_date(data.get('date_of_birth')),
        age=data.get('age'),
        gender=data.get('gender'),
        email=data.get('email'),
        phone=data.get('phone'),
        address=data.get('address'),
        city=data.get('city'),
        state=data.get('state'),
        zip_code=data.get('zip_code'),
        height=data.get('height'),
        weight=data.get('weight'),
        blood_type=data.get('blood_type'),
        bmi=data.get('bmi'),
        allergies=allergies,
        medications=medications,
        chronic_conditions=chronic_conditions,
        medical_history=data.get('medical_history'),
        surgical_history=surgical_history,
        family_medical_history=data.get('family_medical_history'),
        immunizations=immunizations,
        smoking_status=data.get('smoking_status'),
        alcohol_consumption=data.get('alcohol_consumption'),
        exercise_frequency=data.get('exercise_frequency'),
        diet_restrictions=data.get('diet_restrictions'),
        occupation=data.get('occupation'),
        emergency_contact_name=data.get('emergency_contact_name'),
        emergency_contact_phone=data.get('emergency_contact_phone'),
        emergency_contact_relationship=data.get('emergency_contact_relationship'),
        primary_physician=data.get('primary_physician'),
        primary_physician_phone=data.get('primary_physician_phone'),
        insurance_provider=data.get('insurance_provider'),
        insurance_policy_number=data.get('insurance_policy_number')
    )
    
    db.session.add(new_profile)
    db.session.commit()
    
    return jsonify(new_profile.to_dict()), 201

@main_bp.route('/profiles/<int:profile_id>', methods=['PUT'])
def update_profile(profile_id):
    """Update an existing patient profile."""
    profile = Profile.query.get_or_404(profile_id)
    data = request.get_json()
    
    # Update profile fields if provided in the request
    for field in [
        'first_name', 'last_name', 'email', 'phone', 'address', 'city', 'state',
        'zip_code', 'medical_history', 'family_medical_history', 'smoking_status',
        'alcohol_consumption', 'exercise_frequency', 'diet_restrictions', 'occupation',
        'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relationship',
        'primary_physician', 'primary_physician_phone', 'insurance_provider',
        'insurance_policy_number'
    ]:
        if field in data:
            setattr(profile, field, data[field])
    
    # Handle numeric fields
    for field in ['age', 'height', 'weight', 'bmi']:
        if field in data:
            setattr(profile, field, data[field])
    
    # Handle date field
    if 'date_of_birth' in data:
        profile.date_of_birth = parse_date(data['date_of_birth'])
    
    # Handle JSON fields
    if 'allergies' in data:
        profile.allergies = json.dumps(data['allergies'])
    if 'medications' in data:
        profile.medications = json.dumps(data['medications'])
    if 'chronic_conditions' in data:
        profile.chronic_conditions = json.dumps(data['chronic_conditions'])
    if 'surgical_history' in data:
        profile.surgical_history = json.dumps(data['surgical_history'])
    if 'immunizations' in data:
        profile.immunizations = json.dumps(data['immunizations'])
    
    db.session.commit()
    
    return jsonify(profile.to_dict())

@main_bp.route('/profiles/<int:profile_id>', methods=['DELETE'])
def delete_profile(profile_id):
    """Delete a patient profile."""
    profile = Profile.query.get_or_404(profile_id)
    
    db.session.delete(profile)
    db.session.commit()
    
    return jsonify({'message': f'Profile {profile_id} deleted successfully'})
