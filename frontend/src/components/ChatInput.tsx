
import { useState, useEffect } from 'react';
import { Send, Users, User } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PatientProfile {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
}

interface ChatInputProps {
  onSendMessage: (message: string) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage
}) => {
  const [message, setMessage] = useState('');
  const [profiles, setProfiles] = useState<PatientProfile[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const maxChars = 10000;
  
  // Fetch patient profiles
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/profiles');
        if (!response.ok) {
          throw new Error('Failed to fetch profiles');
        }
        const data = await response.json();
        setProfiles(data);
      } catch (error) {
        console.error('Error fetching profiles:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfiles();
  }, []);
  
  const handleSendMessage = () => {
    if (message.trim()) {
      let finalMessage = message;
      
      // Attach patient context if selected (and not 'none' or 'loading')
      if (selectedPatient && selectedPatient !== 'none' && selectedPatient !== 'loading') {
        const profile = profiles.find(p => p.id.toString() === selectedPatient);
        if (profile) {
          finalMessage = `[Speaking as patient: ${profile.full_name}] ${message}`;
        }
      }
      
      onSendMessage(finalMessage);
      setMessage('');
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  return <div className="border rounded-lg p-2 bg-white shadow-sm relative">
      <div className="relative">
        <textarea 
          className="w-full px-3 py-3 text-sm resize-none font-inter min-h-[100px] max-h-[200px] placeholder-gray-400 outline-none focus:outline-none border-none focus:ring-0" 
          placeholder="Whatever you need, just ask MediAI!" 
          value={message} 
          onChange={e => setMessage(e.target.value)} 
          onKeyDown={handleKeyPress} 
          maxLength={maxChars} 
        />
        
        <div className="absolute bottom-2 right-2 text-xs text-gray-400">
          {message.length}/{maxChars}
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-2 px-2">
        <div className="flex items-center space-x-2">
          {/* Patient Selector Dropdown */}
          <div className="relative min-w-[200px]">
            <Select
              value={selectedPatient}
              onValueChange={setSelectedPatient}
            >
              <SelectTrigger className="h-9 border-0 bg-gray-100 text-sm">
                <div className="flex items-center">
                  {selectedPatient ? <User className="h-4 w-4 mr-2" /> : <Users className="h-4 w-4 mr-2" />}
                  <SelectValue placeholder="Select patient persona" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Speak as yourself</SelectItem>
                {isLoading ? (
                  <SelectItem value="loading" disabled>Loading profiles...</SelectItem>
                ) : (
                  profiles.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id.toString()}>
                      {profile.full_name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <button 
          onClick={handleSendMessage} 
          disabled={!message.trim()} 
          className={`${message.trim() ? 'bg-[#ff7f2e] text-white hover:bg-[#e67129]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'} p-2 rounded-md transition-colors`}
        >
          <Send size={18} />
        </button>
      </div>
    </div>;
};

export default ChatInput;
