import React, { createContext, useContext, useState, useEffect } from 'react';

export type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const applyThemeToDOM = (theme: Theme) => {
  const html = document.documentElement;
  html.classList.remove('light-theme', 'dark-theme');
  html.classList.add(theme === 'light' ? 'light-theme' : 'dark-theme');
  html.setAttribute('data-theme', theme);
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('dark');
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const initialTheme = (savedTheme === 'light' || savedTheme === 'dark') ? savedTheme : 'dark';
    
    setTheme(initialTheme as Theme);
    applyThemeToDOM(initialTheme as Theme);
    setIsInitialized(true);
  }, []);

  // Apply theme when it changes (only after initialization)
  useEffect(() => {
    if (!isInitialized) return;
    
    applyThemeToDOM(theme);
    
    try {
      localStorage.setItem('theme', theme);
    } catch (e) {
      console.error('Error saving theme to localStorage:', e);
    }
  }, [theme, isInitialized]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const value: ThemeContextType = { theme, toggleTheme };
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe usarse dentro de un ThemeProvider');
  }
  return context;
};

