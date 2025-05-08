"""Routes for the AI symptom assessment functionality."""
import json
import logging
from flask import Blueprint, request, jsonify, current_app
import re

from .. import db
from ..models import SymptomAssessment, PubMedReference, MedicalDocument, Profile, Appointment
from .agent import SymptomAssessmentAgent

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Blueprint
ai_bp = Blueprint('ai', __name__, url_prefix='/api/ai')

# Initialize the symptom assessment agent
symptom_agent = None

# In Flask 2.3+, before_app_first_request is deprecated
# Instead, we'll initialize the agent when needed
def initialize_agent():
    """Initialize the symptom assessment agent if not already initialized."""
    global symptom_agent
    if symptom_agent is None:
        symptom_agent = SymptomAssessmentAgent()
        logger.info("Symptom Assessment Agent initialized")
        
# Register with blueprint to initialize when first route is called
@ai_bp.before_request
def before_request():
    initialize_agent()

@ai_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for the AI service."""
    return jsonify({"status": "healthy", "service": "symptom-assessment"})

@ai_bp.route('/assess-symptoms', methods=['POST'])
def assess_symptoms():
    """Endpoint to assess patient symptoms using the AI agent."""
    try:
        # Get request data
        data = request.get_json()
        
        if not data or 'symptoms' not in data:
            return jsonify({"error": "Symptoms are required"}), 400
        
        symptoms = data.get('symptoms')
        age = data.get('age')
        sex = data.get('sex')
        medical_history = data.get('medical_history')
        patient_id = data.get('patient_id')
        
        # Check if message mentions a patient profile by name
        patient_profile = None
        patient_mention_regex = r"Patient ([\w\s]+) reports:"
        patient_mention = re.search(patient_mention_regex, symptoms)
        
        if patient_mention:
            patient_name = patient_mention.group(1).strip()
            logger.info(f"Message mentions patient: {patient_name}")
            
            # Try to find this patient in the database
            name_parts = patient_name.split()
            if len(name_parts) >= 2:
                # Assume first part is first name, rest is last name
                first_name = name_parts[0]
                last_name = ' '.join(name_parts[1:])
                
                patient_profile = Profile.query.filter(
                    Profile.first_name == first_name,
                    Profile.last_name == last_name
                ).first()
                
                if patient_profile:
                    logger.info(f"Found matching profile for {patient_name} (ID: {patient_profile.id})")
                    # Update patient_id to use this profile
                    patient_id = str(patient_profile.id)
                    
                    # Update demographic information if not provided
                    if not age and patient_profile.age:
                        age = patient_profile.age
                    if not sex and patient_profile.gender:
                        sex = patient_profile.gender
                    
                    # Add medical history from profile if available
                    profile_medical_info = []
                    
                    if patient_profile.medical_history:
                        profile_medical_info.append(f"Medical History: {patient_profile.medical_history}")
                    
                    if patient_profile.chronic_conditions:
                        try:
                            conditions = json.loads(patient_profile.chronic_conditions)
                            if conditions:
                                profile_medical_info.append(f"Chronic Conditions: {', '.join(conditions)}")
                        except:
                            pass
                    
                    if patient_profile.allergies:
                        try:
                            allergies = json.loads(patient_profile.allergies)
                            if allergies:
                                profile_medical_info.append(f"Allergies: {', '.join(allergies)}")
                        except:
                            pass
                    
                    if patient_profile.medications:
                        try:
                            medications = json.loads(patient_profile.medications)
                            if medications:
                                meds_list = [f"{med.get('name')} {med.get('dosage')} {med.get('frequency')}" 
                                            for med in medications if 'name' in med]
                                profile_medical_info.append(f"Medications: {', '.join(meds_list)}")
                        except:
                            pass
                    
                    if patient_profile.surgical_history:
                        try:
                            surgical_history = json.loads(patient_profile.surgical_history)
                            if surgical_history:
                                surgeries = [f"{s.get('procedure')} ({s.get('date')})" 
                                            for s in surgical_history if 'procedure' in s]
                                profile_medical_info.append(f"Surgical History: {', '.join(surgeries)}")
                        except:
                            pass
                    
                    # Combine with any provided medical history
                    if profile_medical_info:
                        profile_medical_string = "\n".join(profile_medical_info)
                        if medical_history:
                            medical_history = f"{medical_history}\n\nAdditional information from patient profile:\n{profile_medical_string}"
                        else:
                            medical_history = f"Information from patient profile:\n{profile_medical_string}"
        
        # If patient_id is provided but we don't have a profile yet, try to fetch it
        elif patient_id and not patient_profile:
            try:
                patient_id_int = int(patient_id) 
                patient_profile = Profile.query.get(patient_id_int)
                
                if patient_profile:
                    logger.info(f"Found profile for patient ID {patient_id}")
                    
                    # Update demographic information if not provided
                    if not age and patient_profile.age:
                        age = patient_profile.age
                    if not sex and patient_profile.gender:
                        sex = patient_profile.gender
                    
                    # Add medical history from profile if available (same logic as above)
                    profile_medical_info = []
                    
                    if patient_profile.medical_history:
                        profile_medical_info.append(f"Medical History: {patient_profile.medical_history}")
                    
                    if patient_profile.chronic_conditions:
                        try:
                            conditions = json.loads(patient_profile.chronic_conditions)
                            if conditions:
                                profile_medical_info.append(f"Chronic Conditions: {', '.join(conditions)}")
                        except:
                            pass
                    
                    if patient_profile.allergies:
                        try:
                            allergies = json.loads(patient_profile.allergies)
                            if allergies:
                                profile_medical_info.append(f"Allergies: {', '.join(allergies)}")
                        except:
                            pass
                    
                    if patient_profile.medications:
                        try:
                            medications = json.loads(patient_profile.medications)
                            if medications:
                                meds_list = [f"{med.get('name')} {med.get('dosage')} {med.get('frequency')}" 
                                            for med in medications if 'name' in med]
                                profile_medical_info.append(f"Medications: {', '.join(meds_list)}")
                        except:
                            pass
                    
                    if patient_profile.surgical_history:
                        try:
                            surgical_history = json.loads(patient_profile.surgical_history)
                            if surgical_history:
                                surgeries = [f"{s.get('procedure')} ({s.get('date')})" 
                                            for s in surgical_history if 'procedure' in s]
                                profile_medical_info.append(f"Surgical History: {', '.join(surgeries)}")
                        except:
                            pass
                    
                    # Combine with any provided medical history
                    if profile_medical_info:
                        profile_medical_string = "\n".join(profile_medical_info)
                        if medical_history:
                            medical_history = f"{medical_history}\n\nAdditional information from patient profile:\n{profile_medical_string}"
                        else:
                            medical_history = f"Information from patient profile:\n{profile_medical_string}"
            except (ValueError, TypeError):
                pass  # Patient ID not a valid integer, or profile not found
        
        # Initialize agent if not already initialized
        global symptom_agent
        if symptom_agent is None:
            symptom_agent = SymptomAssessmentAgent()
            
        # Call the agent to assess symptoms
        logger.info(f"Assessing symptoms: {symptoms}")
        assessment = symptom_agent.assess_symptoms(symptoms, age, sex, medical_history, patient_id)
        
        # Check for errors in assessment
        if 'error' in assessment:
            logger.error(f"Error in symptom assessment: {assessment['error']}")
            return jsonify({"error": assessment['error']}), 500
        
        # Use the LLM classification to determine if this is a medical query
        is_medical_query = assessment.get('is_medical_query', False)
        classification_reason = assessment.get('classification_reason', 'Not provided')
        
        # Log classification results
        logger.info(f"Medical query classification: {is_medical_query} - {classification_reason}")
        
        # Save to database only if it's a medical query according to the LLM
        if is_medical_query:
            logger.info("Saving medical assessment to database")
            
            # We'll skip document handling since the column doesn't exist in the database
            if 'used_document_ids' in assessment and assessment['used_document_ids']:
                logger.info(f"Assessment used {len(assessment['used_document_ids'])} patient documents, but we're not storing this data")
            
            new_assessment = SymptomAssessment(
                patient_id=patient_id,
                symptoms=symptoms,
                age=age,
                sex=sex,
                medical_history=medical_history,
                urgency_level=assessment['urgency_level'],
                urgency_description=assessment['urgency_description'],
                reasoning=assessment['reasoning'],
                recommendations=json.dumps(assessment['recommendations']),
                disclaimer=assessment['disclaimer']
                # used_documents field is omitted
            )
            
            db.session.add(new_assessment)
            db.session.commit()
            
            # Save the PubMed references
            pubmed_refs = assessment.get('pubmed_references', [])
            logger.info(f"PubMed references found for medical query: {len(pubmed_refs)}")
            if pubmed_refs:
                logger.info(f"PubMed references details: {json.dumps(pubmed_refs)}")
            
            for ref in pubmed_refs:
                pub_ref = PubMedReference(
                    assessment_id=new_assessment.id,
                    pmid=ref.get('pmid'),
                    title=ref.get('title'),
                    abstract=ref.get('abstract'),
                    date=ref.get('date')
                )
                db.session.add(pub_ref)
            
            db.session.commit()
            
            # Create appointment for emergency/urgent cases - expanded condition to catch more urgency levels
            urgency = assessment['urgency_level'].lower()
            logger.info(f"Checking urgency level for appointment creation: {urgency}")
            
            # Check for various urgent terms that might be in the urgency level or description
            is_urgent = any(term in urgency or 
                           term in assessment['urgency_description'].lower() 
                           for term in ['high', 'emergency', 'urgent', 'immediate', 'severe'])
            
            # Always create appointments to demonstrate the functionality
            # In production, you would use: if is_urgent:
            if True:  # Creating appointments for all responses for demonstration purposes
                try:
                    # Convert string patient_id to integer if it's a profile ID
                    profile_id = None
                    logger.info(f"Patient ID from request: {patient_id}, type: {type(patient_id)}")
                    
                    if patient_id:
                        try:
                            if isinstance(patient_id, str) and patient_id.isdigit():
                                profile_id = int(patient_id)
                                logger.info(f"Converted patient_id string to int: {profile_id}")
                            elif isinstance(patient_id, int):
                                profile_id = patient_id
                        except Exception as conversion_error:
                            logger.error(f"Error converting patient_id: {str(conversion_error)}")
                    
                    if not profile_id and patient_profile:
                        profile_id = patient_profile.id
                        logger.info(f"Using patient profile ID: {profile_id}")
                    
                    # If we still don't have a profile_id, find any valid profile
                    if not profile_id:
                        fallback_profile = Profile.query.first()
                        if fallback_profile:
                            profile_id = fallback_profile.id
                            logger.info(f"Using fallback profile ID: {profile_id}")
                    
                    if profile_id:
                        # Determine urgency level for display
                        display_urgency = "high" if is_urgent else urgency
                        
                        # Create an appointment
                        appointment_title = f"{'EMERGENCY: ' if is_urgent else ''}{assessment['urgency_description'][:50]}..."
                        
                        # Format recommendations properly
                        recommendations_text = "\n".join(assessment['recommendations']) \
                            if isinstance(assessment['recommendations'], list) \
                            else str(assessment['recommendations'])
                        
                        new_appointment = Appointment(
                            patient_id=profile_id,
                            assessment_id=new_assessment.id,
                            title=appointment_title,
                            description=f"Symptoms: {symptoms}\n\nReasoning: {assessment['reasoning']}\n\nRecommendations: {recommendations_text}",
                            urgency_level=display_urgency,
                            status="pending"
                        )
                        db.session.add(new_appointment)
                        db.session.commit()
                        logger.info(f"Created appointment (urgency: {display_urgency}) for patient {profile_id}")
                    else:
                        logger.error("Could not find a valid patient profile ID for appointment creation")
                except Exception as e:
                    logger.error(f"Failed to create appointment: {str(e)}")
                    # Continue even if appointment creation fails
            
            # Return the saved assessment with ID
            return jsonify(new_assessment.to_dict()), 201
        else:
            logger.info("Not saving non-medical chat to database")
            # Just return the assessment without saving to database
            # Convert to dict format manually to match the model format
            response = {
                "symptoms": symptoms,
                "urgency_level": assessment['urgency_level'],
                "urgency_description": assessment['urgency_description'],
                "reasoning": assessment['reasoning'],
                "recommendations": assessment['recommendations'],
                "disclaimer": assessment['disclaimer'],
                "pubmed_references": assessment.get('pubmed_references', [])
            }
        
            # Log PubMed references for non-medical queries too
            pubmed_refs = assessment.get('pubmed_references', [])
            logger.info(f"PubMed references found for non-medical query: {len(pubmed_refs)}")
            if pubmed_refs:
                logger.info(f"PubMed references details: {json.dumps(pubmed_refs)}")
            
            # Return the assessment for non-medical cases
            return jsonify(response), 200
        
    except Exception as e:
        logger.error(f"Error processing symptom assessment request: {str(e)}")
        return jsonify({"error": f"Failed to process symptom assessment: {str(e)}"}), 500

@ai_bp.route('/assessments', methods=['GET'])
def get_assessments():
    """Get all symptom assessments, with optional patient_id filter."""
    try:
        patient_id = request.args.get('patient_id')
        
        if patient_id:
            assessments = SymptomAssessment.query.filter_by(patient_id=patient_id).all()
        else:
            assessments = SymptomAssessment.query.all()
            
        return jsonify([assessment.to_dict() for assessment in assessments])
        
    except Exception as e:
        logger.error(f"Error retrieving symptom assessments: {str(e)}")
        return jsonify({"error": f"Failed to retrieve symptom assessments: {str(e)}"}), 500

@ai_bp.route('/assessments/<int:assessment_id>', methods=['GET'])
def get_assessment(assessment_id):
    """Get a specific symptom assessment by ID."""
    try:
        assessment = SymptomAssessment.query.get_or_404(assessment_id)
        return jsonify(assessment.to_dict())
        
    except Exception as e:
        logger.error(f"Error retrieving symptom assessment {assessment_id}: {str(e)}")
        return jsonify({"error": f"Failed to retrieve symptom assessment: {str(e)}"}), 500
