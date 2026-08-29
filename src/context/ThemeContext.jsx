import React, { createContext, useState, useContext, useRef, useCallback } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [customBg, setCustomBg] = useState(() => localStorage.getItem('customBg') || null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animPhase, setAnimPhase] = useState('idle'); // 'idle' | 'vortex' | 'expand'
  const timerRef = useRef(null);

  const updateCustomBg = (url) => {
    if (url) {
      setCustomBg(url);
      localStorage.setItem('customBg', url);
    } else {
      setCustomBg(null);
      localStorage.removeItem('customBg');
    }
  };

  const toggleTheme = useCallback(() => {
    if (isAnimating) return;
    const next = theme === 'dark' ? 'light' : 'dark';
    setIsAnimating(true);
    setAnimPhase('vortex');

    // After 1.5s vortex spin, apply theme and expand
    timerRef.current = setTimeout(() => {
      setTheme(next);
      localStorage.setItem('theme', next);
      document.documentElement.setAttribute('data-theme', next);
      setAnimPhase('expand');

      // After 0.5s expand burst, done
      timerRef.current = setTimeout(() => {
        setIsAnimating(false);
        setAnimPhase('idle');
      }, 600);
    }, 1500);
  }, [theme, isAnimating]);

  // Apply saved theme on mount
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isAnimating, animPhase, customBg, updateCustomBg }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
