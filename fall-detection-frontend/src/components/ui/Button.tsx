import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  fullWidth = false, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center border font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1A1F26] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover-lift";
  
  const variants = {
    primary: "border-transparent text-white bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:from-[#818CF8] hover:to-[#A78BFA] focus:ring-[#6366F1] shadow-lg glow-primary",
    secondary: "border-transparent text-white bg-gradient-to-r from-[#06B6D4] to-[#14B8A6] hover:from-[#22D3EE] hover:to-[#2DD4BF] focus:ring-[#06B6D4] shadow-lg glow-accent",
    outline: "border-[#6366F1] text-[#6366F1] bg-transparent hover:bg-[#6366F1]/10 focus:ring-[#6366F1]",
    ghost: "border-transparent text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#252B35] focus:ring-[#6366F1]",
    danger: "border-transparent text-white bg-[#EF4444] hover:bg-[#DC2626] focus:ring-[#EF4444] shadow-lg glow-error"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg"
  };

  const widthStyles = fullWidth ? "w-full" : "";

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthStyles} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;