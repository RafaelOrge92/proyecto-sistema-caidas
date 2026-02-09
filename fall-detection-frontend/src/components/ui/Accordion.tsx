import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export const AccordionItem: React.FC<{title: string, children: React.ReactNode}> = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-white/5 last:border-0">
      <button
        className="flex justify-between items-center w-full py-6 text-left transition-all group"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={`text-xl font-bold tracking-tight transition-colors ${isOpen ? 'text-white' : 'text-[var(--color-text-secondary)] group-hover:text-white'}`}>
          {title}
        </span>
        <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180 text-white' : 'text-gray-500'}`}>
          <ChevronDown size={24} />
        </div>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 pb-8' : 'max-h-0'}`}>
        <p className="text-lg text-[var(--color-text-secondary)] font-medium leading-relaxed">
          {children}
        </p>
      </div>
    </div>
  );
};

const Accordion: React.FC<{children: React.ReactNode}> = ({ children }) => {
  return (
    <div className="w-full glass-panel p-10 bg-[var(--color-bg-secondary)]/50">
      {children}
    </div>
  );
};

export default Accordion;