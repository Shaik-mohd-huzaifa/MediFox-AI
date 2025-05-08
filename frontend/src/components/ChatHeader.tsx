
import React from 'react';
import { Plus, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';

interface ChatHeaderProps {
  title: string;
  subtitle: string;
  onNewChat: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  title,
  subtitle,
  onNewChat
}) => {
  return <div className="flex justify-between items-start mb-8">
      <div>
        <h2 className="text-lg text-gray-700 font-inter">{title}</h2>
        <h1 className="font-inter text-[#ff7f2e] font-bold text-3xl">{subtitle}</h1>
      </div>
      <Button
        className="bg-[#ff7f2e] hover:bg-[#e67129] text-white flex items-center gap-2"
        onClick={onNewChat}
      >
        <Plus size={18} />
        New Chat
        <ArrowRight size={16} className="text-white" />
      </Button>
    </div>;
};

export default ChatHeader;
