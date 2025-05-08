"""PubMed API Tool for retrieving medical information using Entrez E-Utilities."""
import os
import logging
import requests
import json
import re
from typing import Dict, List, Optional, Any
from xml.etree import ElementTree

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PubMedTool:
    """Tool for searching PubMed and retrieving medical information using Entrez E-Utilities API."""
    
    name = "pubmed_search"
    description = """
    Useful for retrieving medical information from PubMed database.
    This tool helps find medical literature related to symptoms, conditions, and treatments.
    Input should be a search query related to medical symptoms or conditions.
    """
    
    def __init__(self):
        """Initialize the PubMed tool with API configuration."""
        # Set parameters for Entrez E-Utilities
        self.email = os.environ.get("PUBMED_API_EMAIL", "nuverse.hackathon@example.com")
        self.tool = os.environ.get("PUBMED_API_TOOL", "nuverse-symptom-assessment")
        
        # Base URLs for Entrez E-Utilities
        self.search_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
        self.fetch_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"
        self.summary_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"
        
        logger.info(f"PubMed tool initialized with email: {self.email} and tool: {self.tool}")
        
    
    def _process_medical_query(self, query: str) -> str:
        """Process a raw query into a more effective PubMed search query.
        
        Args:
            query: The original query string
            
        Returns:
            Optimized query string for PubMed search
        """
        # Extract common medical symptoms and create an optimized search query
        common_symptoms = [
            "headache", "migraine", "chest pain", "abdominal pain", "back pain", 
            "shortness of breath", "dyspnea", "fever", "cough", "nausea",
            "vomiting", "diarrhea", "dizziness", "vertigo", "fatigue",
            "weakness", "numbness", "tingling", "rash", "swelling", "edema",
            "hypertension", "high blood pressure", "low blood pressure", "hypotension",
            "tachycardia", "bradycardia", "arrhythmia", "palpitations",
            "insomnia", "anxiety", "depression", "confusion"
        ]
        
        # Check for specific symptoms in the query
        found_symptoms = []
        for symptom in common_symptoms:
            if re.search(r"\b" + symptom + r"\b", query.lower()):
                found_symptoms.append(symptom)
        
        if found_symptoms:
            # Create a more focused query with the identified symptoms
            focused_query = " AND ".join([f"\"{s}\"[Title/Abstract]" for s in found_symptoms])
            logger.info(f"Found specific symptoms: {found_symptoms}")
            logger.info(f"Created focused query: {focused_query}")
            return focused_query
        else:
            # If no common symptoms found, use the original query
            return query
    
    def _run(self, query: str, max_results: int = 10) -> List[Dict[str, Any]]:
        """Execute the PubMed search with the given query using direct API requests.
        
        Args:
            query: The search query for PubMed
            max_results: Maximum number of results to return
            
        Returns:
            List of dictionaries containing article information
        """
        try:
            logger.info(f"\n{'='*80}\nPUBMED SEARCH QUERY\n{'='*80}")
            logger.info(f"Starting PubMed search for query: '{query}' (max_results={max_results})")
            
            # Step 1: Process the query to optimize for medical search
            processed_query = self._process_medical_query(query)
            
            # Step 2: Search for articles using esearch
            search_params = {
                "db": "pubmed",
                "term": processed_query,
                "retmax": max_results,
                "retmode": "json",
                "sort": "relevance",
                "tool": self.tool,
                "email": self.email
            }
            
            try:
                logger.info(f"Sending esearch request to: {self.search_url}")
                search_response = requests.get(self.search_url, params=search_params)
                search_response.raise_for_status()  # Raise an exception for HTTP errors
                
                search_data = search_response.json()
                id_list = search_data.get("esearchresult", {}).get("idlist", [])
                
                logger.info(f"esearch results: Found {len(id_list)} articles")
                logger.info(f"Article IDs: {id_list}")
                
                if not id_list:
                    logger.warning(f"No PubMed results found for query: {query}")
                    return [{"info": f"No results found for query: {query}"}]
                
            except requests.exceptions.RequestException as e:
                logger.error(f"Error in esearch request: {str(e)}")
                return [{"error": f"Error searching PubMed: {str(e)}"}]
            except json.JSONDecodeError as e:
                logger.error(f"Error parsing JSON response: {str(e)}")
                return [{"error": f"Error parsing PubMed response: {str(e)}"}]
            
            # Step 2: Fetch detailed article information using efetch
            id_string = ",".join(id_list)
            fetch_params = {
                "db": "pubmed",
                "id": id_string,
                "retmode": "xml",
                "tool": self.tool,
                "email": self.email
            }
            
            try:
                logger.info(f"Sending efetch request to: {self.fetch_url}")
                fetch_response = requests.get(self.fetch_url, params=fetch_params)
                fetch_response.raise_for_status()
                
                # Parse XML response
                root = ElementTree.fromstring(fetch_response.content)
                logger.info(f"Successfully received and parsed XML response")
                
            except requests.exceptions.RequestException as e:
                logger.error(f"Error in efetch request: {str(e)}")
                return [{"error": f"Error fetching article details: {str(e)}"}]
            except ElementTree.ParseError as e:
                logger.error(f"Error parsing XML: {str(e)}")
                return [{"error": f"Error parsing XML response: {str(e)}"}]
            
            # Step 3: Extract structured data from the XML
            formatted_results = []
            
            for article in root.findall(".//PubmedArticle"):
                try:
                    # Extract basic metadata
                    pmid = article.findtext(".//PMID")
                    title = article.findtext(".//ArticleTitle") or "No title available"
                    
                    # Extract abstract (may be segmented)
                    abstract_elements = article.findall(".//AbstractText")
                    abstract_parts = []
                    for abstract_elem in abstract_elements:
                        label = abstract_elem.get("Label", "")
                        text = abstract_elem.text or ""
                        if label:
                            abstract_parts.append(f"{label}: {text}")
                        else:
                            abstract_parts.append(text)
                    
                    abstract = " ".join(abstract_parts) if abstract_parts else "No abstract available"
                    
                    # Extract journal information
                    journal = article.findtext(".//Journal/Title") or "N/A"
                    
                    # Extract publication date
                    year = article.findtext(".//PubDate/Year")
                    month = article.findtext(".//PubDate/Month")
                    day = article.findtext(".//PubDate/Day")
                    
                    if year:
                        date = year
                        if month:
                            date = f"{month} {date}"
                        if day:
                            date = f"{day} {date}"
                    else:
                        date = article.findtext(".//PubDate/MedlineDate") or "N/A"
                    
                    # Extract authors
                    authors = []
                    for author in article.findall(".//Author"):
                        last_name = author.findtext("LastName") or ""
                        fore_name = author.findtext("ForeName") or ""
                        initials = author.findtext("Initials") or ""
                        
                        if last_name:
                            if fore_name:
                                authors.append(f"{last_name} {fore_name}")
                            elif initials:
                                authors.append(f"{last_name} {initials}")
                            else:
                                authors.append(last_name)
                    
                    author_string = ", ".join(authors) if authors else "No authors listed"
                    
                    # Extract keywords
                    keywords = []
                    for keyword in article.findall(".//Keyword"):
                        if keyword.text:
                            keywords.append(keyword.text)
                    
                    # Extract MeSH terms for better metadata
                    mesh_terms = []
                    for mesh in article.findall(".//MeshHeading"):
                        descriptor = mesh.findtext("DescriptorName")
                        if descriptor:
                            mesh_terms.append(descriptor)
                    
                    # Create a detailed article object with enhanced metadata
                    article_data = {
                        "pmid": pmid,
                        "title": title,
                        "abstract": abstract,
                        "date": date,
                        "authors": author_string,
                        "journal": journal,
                        "keywords": keywords,
                        "mesh_terms": mesh_terms,
                        "url": f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/"
                    }
                    
                    formatted_results.append(article_data)
                    
                except Exception as parse_error:
                    logger.error(f"Error parsing article: {str(parse_error)}")
                    # Continue to next article
            
            # Print detailed information about each article
            logger.info(f"\n{'='*80}\nPUBMED SEARCH RESULTS\n{'='*80}")
            logger.info(f"Query: '{query}'")
            logger.info(f"Found {len(formatted_results)} relevant articles\n")
            
            for idx, result in enumerate(formatted_results):
                logger.info(f"ARTICLE {idx+1}:\n{'-'*50}")
                logger.info(f"Title: {result['title']}")
                logger.info(f"Authors: {result['authors']}")
                logger.info(f"Journal: {result['journal']}")
                logger.info(f"Date: {result['date']}")
                logger.info(f"PMID: {result['pmid']}")
                logger.info(f"URL: {result['url']}")
                
                # Show MeSH terms if available
                if result.get('mesh_terms'):
                    logger.info(f"MeSH Terms: {', '.join(result['mesh_terms'][:5])}" + 
                               ("..." if len(result['mesh_terms']) > 5 else ""))
                
                # Print a trimmed version of the abstract for readability
                abstract = result['abstract']
                if len(abstract) > 300:
                    abstract = abstract[:300] + "..."
                logger.info(f"Abstract Summary: {abstract}\n")
            
            logger.info(f"{'='*80}\nEnd of PubMed Search Results\n{'='*80}")
                
            return formatted_results
            
        except Exception as e:
            logger.error(f"Error searching PubMed: {str(e)}")
            return [{"error": f"Error searching PubMed: {str(e)}"}]
    
    async def _arun(self, query: str, max_results: int = 5) -> List[Dict[str, Any]]:
        """Async implementation of the PubMed search."""
        # For simplicity, we're just calling the sync version
        return self._run(query, max_results)
