"""Utilities for handling document uploads and text extraction."""
import os
import logging
from typing import Optional
import tempfile
from werkzeug.utils import secure_filename

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Define supported file types
SUPPORTED_FILE_TYPES = {
    'pdf': ['application/pdf'],
    'text': ['text/plain'],
    'image': ['image/jpeg', 'image/png', 'image/jpg'],
    'doc': ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
}

def extract_text_from_document(file_path: str, file_type: str) -> Optional[str]:
    """
    Extract text content from uploaded documents based on their file type.
    
    Args:
        file_path: Path to the uploaded file
        file_type: MIME type of the file
        
    Returns:
        Extracted text content or None if extraction failed
    """
    try:
        # Text files
        if file_type in SUPPORTED_FILE_TYPES['text']:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                return f.read()
                
        # PDF files
        elif file_type in SUPPORTED_FILE_TYPES['pdf']:
            try:
                # Try to import PyPDF2
                from PyPDF2 import PdfReader
                reader = PdfReader(file_path)
                text = ""
                for page in reader.pages:
                    text += page.extract_text() + "\n"
                return text
            except ImportError:
                logger.warning("PyPDF2 not installed. Cannot extract text from PDF.")
                return f"[PDF document content: {os.path.basename(file_path)}. Text extraction unavailable.]"
                
        # Image files - would require OCR, not implemented in this demo
        elif file_type in SUPPORTED_FILE_TYPES['image']:
            # In a production environment, you'd implement OCR here
            return f"[Image document: {os.path.basename(file_path)}. OCR processing not implemented in demo.]"
            
        # Word documents - would require additional libraries
        elif file_type in SUPPORTED_FILE_TYPES['doc']:
            # In a production environment, you'd implement doc parsing here
            return f"[Word document: {os.path.basename(file_path)}. Text extraction not implemented in demo.]"
            
        else:
            logger.warning(f"Unsupported file type for text extraction: {file_type}")
            return f"[Document content extraction not supported for file type: {file_type}]"
            
    except Exception as e:
        logger.error(f"Error extracting text from document: {str(e)}")
        return None
        
def get_upload_directory():
    """Get the directory for storing uploaded files."""
    # In a production system, you would use a proper file storage service
    # For this demo, we'll use a temporary directory
    upload_dir = os.path.join(tempfile.gettempdir(), 'medical_documents')
    
    # Create the directory if it doesn't exist
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir)
        
    return upload_dir
    
def save_uploaded_file(file, patient_id: str) -> tuple:
    """
    Save an uploaded file to the appropriate location.
    
    Args:
        file: The uploaded file object
        patient_id: ID of the patient
        
    Returns:
        Tuple of (filename, file_path, file_type, file_size)
    """
    upload_dir = get_upload_directory()
    
    # Create a secure filename
    filename = secure_filename(file.filename)
    
    # Add patient_id to create a unique path
    patient_dir = os.path.join(upload_dir, str(patient_id))
    if not os.path.exists(patient_dir):
        os.makedirs(patient_dir)
        
    # Create a unique filename
    import uuid
    unique_filename = f"{uuid.uuid4()}_{filename}"
    file_path = os.path.join(patient_dir, unique_filename)
    
    # Save the file
    file.save(file_path)
    
    # Get file information
    file_size = os.path.getsize(file_path)
    file_type = file.content_type
    
    return (filename, file_path, file_type, file_size)
