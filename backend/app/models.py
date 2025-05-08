from datetime import datetime
import json
import os
from . import db
from sqlalchemy.dialects.postgresql import ARRAY
from enum import Enum

class Item(db.Model):
    """Sample model for demonstration."""
    __tablename__ = 'items'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<Item {self.name}>'
    
    def to_dict(self):
        """Convert instance to dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class PubMedReference(db.Model):
    """Model for PubMed references used in symptom assessments."""
    __tablename__ = 'pubmed_references'
    
    id = db.Column(db.Integer, primary_key=True)
    assessment_id = db.Column(db.Integer, db.ForeignKey('symptom_assessments.id'))
    pmid = db.Column(db.String(20), nullable=True)
    title = db.Column(db.Text, nullable=True)
    abstract = db.Column(db.Text, nullable=True)
    date = db.Column(db.String(50), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<PubMedReference {self.pmid}>'
    
    def to_dict(self):
        """Convert instance to dictionary."""
        return {
            'id': self.id,
            'pmid': self.pmid,
            'title': self.title,
            'abstract': self.abstract,
            'date': self.date
        }


class MedicalDocument(db.Model):
    """Model for storing patient medical documents."""
    __tablename__ = 'medical_documents'
    
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.String(100), nullable=True)  # Optional patient identifier
    filename = db.Column(db.String(255), nullable=False)
    file_type = db.Column(db.String(50), nullable=False)  # e.g., pdf, jpg, docx
    file_size = db.Column(db.Integer, nullable=False)  # Size in bytes
    file_path = db.Column(db.String(500), nullable=False)  # Path to stored file
    content_text = db.Column(db.Text, nullable=True)  # Extracted text content from the document
    document_metadata = db.Column(db.Text, nullable=True)  # JSON string for additional metadata
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<MedicalDocument {self.id}: {self.filename}>' 
    
    def to_dict(self):
        """Convert instance to dictionary."""
        try:
            metadata_dict = json.loads(self.document_metadata) if self.document_metadata else {}
        except:
            metadata_dict = {}
            
        return {
            'id': self.id,
            'patient_id': self.patient_id,
            'filename': self.filename,
            'file_type': self.file_type,
            'file_size': self.file_size,
            'content_preview': self.content_text[:200] + '...' if self.content_text and len(self.content_text) > 200 else self.content_text,
            'has_content': bool(self.content_text),
            'uploaded_at': self.uploaded_at.isoformat(),
            'metadata': metadata_dict
        }


class Profile(db.Model):
    """Model for patient profiles with comprehensive medical history."""
    __tablename__ = 'profiles'
    
    id = db.Column(db.Integer, primary_key=True)
    # Personal Information
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    date_of_birth = db.Column(db.Date, nullable=False)
    age = db.Column(db.Integer, nullable=False)
    gender = db.Column(db.String(20), nullable=False)
    email = db.Column(db.String(120), nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    address = db.Column(db.String(255), nullable=True)
    city = db.Column(db.String(100), nullable=True)
    state = db.Column(db.String(100), nullable=True)
    zip_code = db.Column(db.String(20), nullable=True)
    
    # Physical Attributes
    height = db.Column(db.Float, nullable=True)  # In cm
    weight = db.Column(db.Float, nullable=True)  # In kg
    blood_type = db.Column(db.String(10), nullable=True)  # A+, B-, O+, etc.
    bmi = db.Column(db.Float, nullable=True)  # Body Mass Index
    
    # Medical Information
    allergies = db.Column(db.Text, nullable=True)  # JSON list of allergies
    medications = db.Column(db.Text, nullable=True)  # Current medications as JSON
    chronic_conditions = db.Column(db.Text, nullable=True)  # JSON list of chronic conditions
    medical_history = db.Column(db.Text, nullable=True)  # General medical history notes
    surgical_history = db.Column(db.Text, nullable=True)  # JSON array of surgical procedures
    family_medical_history = db.Column(db.Text, nullable=True)  # Family history notes
    immunizations = db.Column(db.Text, nullable=True)  # JSON array of immunization records
    
    # Lifestyle Information
    smoking_status = db.Column(db.String(20), nullable=True)  # Never, Former, Current
    alcohol_consumption = db.Column(db.String(20), nullable=True)  # None, Occasional, Moderate, Heavy
    exercise_frequency = db.Column(db.String(20), nullable=True)  # Sedentary, Light, Moderate, Active
    diet_restrictions = db.Column(db.String(100), nullable=True)  # Any dietary restrictions
    occupation = db.Column(db.String(100), nullable=True)  # Patient's occupation
    
    # Emergency Contact 
    emergency_contact_name = db.Column(db.String(100), nullable=True)
    emergency_contact_phone = db.Column(db.String(20), nullable=True)
    emergency_contact_relationship = db.Column(db.String(50), nullable=True)
    
    # Healthcare Providers
    primary_physician = db.Column(db.String(100), nullable=True)
    primary_physician_phone = db.Column(db.String(20), nullable=True)
    insurance_provider = db.Column(db.String(100), nullable=True)
    insurance_policy_number = db.Column(db.String(50), nullable=True)
    
    # System Information
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<Profile {self.id}: {self.first_name} {self.last_name}>'
    
    def to_dict(self):
        """Convert instance to dictionary."""
        try:
            allergies = json.loads(self.allergies) if self.allergies else []
        except:
            allergies = []
            
        try:
            medications = json.loads(self.medications) if self.medications else []
        except:
            medications = []
            
        try:
            chronic_conditions = json.loads(self.chronic_conditions) if self.chronic_conditions else []
        except:
            chronic_conditions = []
            
        try:
            surgical_history = json.loads(self.surgical_history) if self.surgical_history else []
        except:
            surgical_history = []
            
        try:
            immunizations = json.loads(self.immunizations) if self.immunizations else []
        except:
            immunizations = []
            
        return {
            'id': self.id,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'full_name': f"{self.first_name} {self.last_name}",
            'date_of_birth': self.date_of_birth.isoformat() if self.date_of_birth else None,
            'age': self.age,
            'gender': self.gender,
            'email': self.email,
            'phone': self.phone,
            'address': self.address,
            'city': self.city,
            'state': self.state,
            'zip_code': self.zip_code,
            'height': self.height,
            'weight': self.weight,
            'blood_type': self.blood_type,
            'bmi': self.bmi,
            'allergies': allergies,
            'medications': medications,
            'chronic_conditions': chronic_conditions,
            'medical_history': self.medical_history,
            'surgical_history': surgical_history,
            'family_medical_history': self.family_medical_history,
            'immunizations': immunizations,
            'smoking_status': self.smoking_status,
            'alcohol_consumption': self.alcohol_consumption,
            'exercise_frequency': self.exercise_frequency,
            'diet_restrictions': self.diet_restrictions,
            'occupation': self.occupation,
            'emergency_contact_name': self.emergency_contact_name,
            'emergency_contact_phone': self.emergency_contact_phone,
            'emergency_contact_relationship': self.emergency_contact_relationship,
            'primary_physician': self.primary_physician,
            'primary_physician_phone': self.primary_physician_phone,
            'insurance_provider': self.insurance_provider,
            'insurance_policy_number': self.insurance_policy_number,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class AppointmentStatus(Enum):
    """Enum for appointment statuses"""
    PENDING = "pending"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Appointment(db.Model):
    """Model for patient appointments, especially emergency ones created from symptom assessments."""
    __tablename__ = 'appointments'
    
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('profiles.id'))
    assessment_id = db.Column(db.Integer, db.ForeignKey('symptom_assessments.id'), nullable=True)  # Optional link to an assessment
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    urgency_level = db.Column(db.String(20), nullable=False)  # high, medium, low
    status = db.Column(db.String(20), default=AppointmentStatus.PENDING.value, nullable=False)
    appointment_time = db.Column(db.DateTime, nullable=True)  # Can be null for pending emergency appointments
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    patient = db.relationship('Profile', backref='appointments')
    assessment = db.relationship('SymptomAssessment', backref='appointments')
    
    def __repr__(self):
        return f'<Appointment {self.id}: {self.title} (Urgency: {self.urgency_level})>'
    
    def to_dict(self):
        """Convert instance to dictionary."""
        return {
            'id': self.id,
            'patient_id': self.patient_id,
            'assessment_id': self.assessment_id,
            'title': self.title,
            'description': self.description,
            'urgency_level': self.urgency_level,
            'status': self.status,
            'appointment_time': self.appointment_time.isoformat() if self.appointment_time else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'patient': self.patient.to_dict() if self.patient else None
        }


class SymptomAssessment(db.Model):
    """Model for patient symptom assessments."""
    __tablename__ = 'symptom_assessments'
    
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.String(100), nullable=True)  # Optional patient identifier
    symptoms = db.Column(db.Text, nullable=False)
    age = db.Column(db.Integer, nullable=True)
    sex = db.Column(db.String(10), nullable=True)
    medical_history = db.Column(db.Text, nullable=True)
    urgency_level = db.Column(db.String(20), nullable=False)
    urgency_description = db.Column(db.Text, nullable=False)
    reasoning = db.Column(db.Text, nullable=False)
    recommendations = db.Column(db.Text, nullable=False)  # Stored as JSON string
    disclaimer = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    references = db.relationship('PubMedReference', backref='assessment', lazy=True, cascade='all, delete-orphan')
    # The used_documents field was removed as it doesn't exist in the database schema
    
    def __repr__(self):
        return f'<SymptomAssessment {self.id}: {self.urgency_level}>'
    
    def to_dict(self):
        """Convert instance to dictionary."""
        try:
            recommendations = json.loads(self.recommendations)
        except:
            recommendations = [self.recommendations]
            
        return {
            'id': self.id,
            'patient_id': self.patient_id,
            'symptoms': self.symptoms,
            'age': self.age,
            'sex': self.sex,
            'medical_history': self.medical_history,
            'urgency_level': self.urgency_level,
            'urgency_description': self.urgency_description,
            'reasoning': self.reasoning,
            'recommendations': recommendations,
            'disclaimer': self.disclaimer,
            'created_at': self.created_at.isoformat(),
            'references': [ref.to_dict() for ref in self.references]
        }
