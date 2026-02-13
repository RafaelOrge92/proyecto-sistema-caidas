import React from 'react';
import { useTheme } from '../../context/ThemeContext';

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
  const { theme } = useTheme();
  
  const baseStyles = "inline-flex items-center justify-center transition-all duration-300 font-bold rounded-lg disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 hover-lift shadow-lg";
  
  const variants = {
    primary: theme === 'light' 
      ? "bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white hover:from-[#818CF8] hover:to-[#A78BFA] focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:ring-offset-2 focus:ring-offset-bg-primary glow-primary"
      : "bg-white text-black hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:ring-offset-2 focus:ring-offset-bg-primary",
    secondary: "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] glow-primary",
    outline: "border border-white/20 text-white bg-transparent hover:bg-white/5",
    ghost: "text-[var(--color-text-secondary)] hover:text-white hover:bg-white/5",
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20"
  };

  const sizes = {
    sm: "px-4 py-1.5 text-xs tracking-wide",
    md: "px-6 py-2.5 text-sm tracking-tight",
    lg: "px-8 py-4 text-lg tracking-tighter"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? "w-full" : ""} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;