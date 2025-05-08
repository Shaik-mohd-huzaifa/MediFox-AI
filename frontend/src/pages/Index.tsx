import { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import ChatInput from '../components/ChatInput';
import ChatMessage from '../components/ChatMessage';
import PromptCategory from '../components/PromptCategory';
import ChatHeader from '../components/ChatHeader';
import { useToast } from "@/hooks/use-toast";
import { SymptomAssessment } from "@/components/SymptomAssessment";
import aiService, { PubMedReference, ClinicalTrial, SymptomAssessmentResponse } from '../services/api';

interface Message {
  text: string;
  isUser: boolean;
  isLoading?: boolean;
  pubmedReferences?: PubMedReference[];
  clinicalTrials?: ClinicalTrial[];
  dos?: string[];
  donts?: string[];
}

const Index = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const initialMessage = "Hi there! I'm Medifox, your personal healthcare assistant. How can I help you today?";
  
  // Function to start a new chat
  const handleNewChat = () => {
    setMessages([{ text: initialMessage, isUser: false }]);
    toast({
      title: "New conversation started",
      description: "Your chat history has been cleared"
    });
  };

  useEffect(() => {
    // Add initial bot greeting
    if (messages.length === 0) {
      setMessages([{ text: initialMessage, isUser: false }]);
    }
  }, [messages.length, initialMessage]);

  useEffect(() => {
    // Scroll to the latest message
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    // Check if message contains patient context
    const patientContextRegex = /\[Speaking as patient: (.+?)\] (.+)/;
    const patientContextMatch = text.match(patientContextRegex);
    
    let displayText = text;
    let symptomText = text;
    let patientName = '';
    
    if (patientContextMatch) {
      // Extract patient name and actual message
      patientName = patientContextMatch[1]; // The patient's name
      displayText = patientContextMatch[2]; // The actual message
      symptomText = `Patient ${patientName} reports: ${displayText}`;
    }
    
    // Add user message (but display only the actual message part)
    setMessages((prev) => [...prev, { text: displayText, isUser: true }]);
    
    try {
      // Show loading state
      setMessages((prev) => [...prev, { text: "Thinking...", isUser: false, isLoading: true }]);
      
      // Send request to the backend AI service with full context
      const response = await aiService.assessSymptoms({
        symptoms: symptomText,
      });
      
      // Generate a more personalized response if speaking as a patient
      let responsePrefix = '';
      if (patientName) {
        responsePrefix = `Based on what you've told me, ${patientName}, `;
      }
      
      // Remove the loading message
      setMessages((prev) => prev.filter(msg => !msg.isLoading));
      
      // Extract PubMed references if available
      // Note: API returns them as 'references', not 'pubmed_references'
      const pubmedReferences = response.references || response.pubmed_references || [];
      
      // Extract clinical trials if available
      const clinicalTrials = response.clinical_trials || [];
      
      // Debug log for clinical trials
      console.log('Response clinical_trials field:', response.clinical_trials);
      console.log('Clinical trials extracted:', clinicalTrials);
      console.log('Clinical trials count:', clinicalTrials.length);
      
      // Extract Do's and Don'ts if available
      const dos = response.dos || [];
      const donts = response.donts || [];
      
      // Log response data for debugging
      console.log('Response from backend:', response);
      console.log('PubMed references extracted:', pubmedReferences);
      console.log('Number of PubMed references:', pubmedReferences.length);
      console.log('Clinical trials extracted:', clinicalTrials);
      console.log('Number of clinical trials:', clinicalTrials.length);
      console.log('Do\'s extracted:', dos);
      console.log('Don\'ts extracted:', donts);
      
      // Create a comprehensive response from the assessment
      const recommendations = response.recommendations;
      
      // Handle recommendations appropriately based on type
      let recommendationsText = '';
      if (Array.isArray(recommendations)) {
        // If it's already an array, join them with newlines
        recommendationsText = recommendations.join('\n');
      } else if (typeof recommendations === 'string') {
        // If it's a string but not JSON, use as is
        try {
          // Try to parse it in case it's still a JSON string
          const parsed = JSON.parse(recommendations);
          if (Array.isArray(parsed)) {
            recommendationsText = parsed.join('\n');
          } else {
            recommendationsText = recommendations;
          }
        } catch (e) {
          // If it fails to parse, it's just a regular string
          recommendationsText = recommendations;
        }
      } else {
        // Fallback for any other type
        recommendationsText = String(recommendations || 'No specific recommendations');
      }
      
      // We'll skip adding references text to avoid duplication with the UI component
      const referencesText = '';

      // Format the AI response with patient name if available
      const aiResponse = patientName 
        ? `${responsePrefix}here is my assessment:\n\n**Urgency Level: ${response.urgency_level}**\n${response.urgency_description}\n\n**Why I'm saying this:**\n${response.reasoning}\n\n**What you should do:**\n${recommendationsText}${referencesText}\n\n**Remember:**\n${response.disclaimer}`
        : `**Urgency Level: ${response.urgency_level}**\n${response.urgency_description}\n\n**Reasoning:**\n${response.reasoning}\n\n**Recommendations:**\n${recommendationsText}${referencesText}\n\n**Disclaimer:**\n${response.disclaimer}`;
        
      // DEBUG: Log the message object being created (after aiResponse is defined)
      console.log('AI Response:', aiResponse);
      const messageObj = { 
        text: aiResponse, 
        isUser: false,
        pubmedReferences: pubmedReferences,
        clinicalTrials: clinicalTrials,
        dos: dos,
        donts: donts
      };
      console.log('ChatMessage props being passed:', messageObj);

      // Add the AI's response with PubMed references, clinical trials, do's and don'ts
      setMessages((prev) => [...prev, { 
        text: aiResponse, 
        isUser: false,
        pubmedReferences: pubmedReferences,
        clinicalTrials: clinicalTrials,
        dos: dos,
        donts: donts
      }]);
      
      toast({
        title: "Response generated",
        description: "AI has provided healthcare information",
      });
    } catch (error) {
      // Remove the loading message
      setMessages((prev) => prev.filter(msg => !msg.isLoading));
      
      // Get more specific error message if possible
      let errorMessage = "I'm sorry, I encountered an error processing your request.";
      
      if (error && typeof error === 'object') {
        // Check for Axios error format
        if ('response' in error && error.response && 'data' in error.response) {
          const responseData = error.response.data;
          if (responseData && 'error' in responseData && typeof responseData.error === 'string') {
            errorMessage = `${errorMessage} Error details: ${responseData.error}`;
          }
        } else if ('message' in error && typeof error.message === 'string') {
          errorMessage = `${errorMessage} Error details: ${error.message}`;
        }
      }
      
      // Add more suggestions to help the user
      errorMessage += "\n\nYou can try:\n- Refreshing the page\n- Checking your internet connection\n- Contacting technical support if the issue persists";
      
      // Add error message
      setMessages((prev) => [...prev, { 
        text: errorMessage, 
        isUser: false 
      }]);
      
      toast({
        title: "Error",
        description: "Failed to get response from AI service",
        variant: "destructive"
      });
      console.error("Error in chat:", error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 font-inter">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6">
          <ChatHeader 
            title="Welcome to Medifox"
            subtitle="Ask me anything—I'm here to help!"
            onNewChat={handleNewChat}
          />
          
          {messages.length > 0 ? (
            <div className="flex-1 overflow-y-auto" ref={chatContainerRef}>
              <div className="px-4 py-5 space-y-4">
                {messages.map((msg, index) => (
                  <ChatMessage 
                    key={index} 
                    message={msg.text} 
                    isUser={msg.isUser}
                    pubmedReferences={msg.pubmedReferences}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px]">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-700 mb-2">Start a conversation</h2>
                <p className="text-gray-500">Ask Medifox about any health concerns you might have</p>
              </div>
            </div>
          )}
          
          {/* Prompt Categories */}
          {messages.length <= 1 && (
            <div className="mt-12">
              <h3 className="text-xl font-bold mb-4 font-inter">Explore by ready prompt</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <PromptCategory 
                  icon={
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 19L19 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  }
                  title="Symptom Analysis"
                  description="Describe your symptoms and get insights on potential causes and next steps."
                />
                <PromptCategory 
                  icon={
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  }
                  title="Medication Information"
                  description="Learn about medications, potential side effects, and drug interactions."
                />
                <PromptCategory 
                  icon={
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 7L12 3L4 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M20 12L12 16L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M20 17L12 21L4 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  }
                  title="Health Tips"
                  description="Get advice on preventive care, nutrition, and maintaining a healthy lifestyle."
                />
                <PromptCategory 
                  icon={
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18 8H19C20.1046 8 21 8.89543 21 10V20C21 21.1046 20.1046 22 19 22H5C3.89543 22 3 21.1046 3 20V10C3 8.89543 3.89543 8 5 8H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M15 5L12 2L9 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 2V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  }
                  title="Medical Conditions"
                  description="Explore information about various medical conditions, symptoms, and treatments."
                />
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t">
          <ChatInput onSendMessage={handleSendMessage} />
        </div>
      </main>
    </div>
  );
};

export default Index;
