import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
  hover?: boolean;
  glow?: boolean;
}

const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  noPadding = false,
  hover = false,
  glow = false 
}) => {
  return (
    <div 
      className={`
        bg-[#1A1F26] rounded-xl border border-[#1E293B] 
        shadow-lg overflow-hidden
        transition-all duration-300
        ${hover ? 'hover:border-[#6366F1] hover:shadow-xl hover:-translate-y-1' : ''}
        ${glow ? 'glow-primary' : ''}
        ${className}
      `}
    >
      <div className={noPadding ? '' : 'p-6'}>
        {children}
      </div>
    </div>
  );
};

export default Card;