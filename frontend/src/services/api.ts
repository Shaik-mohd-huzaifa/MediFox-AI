import axios from 'axios';

// API base URL - This will be proxied to the backend through the Vite server
const API_BASE_URL = '/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Type definitions
export interface SymptomAssessmentRequest {
  symptoms: string;
  age?: number;
  sex?: string;
  medical_history?: string;
  patient_id?: string;
}

export interface PubMedReference {
  pmid: string;
  title: string;
  abstract: string;
  date: string;
}

export interface ClinicalTrial {
  nct_id: string;
  title: string;
  status: string;
  phase: string;
  summary: string;
  conditions: string[];
  start_date: string;
  completion_date: string;
  url: string;
}

export interface SymptomAssessmentResponse {
  id: number;
  patient_id?: string;
  symptoms: string;
  age?: number;
  sex?: string;
  medical_history?: string;
  urgency_level: string;
  urgency_description: string;
  reasoning: string;
  recommendations: string; // JSON string to be parsed
  dos?: string[]; // List of recommended actions
  donts?: string[]; // List of actions to avoid
  disclaimer: string;
  created_at: string;
  pubmed_references?: PubMedReference[];
  clinical_trials?: ClinicalTrial[];
}

// AI Service API
const aiService = {
  // Health check endpoint
  checkHealth: async () => {
    try {
      const response = await api.get('/ai/health');
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  },
  
  // Assess symptoms endpoint
  assessSymptoms: async (data: SymptomAssessmentRequest): Promise<SymptomAssessmentResponse> => {
    try {
      const response = await api.post('/ai/assess-symptoms', data);
      
      // Parse the recommendations from JSON string to object
      if (response.data.recommendations && typeof response.data.recommendations === 'string') {
        response.data.recommendations = JSON.parse(response.data.recommendations);
      }
      
      // Parse dos and donts arrays if they're in string format
      if (response.data.dos && typeof response.data.dos === 'string') {
        response.data.dos = JSON.parse(response.data.dos);
      }
      
      if (response.data.donts && typeof response.data.donts === 'string') {
        response.data.donts = JSON.parse(response.data.donts);
      }
      
      return response.data;
    } catch (error) {
      console.error('Symptom assessment failed:', error);
      throw error;
    }
  },
  
  // Get all assessments
  getAssessments: async (patientId?: string) => {
    try {
      const params = patientId ? { patient_id: patientId } : {};
      const response = await api.get('/ai/assessments', { params });
      
      // Parse the recommendations from JSON string to object for each assessment
      response.data.forEach((assessment: SymptomAssessmentResponse) => {
        if (assessment.recommendations && typeof assessment.recommendations === 'string') {
          assessment.recommendations = JSON.parse(assessment.recommendations);
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Failed to get assessments:', error);
      throw error;
    }
  },
  
  // Get a specific assessment by ID
  getAssessment: async (assessmentId: number): Promise<SymptomAssessmentResponse> => {
    try {
      const response = await api.get(`/ai/assessments/${assessmentId}`);
      
      // Parse the recommendations from JSON string to object
      if (response.data.recommendations && typeof response.data.recommendations === 'string') {
        response.data.recommendations = JSON.parse(response.data.recommendations);
      }
      
      return response.data;
    } catch (error) {
      console.error(`Failed to get assessment ${assessmentId}:`, error);
      throw error;
    }
  }
};

export default aiService;
