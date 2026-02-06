import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'default',
  className = '' 
}) => {
  const variants = {
    default: 'bg-[#6366F1]/10 text-[#6366F1] border-[#6366F1]/20',
    success: 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20',
    warning: 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20',
    error: 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20',
    info: 'bg-[#06B6D4]/10 text-[#06B6D4] border-[#06B6D4]/20'
  };

  return (
    <span 
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;