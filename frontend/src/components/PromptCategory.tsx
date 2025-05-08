
import React from 'react';

interface PromptCategoryProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const PromptCategory: React.FC<PromptCategoryProps> = ({ icon, title, description }) => {
  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
      <div className="mb-3 text-[#FF7F2E]">{icon}</div>
      <h3 className="font-semibold text-gray-800 mb-2 font-inter">{title}</h3>
      <p className="text-sm text-gray-500 font-inter">{description}</p>
    </div>
  );
};

export default PromptCategory;
