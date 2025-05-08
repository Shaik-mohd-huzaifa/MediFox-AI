"""Routes for the appointment functionality."""
import logging
from flask import Blueprint, request, jsonify, current_app
from datetime import datetime

from .. import db
from ..models import Appointment, Profile

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Blueprint
appointments_bp = Blueprint('appointments', __name__, url_prefix='/api/appointments')

@appointments_bp.route('/', methods=['GET'])
def get_appointments():
    """Get all appointments with optional filters."""
    try:
        # Parse query parameters for filtering
        patient_id = request.args.get('patient_id')
        status = request.args.get('status')
        urgency_level = request.args.get('urgency_level')
        
        # Start with base query
        query = Appointment.query
        
        # Apply filters if provided
        if patient_id:
            query = query.filter_by(patient_id=patient_id)
        if status:
            query = query.filter_by(status=status)
        if urgency_level:
            query = query.filter_by(urgency_level=urgency_level)
            
        # Get results and sort by urgency level and creation date
        appointments = query.order_by(
            # Sort emergency/high urgency first
            Appointment.urgency_level.desc(),
            # Then by most recent
            Appointment.created_at.desc()
        ).all()
        
        return jsonify([appointment.to_dict() for appointment in appointments])
    except Exception as e:
        logger.error(f"Error retrieving appointments: {str(e)}")
        return jsonify({"error": f"Failed to retrieve appointments: {str(e)}"}), 500

@appointments_bp.route('/<int:appointment_id>', methods=['GET'])
def get_appointment(appointment_id):
    """Get a specific appointment by ID."""
    try:
        appointment = Appointment.query.get_or_404(appointment_id)
        return jsonify(appointment.to_dict())
    except Exception as e:
        logger.error(f"Error retrieving appointment {appointment_id}: {str(e)}")
        return jsonify({"error": f"Failed to retrieve appointment: {str(e)}"}), 500

@appointments_bp.route('/', methods=['POST'])
def create_appointment():
    """Create a new appointment."""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data or 'patient_id' not in data or 'title' not in data or 'urgency_level' not in data:
            return jsonify({"error": "Missing required fields (patient_id, title, urgency_level)"}), 400
        
        # Create new appointment
        new_appointment = Appointment(
            patient_id=data['patient_id'],
            assessment_id=data.get('assessment_id'),
            title=data['title'],
            description=data.get('description'),
            urgency_level=data['urgency_level'],
            status=data.get('status', 'pending'),
            appointment_time=datetime.fromisoformat(data['appointment_time']) if 'appointment_time' in data else None
        )
        
        db.session.add(new_appointment)
        db.session.commit()
        
        return jsonify(new_appointment.to_dict()), 201
    except Exception as e:
        logger.error(f"Error creating appointment: {str(e)}")
        return jsonify({"error": f"Failed to create appointment: {str(e)}"}), 500

@appointments_bp.route('/<int:appointment_id>', methods=['PUT'])
def update_appointment(appointment_id):
    """Update an existing appointment."""
    try:
        appointment = Appointment.query.get_or_404(appointment_id)
        data = request.get_json()
        
        # Update fields if provided
        if 'title' in data:
            appointment.title = data['title']
        if 'description' in data:
            appointment.description = data['description']
        if 'urgency_level' in data:
            appointment.urgency_level = data['urgency_level']
        if 'status' in data:
            appointment.status = data['status']
        if 'appointment_time' in data:
            appointment.appointment_time = datetime.fromisoformat(data['appointment_time']) if data['appointment_time'] else None
        
        appointment.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify(appointment.to_dict())
    except Exception as e:
        logger.error(f"Error updating appointment {appointment_id}: {str(e)}")
        return jsonify({"error": f"Failed to update appointment: {str(e)}"}), 500

@appointments_bp.route('/<int:appointment_id>', methods=['DELETE'])
def delete_appointment(appointment_id):
    """Delete an appointment."""
    try:
        appointment = Appointment.query.get_or_404(appointment_id)
        
        db.session.delete(appointment)
        db.session.commit()
        
        return jsonify({"message": f"Appointment {appointment_id} deleted successfully"}), 200
    except Exception as e:
        logger.error(f"Error deleting appointment {appointment_id}: {str(e)}")
        return jsonify({"error": f"Failed to delete appointment: {str(e)}"}), 500
