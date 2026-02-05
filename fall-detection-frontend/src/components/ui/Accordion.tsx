import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
}

export const AccordionItem: React.FC<AccordionItemProps> = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-border last:border-0">
      <button
        className="flex justify-between items-center w-full py-4 text-left focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="text-lg font-medium text-text-main pr-4">{title}</span>
        {isOpen ? <ChevronUp className="text-primary flex-shrink-0" /> : <ChevronDown className="text-text-muted flex-shrink-0" />}
      </button>
      {isOpen && (
        <div className="pb-6 text-text-muted text-base leading-relaxed animate-in fade-in slide-in-from-top-2 duration-200">
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
    <div className="w-full max-w-3xl mx-auto bg-white rounded-lg p-2">
      {children}
    </div>
  );
};

export default Accordion;