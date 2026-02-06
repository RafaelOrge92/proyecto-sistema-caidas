import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
}

export const AccordionItem: React.FC<AccordionItemProps> = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-[#1E293B] last:border-0">
      <button
        className="flex justify-between items-center w-full py-5 px-2 text-left focus:outline-none hover:bg-[#252B35] transition-colors rounded-lg"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="text-lg font-semibold text-[#F1F5F9] pr-4">{title}</span>
        {isOpen ? <ChevronUp className="text-[#6366F1] flex-shrink-0" size={24} /> : <ChevronDown className="text-[#94A3B8] flex-shrink-0" size={24} />}
      </button>
      {isOpen && (
        <div className="pb-6 px-2 text-[#94A3B8] text-base leading-relaxed animate-in fade-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  );
};

interface AccordionProps {
  children: React.ReactNode;
}

const Accordion: React.FC<AccordionProps> = ({ children }) => {
  return (
    <div className="w-full max-w-3xl mx-auto bg-[#1A1F26] rounded-xl p-6 border border-[#1E293B] shadow-lg">
      {children}
    </div>
  );
};

export default Accordion;