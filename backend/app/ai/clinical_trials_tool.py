import requests
import logging
import re
from typing import List, Dict, Any, Optional
from datetime import datetime

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ClinicalTrialsTool:
    """Tool for retrieving clinical trials from ClinicalTrials.gov relevant to a user query."""
    
    def __init__(self):
        """Initialize the ClinicalTrials.gov tool."""
        self.base_url = "https://clinicaltrials.gov/api/v2/studies"
        
    def _extract_medical_terms(self, query: str) -> str:
        """
        Extract relevant medical terms from a user query.
        
        Args:
            query: The raw user query string
            
        Returns:
            A refined query string with medical terms
        """
        # Remove common words and question structures that aren't relevant for search
        query = re.sub(r"\b(have|has|having|experiencing|suffering|from|with|and|the|is|are|my|I|feel|feeling|patient)\b", "", query, flags=re.IGNORECASE)
        # Remove question marks and other punctuation
        query = re.sub(r"[?!.,]", "", query)
        # Remove extra spaces
        query = re.sub(r"\s+", " ", query).strip()
        
        logger.info(f"Extracted medical terms from query: '{query}'")
        return query
    
    def _run(self, query: str, max_results: int = 5) -> List[Dict[str, Any]]:
        """
        Search for clinical trials related to the query.
        
        Args:
            query: The search query
            max_results: Maximum number of results to return
            
        Returns:
            A list of clinical trials
        """
        # Extract medical terms for better search
        refined_query = self._extract_medical_terms(query)
        
        if not refined_query:
            logger.warning("No valid search terms found in query")
            return [{"info": "No valid search terms found in query"}]
        
        # Prepare request parameters for the v2 API
        params = {
            "query.term": refined_query,
            "pageSize": max_results
        }
        
        try:
            # Send request to ClinicalTrials.gov API v2
            logger.info(f"Sending request to ClinicalTrials.gov API v2 with query: {refined_query}")
            response = requests.get(self.base_url, params=params)
            response.raise_for_status()
            
            # Parse response
            data = response.json()
            
            # Check if we have studies in the response
            studies = data.get("studies", [])
            
            if not studies:
                logger.info("No clinical trials found for query")
                return [{"info": "No clinical trials found for your query"}]
            
            # Format results
            results = []
            for study in studies:
                trial = self.format_trial(study)
                results.append(trial)
            
            logger.info(f"Found {len(results)} clinical trials for query: {refined_query}")
            return results
            
        except requests.RequestException as e:
            logger.error(f"Error fetching clinical trials: {str(e)}")
            return [{"error": f"Failed to fetch clinical trials: {str(e)}"}]
        except Exception as e:
            logger.error(f"Unexpected error processing clinical trials: {str(e)}")
            return [{"error": f"Unexpected error processing clinical trials: {str(e)}"}]
            
    def format_trial(self, study: Dict[str, Any]) -> Dict[str, Any]:
        """
        Format a clinical trial for API response
        
        Args:
            study: The study data from ClinicalTrials.gov API v2
            
        Returns:
            A formatted trial dictionary
        """
        # Extract key information from the v2 API response structure
        protocol = study.get("protocolSection", {})
        identification = protocol.get("identificationModule", {})
        status_module = protocol.get("statusModule", {})
        design_module = protocol.get("designModule", {})
        description_module = protocol.get("descriptionModule", {})
        conditions_module = protocol.get("conditionsModule", {})
        
        # Extract basic information
        nct_id = identification.get("nctId", "")
        title = identification.get("briefTitle", "")
        status = status_module.get("overallStatus", "")
        phase = design_module.get("phases", ["N/A"])[0] if design_module.get("phases") else "N/A"
        
        # Format dates
        start_date = status_module.get("startDateStruct", {}).get("date", "")
        completion_date = status_module.get("completionDateStruct", {}).get("date", "")
        
        # Extract conditions
        conditions = conditions_module.get("conditions", [])
        
        # Extract summary, limiting length
        summary = description_module.get("briefSummary", "")
        if len(summary) > 300:
            summary = summary[:297] + "..."
        
        # Create formatted trial object
        return {
            "nct_id": nct_id,
            "title": title,
            "conditions": conditions,
            "status": status,
            "phase": phase,
            "start_date": start_date,
            "completion_date": completion_date,
            "summary": summary,
            "url": f"https://clinicaltrials.gov/study/{nct_id}"
        }
        
    def get_trials_for_query(self, query: str, max_results: int = 3) -> List[Dict[str, Any]]:
        """
        Public method to get clinical trials for a user query.
        
        Args:
            query: The user's query string
            max_results: Maximum number of trials to return
            
        Returns:
            A list of relevant clinical trials
        """
        return self._run(query, max_results)
