"""Routes for handling medical document uploads and management."""
import logging
import json
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename

from .. import db
from ..models import MedicalDocument
from .document_utils import save_uploaded_file, extract_text_from_document, SUPPORTED_FILE_TYPES

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Blueprint
documents_bp = Blueprint('documents', __name__, url_prefix='/api/documents')

@documents_bp.route('/upload', methods=['POST'])
def upload_document():
    """Upload a medical document for a patient."""
    try:
        # Check if the request has the file part
        if 'file' not in request.files:
            return jsonify({"error": "No file part in the request"}), 400
            
        file = request.files['file']
        patient_id = request.form.get('patient_id')
        
        # Validate input
        if not file or file.filename == '':
            return jsonify({"error": "No file selected"}), 400
            
        if not patient_id:
            return jsonify({"error": "Patient ID is required"}), 400
            
        # Check if file type is supported
        file_type = file.content_type
        supported_types = []
        for types in SUPPORTED_FILE_TYPES.values():
            supported_types.extend(types)
            
        if file_type not in supported_types:
            return jsonify({
                "error": f"Unsupported file type: {file_type}. Supported types are: {', '.join(supported_types)}"
            }), 400
            
        # Save the file
        filename, file_path, file_type, file_size = save_uploaded_file(file, patient_id)
        
        # Extract text from the document
        content_text = extract_text_from_document(file_path, file_type)
        
        # Create a document record in the database
        new_document = MedicalDocument(
            patient_id=patient_id,
            filename=filename,
            file_type=file_type,
            file_size=file_size,
            file_path=file_path,
            content_text=content_text,
            metadata=json.dumps({
                "original_filename": file.filename,
                "content_extraction_success": content_text is not None
            })
        )
        
        db.session.add(new_document)
        db.session.commit()
        
        return jsonify(new_document.to_dict()), 201
        
    except Exception as e:
        logger.error(f"Error uploading document: {str(e)}")
        return jsonify({"error": f"Failed to upload document: {str(e)}"}), 500

@documents_bp.route('/patient/<patient_id>', methods=['GET'])
def get_patient_documents(patient_id):
    """Get all documents for a specific patient."""
    try:
        documents = MedicalDocument.query.filter_by(patient_id=patient_id).all()
        return jsonify([doc.to_dict() for doc in documents])
        
    except Exception as e:
        logger.error(f"Error retrieving patient documents: {str(e)}")
        return jsonify({"error": f"Failed to retrieve patient documents: {str(e)}"}), 500

@documents_bp.route('/<int:document_id>', methods=['GET'])
def get_document(document_id):
    """Get a specific document by ID."""
    try:
        document = MedicalDocument.query.get_or_404(document_id)
        return jsonify(document.to_dict())
        
    except Exception as e:
        logger.error(f"Error retrieving document {document_id}: {str(e)}")
        return jsonify({"error": f"Failed to retrieve document: {str(e)}"}), 500

@documents_bp.route('/<int:document_id>', methods=['DELETE'])
def delete_document(document_id):
    """Delete a specific document by ID."""
    try:
        document = MedicalDocument.query.get_or_404(document_id)
        
        # Delete the physical file
        try:
            import os
            if os.path.exists(document.file_path):
                os.remove(document.file_path)
        except Exception as e:
            logger.warning(f"Could not delete physical file: {str(e)}")
        
        # Delete from database
        db.session.delete(document)
        db.session.commit()
        
        return jsonify({"message": "Document deleted successfully"}), 200
        
    except Exception as e:
        logger.error(f"Error deleting document {document_id}: {str(e)}")
        return jsonify({"error": f"Failed to delete document: {str(e)}"}), 500
