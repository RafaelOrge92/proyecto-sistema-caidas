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
  const baseStyles = "inline-flex items-center justify-center transition-all duration-300 font-bold rounded-full disabled:opacity-30 disabled:cursor-not-allowed active:scale-95";
  
  const variants = {
    primary: "bg-white text-black hover:bg-gray-200 shadow-xl",
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