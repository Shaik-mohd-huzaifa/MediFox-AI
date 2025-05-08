"""PubMed API Tool for retrieving medical information."""
import os
import logging
from typing import Dict, List, Optional, Any
from Bio import Entrez

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PubMedTool:
    """Tool for searching PubMed and retrieving medical information."""
    
    name = "pubmed_search"
    description = """
    Useful for retrieving medical information from PubMed database.
    This tool helps find medical literature related to symptoms, conditions, and treatments.
    Input should be a search query related to medical symptoms or conditions.
    """
    
    def __init__(self):
        """Initialize the PubMed tool with API configuration."""
        # Set Entrez parameters from environment variables or use defaults
        # This is critical - NCBI requires a valid email address
        Entrez.email = os.environ.get("PUBMED_API_EMAIL", "your-email@example.com")
        if not Entrez.email or Entrez.email == "your-email@example.com":
            # Forcing a valid default email since this is required by NCBI
            logger.warning("No PUBMED_API_EMAIL found in environment, using default email")
            Entrez.email = "nuverse.hackathon@example.com"  # Use a more specific default
            
        Entrez.tool = os.environ.get("PUBMED_API_TOOL", "nuverse-symptom-assessment")
        logger.info(f"PubMed tool initialized with email: {Entrez.email} and tool: {Entrez.tool}")
        
    
    def _run(self, query: str, max_results: int = 5) -> List[Dict[str, Any]]:
        """Execute the PubMed search with the given query.
        
        Args:
            query: The search query for PubMed
            max_results: Maximum number of results to return
            
        Returns:
            List of dictionaries containing article information
        """
        try:
            # Search for query in PubMed
            logger.info(f"PubMed search started with query: '{query}' (max_results={max_results})")
            
            try:
                # First check if Entrez email is configured
                logger.info(f"Using Entrez email: {Entrez.email}")
                handle = Entrez.esearch(db="pubmed", term=query, retmax=max_results, sort="relevance")
                record = Entrez.read(handle)
                handle.close()
                
                # Log the search results
                logger.info(f"PubMed search results: Found {len(record.get('IdList', []))} articles")
                logger.info(f"PubMed ID list: {record.get('IdList', [])}")
                
                if not record.get("IdList", []):
                    logger.warning(f"No PubMed results found for query: {query}")
                    return [{"info": f"No results found for query: {query}"}]
            except Exception as search_error:
                logger.error(f"Error during PubMed search: {str(search_error)}")
                return [{"error": f"Error searching PubMed: {str(search_error)}"}]
            
            # Fetch details for the found articles
            article_ids = record["IdList"]
            logger.info(f"Fetching details for {len(article_ids)} articles")
            
            try:
                handle = Entrez.efetch(db="pubmed", id=article_ids, rettype="medline", retmode="text")
                records = handle.read()
                handle.close()
                logger.info(f"Successfully fetched article details, received {len(records)} bytes")
            except Exception as fetch_error:
                logger.error(f"Error fetching article details: {str(fetch_error)}")
                return [{"error": f"Error fetching article details: {str(fetch_error)}"}]
            
            # Parse and format the results
            articles = []
            
            # Simple parsing for demonstration purposes
            # In a production environment, use a more robust parser
            current_article = {}
            for line in records.split('\n'):
                if line.strip() == '':
                    if current_article:
                        articles.append(current_article)
                        current_article = {}
                    continue
                    
                if line.startswith('PMID-'):
                    current_article['pmid'] = line.replace('PMID-', '').strip()
                elif line.startswith('TI  -'):
                    current_article['title'] = line.replace('TI  -', '').strip()
                elif line.startswith('AB  -'):
                    if 'abstract' not in current_article:
                        current_article['abstract'] = line.replace('AB  -', '').strip()
                    else:
                        current_article['abstract'] += ' ' + line.strip()
                elif line.startswith('DP  -'):
                    current_article['date'] = line.replace('DP  -', '').strip()
            
            # Add the last article if it exists
            if current_article:
                articles.append(current_article)
                
            # Format the results for the agent
            formatted_results = []
            for article in articles:
                formatted_results.append({
                    "pmid": article.get('pmid', 'N/A'),
                    "title": article.get('title', 'No title available'),
                    "abstract": article.get('abstract', 'No abstract available'),
                    "date": article.get('date', 'N/A')
                })
            
            # Log the final formatted results
            logger.info(f"PubMed search completed successfully, found {len(formatted_results)} formatted articles")
            for idx, result in enumerate(formatted_results):
                logger.info(f"PubMed result #{idx+1}: PMID={result['pmid']}, Title={result['title'][:50]}...")
                
            return formatted_results
            
        except Exception as e:
            logger.error(f"Error searching PubMed: {str(e)}")
            return [{"error": f"Error searching PubMed: {str(e)}"}]
    
    async def _arun(self, query: str, max_results: int = 5) -> List[Dict[str, Any]]:
        """Async implementation of the PubMed search."""
        # For simplicity, we're just calling the sync version
        return self._run(query, max_results)
