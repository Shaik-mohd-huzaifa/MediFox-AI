
import React, { useState } from 'react';
import { ExternalLink, BookOpen, AlarmClock, AlertCircle, ThumbsUp, Stethoscope, Heart, Info } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface PubMedReference {
  pmid: string;
  title: string;
  abstract?: string;
  date?: string;
}

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  pubmedReferences?: PubMedReference[];
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isUser, pubmedReferences = [] }) => {
  const [expandedReference, setExpandedReference] = useState<string | null>(null);
  
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
