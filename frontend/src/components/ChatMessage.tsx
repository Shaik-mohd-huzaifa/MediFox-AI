import React, { useState, useEffect, ReactNode } from 'react';
import { ExternalLink, BookOpen, ChevronDown, ChevronUp, AlertCircle, ThumbsUp, Stethoscope, Heart, Info, FileText, Calendar, FileIcon, AlarmClock, Beaker } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { PubMedReference, ClinicalTrial } from '../services/api';



interface ChatMessageProps {
  message: string;
  isUser: boolean;
  pubmedReferences?: PubMedReference[];
  clinicalTrials?: ClinicalTrial[];
  dos?: string[];
  donts?: string[];
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isUser, pubmedReferences = [], clinicalTrials = [], dos = [], donts = [] }) => {
  const [expandedReference, setExpandedReference] = useState<string | null>(null);
  
  // Debug log to verify props
  useEffect(() => {
    if (!isUser) {
      // Add more detailed debugging for PubMed references
      console.log('ChatMessage received pubmedReferences:', pubmedReferences);
      console.log('PubMed references type:', Array.isArray(pubmedReferences) ? 'Array' : typeof pubmedReferences);
      console.log('PubMed references length:', pubmedReferences?.length || 0);
      console.log('PubMed references content:', JSON.stringify(pubmedReferences, null, 2));
      
      if (Array.isArray(pubmedReferences) && pubmedReferences.length > 0) {
        console.log('First PubMed reference:', pubmedReferences[0]);
        console.log('First PubMed reference PMID:', pubmedReferences[0]?.pmid);
        console.log('First PubMed reference title:', pubmedReferences[0]?.title);
      }
      
      console.log('ChatMessage received clinicalTrials:', clinicalTrials);
    }
  }, [pubmedReferences, clinicalTrials, isUser]);
  
  // Replace emoji shortcodes with actual emojis
  const processEmojis = (text: string) => {
    return text
      .replace(/:warning:/g, '⚠️')
      .replace(/:hospital:/g, '🏥')
      .replace(/:ambulance:/g, '🚑')
      .replace(/:thermometer:/g, '🌡️')
      .replace(/:pill:/g, '💊')
      .replace(/:stethoscope:/g, '🩺')
      .replace(/:clock:/g, '⏰')
      .replace(/:heart:/g, '❤️')
      .replace(/:check:/g, '✅')
      .replace(/:x:/g, '❌');
  };
  
  // Function to get icon based on message content
  const getMessageIcon = () => {
    if (isUser) return null;
    
    const lowerMsg = message.toLowerCase();
    
    if (lowerMsg.includes('emergency') || lowerMsg.includes('urgent') || lowerMsg.includes('immediately')) {
      return <AlertCircle className="text-red-500 mr-2" size={16} />;
    } else if (lowerMsg.includes('recommend') || lowerMsg.includes('advice')) {
      return <ThumbsUp className="text-blue-500 mr-2" size={16} />;
    } else if (lowerMsg.includes('symptom') || lowerMsg.includes('condition')) {
      return <Stethoscope className="text-green-500 mr-2" size={16} />;
    } else if (lowerMsg.includes('care') || lowerMsg.includes('health')) {
      return <Heart className="text-pink-500 mr-2" size={16} />;
    } else if (lowerMsg.includes('appointment') || lowerMsg.includes('schedule')) {
      return <AlarmClock className="text-orange-500 mr-2" size={16} />;
    } else {
      return <Info className="text-gray-500 mr-2" size={16} />;
    }
  };
  
  // Toggle reference expansion
  const toggleReference = (pmid: string) => {
    if (expandedReference === pmid) {
      setExpandedReference(null);
    } else {
      setExpandedReference(pmid);
    }
  };
  
  // Process markdown but preserve line breaks
  const processedMessage = processEmojis(message);

  return (
    <div className={`mb-4 ${isUser ? 'text-right' : ''}`}>
      <div
        className={`inline-block max-w-[85%] md:max-w-[75%] lg:max-w-[65%] px-4 py-3 rounded-lg ${
          isUser
            ? 'bg-[#FF7F2E] text-white rounded-br-none'
            : 'bg-gray-100 text-gray-800 rounded-bl-none'
        }`}
      >
        {!isUser && (
          <div className="flex items-center mb-1">
            {getMessageIcon()}
            <span className="text-xs font-semibold text-[#FF7F2E]">Medifox AI</span>
          </div>
        )}
        
        <div className="text-sm whitespace-pre-wrap font-inter">
          <ReactMarkdown components={{
            p: ({node, ...props}) => <p className="mb-2" {...props} />,
            a: ({node, ...props}) => <a className={`underline ${isUser ? 'text-white' : 'text-blue-600'}`} target="_blank" rel="noopener noreferrer" {...props} />,
            h3: ({node, ...props}) => <h3 className="font-bold text-base mt-3 mb-1" {...props} />,
            ul: ({node, ...props}) => <ul className="list-disc pl-5 my-2" {...props} />,
            ol: ({node, ...props}) => <ol className="list-decimal pl-5 my-2" {...props} />,
            li: ({node, ...props}) => <li className="mb-1" {...props} />,
            strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
          }}>
            {processedMessage}
          </ReactMarkdown>
          
          {/* Medical Resources Section - only for bot messages and only when we have resources */}
          {!isUser && (pubmedReferences.length > 0 || clinicalTrials.length > 0) && (
            <div className="mt-3 flex flex-col gap-1">
              <div className="flex items-center text-xs text-gray-600 font-medium mb-1">
                <BookOpen size={14} className="mr-1 text-[#FF7F2E]" />
                <span>Medical Resources:</span>
              </div>
              
              {/* DEBUG: Add counts of resources */}
              <div className="text-xs text-gray-500 mb-1">
                {pubmedReferences.length > 0 && <span>{pubmedReferences.length} PubMed references</span>}
                {pubmedReferences.length > 0 && clinicalTrials.length > 0 && <span> • </span>}
                {clinicalTrials.length > 0 && <span>{clinicalTrials.length} Clinical trials</span>}
              </div>
              
              <div className="flex flex-wrap gap-2">
                {/* PubMed references */}
                {pubmedReferences.length > 0 && pubmedReferences.map((ref) => {
                  if (!ref.pmid) return null;
                  return (
                    <a
                      key={`pmid-${ref.pmid}`}
                      href={`https://pubmed.ncbi.nlm.nih.gov/${ref.pmid}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-800 transition-colors"
                    >
                      <FileText size={12} className="mr-1 text-[#FF7F2E]" />
                      <span>PMID: {ref.pmid}</span>
                    </a>
                  );
                })}
                
                {/* Clinical trials */}
                {clinicalTrials.length > 0 && clinicalTrials.map((trial) => {
                  if (!trial || !trial.nct_id) return null;
                  const trialUrl = trial.url || `https://clinicaltrials.gov/study/${trial.nct_id}`;
                  return (
                    <a
                      key={`trial-${trial.nct_id}`}
                      href={trialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 hover:bg-blue-100 text-blue-800 transition-colors"
                    >
                      <Beaker size={12} className="mr-1 text-blue-600" />
                      <span>Trial: {trial.nct_id}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Do's and Don'ts section - only for bot messages */}
          {!isUser && (dos.length > 0 || donts.length > 0) && (
            <div className="mt-4 mb-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Do's section */}
                {dos.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center text-green-700 font-medium mb-2">
                      <ThumbsUp size={16} className="mr-2" />
                      <h3>Do's</h3>
                    </div>
                    <ul className="space-y-2">
                      {dos.map((item, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="inline-flex items-center justify-center bg-green-100 text-green-800 rounded-full h-5 w-5 min-w-5 text-xs mr-2 mt-0.5">✓</span>
                          <span className="text-sm text-gray-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Don'ts section */}
                {donts.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center text-red-700 font-medium mb-2">
                      <AlertCircle size={16} className="mr-2" />
                      <h3>Don'ts</h3>
                    </div>
                    <ul className="space-y-2">
                      {donts.map((item, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="inline-flex items-center justify-center bg-red-100 text-red-800 rounded-full h-5 w-5 min-w-5 text-xs mr-2 mt-0.5">✗</span>
                          <span className="text-sm text-gray-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* PubMed References section - only for bot messages */}
        {!isUser && pubmedReferences && pubmedReferences.length > 0 && (
          <div className="mt-4 border-t border-gray-300 pt-3">
            <div className="flex items-center text-sm font-medium text-gray-800 mb-2">
              <BookOpen size={16} className="mr-2 text-[#FF7F2E]" />
              <span>Medical References</span>
            </div>
            <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
              <ul className="space-y-3">
                {pubmedReferences.map((ref) => (
                  <li key={ref.pmid} className="text-sm">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <a 
                          href={`https://pubmed.ncbi.nlm.nih.gov/${ref.pmid}/`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 font-medium hover:text-blue-800 hover:underline flex items-center"
                        >
                          <ExternalLink size={14} className="mr-1 flex-shrink-0" />
                          <span>{ref.title}</span>
                        </a>
                        <div className="text-xs text-gray-500 mt-1 flex items-center">
                          <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium mr-2">PMID: {ref.pmid}</span>
                          {ref.date && <span>{ref.date}</span>}
                        </div>
                      </div>
                      <button 
                        onClick={() => toggleReference(ref.pmid)} 
                        className="ml-2 flex-shrink-0 bg-white text-gray-600 hover:text-gray-900 w-6 h-6 rounded-full flex items-center justify-center border border-gray-300 hover:border-gray-400"
                        aria-label={expandedReference === ref.pmid ? "Hide abstract" : "Show abstract"}
                        title={expandedReference === ref.pmid ? "Hide abstract" : "Show abstract"}
                      >
                        {expandedReference === ref.pmid ? '−' : '+'}
                      </button>
                    </div>
                    
                    {expandedReference === ref.pmid && ref.abstract && (
                      <div className="mt-2 p-3 bg-white rounded-md border border-gray-200 text-gray-700 text-sm">
                        <h4 className="font-medium mb-1 text-gray-900">Abstract</h4>
                        <p className="text-xs leading-relaxed">{ref.abstract}</p>
                        <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500 flex items-center">
                          <a 
                            href={`https://pubmed.ncbi.nlm.nih.gov/${ref.pmid}/`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline inline-flex items-center"
                          >
                            View full article on PubMed
                            <ExternalLink size={10} className="ml-1" />
                          </a>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
