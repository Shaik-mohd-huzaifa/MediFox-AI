"""Symptom Assessment Agent using OpenAI directly."""
import os
import logging
import json
from typing import Dict, List, Any, Optional
from openai import OpenAI
from datetime import datetime

from .pubmed_tool import PubMedTool
from ..models import MedicalDocument

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Define urgency levels
URGENCY_LEVELS = {
    "EMERGENCY": "Seek immediate emergency care (call emergency services or go to ER)",
    "URGENT": "See a doctor within 24 hours",
    "SEMI_URGENT": "Schedule an appointment within a few days",
    "ROUTINE": "Schedule a routine appointment",
    "SELF_CARE": "Can be managed with self-care at home with monitoring"
}

# Define structure without using Pydantic models to avoid compatibility issues

class SymptomAssessmentAgent:
    """Agent for assessing symptoms and providing urgency recommendations."""
    
    def __init__(self):
        """Initialize the symptom assessment agent."""
        # Initialize OpenAI client
        # Use a dummy API key if environment variable is not set
        api_key = os.environ.get("OPENAI_API_KEY", "dummy-api-key-for-testing")
        self.client = OpenAI(api_key=api_key)
        # Flag to track if we have a real API key
        self.has_valid_api_key = api_key != "dummy-api-key-for-testing"
        
        # Create PubMed tool
        self.pubmed_tool = PubMedTool()
        
        # Initialize conversation history
        self.conversation_history = []
        
        # System prompt for the assessment
        self.system_prompt = """You are an AI medical pre-assessment assistant speaking DIRECTLY TO THE PATIENT. 
        Your task is to evaluate the patient's reported symptoms and provide an initial assessment of urgency.

        IMPORTANT GUIDELINES:
        1. ALWAYS speak directly to the patient as if they are in front of you (use "you" instead of "the patient")
        2. Use a compassionate, clear, and reassuring tone
        3. NEVER provide a definitive diagnosis - only assess the urgency level
        4. When symptoms are potentially serious, err on the side of caution
        5. Consider patient demographics (age, sex, medical history) when relevant
        6. Always include a clear disclaimer about the limitations of AI assessment
        7. Make your response conversational and human-like

        Urgency Levels:
        - high: Conditions requiring immediate medical attention (e.g., chest pain with shortness of breath)
        - medium: Conditions requiring care soon (e.g., high fever with stiff neck)
        - low: Conditions that can be managed with routine care or self-care (e.g., common cold)
        
        In your JSON response, use natural language in all fields as if speaking directly to the patient.
        For example, in the reasoning field, say "Based on your symptoms of X and Y, I'm concerned about..." rather than
        "The patient presents with symptoms that indicate..."
        
        Format your response as a JSON object with the following structure:
        {
            "urgency_level": "[high/medium/low]",
            "urgency_description": "[brief description of urgency recommendation addressed to the patient]",
            "reasoning": "[detailed explanation of your assessment addressed directly to the patient]",
            "recommendations": ["recommendation1 addressed to patient", "recommendation2 addressed to patient", ...],
            "disclaimer": "I'm an AI assistant and this is not a medical diagnosis. Please consult with a healthcare professional for proper medical advice."
        }
        """
    
    def assess_symptoms(self, symptoms: str, age: int = None, sex: str = None, 
                  medical_history: str = None, patient_id: str = None) -> Dict[str, Any]:
        """Assess patient symptoms and determine urgency level.
        
        Args:
            symptoms: Description of the symptoms
            age: Patient age (optional)
            sex: Patient sex (optional)
            medical_history: Medical history (optional)
            
        Returns:
            Assessment results including urgency level and recommendations
        """
        try:
            # Prepare the input with all available information
            patient_info = []
            if age is not None:
                patient_info.append(f"Age: {age}")
            if sex is not None:
                patient_info.append(f"Sex: {sex}")
            if medical_history is not None:
                patient_info.append(f"Medical History: {medical_history}")
            
            # Retrieve patient documents if patient_id is provided
            document_texts = []
            used_document_ids = []
            if patient_id:
                try:
                    # Get all documents for this patient
                    patient_documents = MedicalDocument.query.filter_by(patient_id=patient_id).all()
                    
                    if patient_documents:
                        for doc in patient_documents:
                            if doc.content_text:  # Only include if we have extracted text
                                # Add a summary of the document with its content
                                doc_summary = f"Document: {doc.filename} ({doc.file_type})\n"
                                doc_summary += f"Content:\n{doc.content_text[:2000]}" # Limit to first 2000 chars
                                if len(doc.content_text) > 2000:
                                    doc_summary += "...(truncated)"
                                
                                document_texts.append(doc_summary)
                                used_document_ids.append(doc.id)
                except Exception as e:
                    logger.error(f"Error retrieving patient documents: {str(e)}")
            
            patient_context = "; ".join(patient_info) if patient_info else "No additional patient information provided"
            
            # Step 1: First determine if this is a medical query and needs PubMed
            # Define classifier tool
            classify_tools = [
                {
                    "type": "function",
                    "function": {
                        "name": "classify_medical_query",
                        "description": "Classify if a user query is medical in nature and requires a health assessment",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "is_medical": {
                                    "type": "boolean",
                                    "description": "Whether the query is medical in nature"
                                },
                                "reason": {
                                    "type": "string",
                                    "description": "Reasoning for the classification"
                                },
                                "relevant_medical_documents": {
                                    "type": "boolean",
                                    "description": "Whether uploaded medical documents seem relevant to this query"
                                }
                            },
                            "required": ["is_medical", "reason"]
                        }
                    }
                }
            ]
            
            # Send the classification request
            logger.info(f"Classifying if this is a medical query: {symptoms}")
            classification_response = self.client.chat.completions.create(
                model="gpt-4o",
                temperature=0.2,
                messages=[
                    {"role": "system", "content": "You are a medical assistant that determines if a message contains medical symptoms or conditions. Analyze if this query requires medical assessment and if it needs PubMed research."},
                    {"role": "user", "content": f"Message: {symptoms}\n\nPatient context: {patient_context}"}
                ],
                tools=classify_tools,
                tool_choice={"type": "function", "function": {"name": "classify_medical_query"}}
            )
            
            # Extract classification results
            tool_call = classification_response.choices[0].message.tool_calls[0]
            classify_result = json.loads(tool_call.function.arguments)
            is_medical_query = classify_result.get('is_medical', False)
            medical_classification_reason = classify_result.get('reason', "")
            documents_relevant = classify_result.get('relevant_medical_documents', False)
            
            # Default to searching PubMed if it's a medical query
            search_pubmed = is_medical_query
            pubmed_query = symptoms if search_pubmed else None
            
            logger.info(f"Medical classification: is_medical={is_medical_query}, search_pubmed={search_pubmed}, reason={medical_classification_reason}")
            
            # Step 2: Get PubMed references if needed
            pubmed_info = ""
            pubmed_references = []
            
            if search_pubmed and pubmed_query:
                logger.info(f"Searching PubMed with query: {pubmed_query}")
                try:
                    # Run the PubMed search
                    references = self.pubmed_tool._run(pubmed_query, max_results=3)
                    
                    # Detailed logging of raw references
                    logger.info(f"Raw PubMed search results: {json.dumps(references)}")
                    
                    if references and not any('error' in ref for ref in references):
                        pubmed_references = []
                        pubmed_info = "\n\nRelevant medical literature:\n"
                        
                        # Process references
                        for ref in references[:2]:  # Limit to 2 most relevant
                            ref_title = ref.get('title', 'No title')
                            ref_pmid = ref.get('pmid', 'N/A')
                            logger.info(f"Processing PubMed reference: {ref_title} (PMID: {ref_pmid})")
                            
                            pubmed_info += f"- {ref_title} (PMID: {ref_pmid})\n"
                            
                            # Format abstract
                            abstract = ref.get('abstract', 'No abstract available')
                            if abstract and abstract != 'No abstract available':
                                formatted_abstract = abstract[:200] + '...' if len(abstract) > 200 else abstract
                            else:
                                formatted_abstract = 'No abstract available'
                            
                            # Create reference object
                            ref_obj = {
                                "pmid": ref_pmid,
                                "title": ref_title,
                                "abstract": formatted_abstract,
                                "date": ref.get('date', 'N/A')
                            }
                            
                            pubmed_references.append(ref_obj)
                            logger.info(f"Added PubMed reference: {json.dumps(ref_obj)}")
                        
                        logger.info(f"Total PubMed references processed: {len(pubmed_references)}")
                    else:
                        logger.warning(f"No valid PubMed references found or references contain errors")
                except Exception as pub_err:
                    logger.error(f"Error getting PubMed references: {str(pub_err)}", exc_info=True)
                    
            # Step 3: Perform the full assessment
            # Format input for the main assessment
            user_prompt = (f"Patient symptoms: {symptoms}\n\n"
                         f"Patient information: {patient_context}\n\n")
            
            # Add document content if relevant
            if document_texts and documents_relevant:
                user_prompt += "\n\nPatient's Medical Documents:\n"
                for i, doc_text in enumerate(document_texts, 1):
                    user_prompt += f"\n--- Document {i} ---\n{doc_text}\n"
                user_prompt += "\nPlease consider these medical documents in your assessment.\n"
            
            user_prompt += "\nPlease assess the urgency of these symptoms and provide recommendations."
            
            # Add any PubMed info to our assessment prompt
            if pubmed_info:
                user_prompt += pubmed_info
            
                
            # Prepare messages for assessment
            assessment_messages = [
                {"role": "system", "content": self.system_prompt}
            ]
            
            # Add relevant conversation history for context
            if self.conversation_history:
                # Add up to 3 recent exchanges for context
                for msg in self.conversation_history[-6:]:
                    assessment_messages.append(msg)
            
            # Add the current prompt with all collected information
            assessment_messages.append({"role": "user", "content": user_prompt})
            
            # Check if we have a valid API key before making a request
            if not self.has_valid_api_key:
                logger.error("No valid OpenAI API key found. Please set the OPENAI_API_KEY environment variable.")
                return {
                    "error": "OpenAI API key is not configured. Please set up your API key.",
                    "urgency_level": "medium",
                    "urgency_description": "Due to system configuration error, we recommend consulting with a healthcare professional",
                    "reasoning": "System error occurred. Please consult with a healthcare professional.",
                    "recommendations": ["Consult with a healthcare professional as soon as possible", 
                                      "For technical support, contact the system administrator to set up the API key"],
                    "disclaimer": "This is an AI-assisted pre-assessment and not a medical diagnosis. Always consult with a healthcare professional for proper medical advice.",
                    "pubmed_references": [],
                    "is_medical_query": True,
                    "classification_reason": "Unable to classify due to API configuration issue"
                }
            
            # Call the OpenAI API using SDK
            try:
                response = self.client.chat.completions.create(
                    model="gpt-4o",
                    temperature=0,
                    response_format={"type": "json_object"},
                    messages=assessment_messages
                )
            except Exception as api_error:
                logger.error(f"Error calling OpenAI API: {str(api_error)}")
                return {
                    "error": f"Failed to communicate with AI service: {str(api_error)}",
                    "urgency_level": "medium",
                    "urgency_description": "Due to a system error, we recommend consulting with a healthcare professional",
                    "reasoning": "System error occurred. Please consult with a healthcare professional.",
                    "recommendations": ["Consult with a healthcare professional as soon as possible"],
                    "disclaimer": "This is an AI-assisted pre-assessment and not a medical diagnosis. Always consult with a healthcare professional for proper medical advice.",
                    "pubmed_references": [],
                    "is_medical_query": True,
                    "classification_reason": "Unable to classify due to API error"
                }
            
            # Add the response to conversation history
            self.conversation_history.append({"role": "assistant", "content": response.choices[0].message.content})
            
            # Extract the response content
            response_content = response.choices[0].message.content
            
            # Parse the JSON response
            assessment = json.loads(response_content)
            
            # Add standard fields if they're missing
            if "disclaimer" not in assessment:
                assessment["disclaimer"] = "This is an AI-assisted pre-assessment and not a medical diagnosis. Always consult with a healthcare professional for proper medical advice."
            
            # Convert to appropriate urgency description format
            if assessment["urgency_level"] == "high":
                assessment["urgency_level"] = "high"
                if not "urgency_description" in assessment or not assessment["urgency_description"]:
                    assessment["urgency_description"] = "Seek immediate medical attention"
            elif assessment["urgency_level"] == "medium":
                assessment["urgency_level"] = "medium"
                if not "urgency_description" in assessment or not assessment["urgency_description"]:
                    assessment["urgency_description"] = "Consult with a healthcare provider soon"
            else:
                # Default urgency for non-urgent cases
                assessment["urgency_level"] = "low"
                if not "urgency_description" in assessment or not assessment["urgency_description"]:
                    assessment["urgency_description"] = "Monitor symptoms and practice appropriate self-care"
            
            # Format the response as a dict
            assessment = {
                "urgency_level": assessment["urgency_level"],
                "urgency_description": assessment["urgency_description"],
                "reasoning": assessment["reasoning"],
                "recommendations": assessment["recommendations"],
                "disclaimer": assessment["disclaimer"],
                "is_medical_query": is_medical_query,
                "classification_reason": medical_classification_reason,
                "used_document_ids": used_document_ids
            }
            
            # Add PubMed references if any
            if pubmed_references:
                logger.info(f"Adding {len(pubmed_references)} PubMed references to final response")
                assessment["pubmed_references"] = pubmed_references
            else:
                logger.warning("No PubMed references to add to the response")
                assessment["pubmed_references"] = []
            
            # Log the entire assessment for debugging
            logger.info(f"Final assessment response structure: {json.dumps({k: type(v).__name__ for k, v in assessment.items()})}")
            if 'pubmed_references' in assessment:
                logger.info(f"PubMed references in final response: {json.dumps(assessment['pubmed_references'])}")
            
            return assessment
            
        except Exception as e:
            logger.error(f"Error in symptom assessment: {str(e)}")
            return {
                "error": f"Failed to complete symptom assessment: {str(e)}",
                "urgency_level": "medium",
                "urgency_description": "Due to an error in processing, we recommend consulting with a healthcare professional",
                "reasoning": "Assessment error occurred. Please consult with a healthcare professional.",
                "recommendations": ["Consult with a healthcare professional as soon as possible"],
                "disclaimer": "This is an AI-assisted pre-assessment and not a medical diagnosis. Always consult with a healthcare professional for proper medical advice.",
                "pubmed_references": []
            }
    # No need for a parse_assessment method as we're using JSON directly
