import React, { createContext, useState, useContext, useRef, useCallback } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [customBg, setCustomBg] = useState(() => localStorage.getItem('customBg') || null);
  const [avatarFrame, setAvatarFrame] = useState(() => localStorage.getItem('avatarFrame') || null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animPhase, setAnimPhase] = useState('idle'); // 'idle' | 'vortex' | 'expand'
  const timerRef = useRef(null);

  const updateCustomBg = (url) => {
    setCustomBg(url);
    if (url) {
      localStorage.setItem('customBg', url);
    } else {
      localStorage.removeItem('customBg');
    }
  };

  const updateAvatarFrame = (frameUrl) => {
    setAvatarFrame(frameUrl);
    if (frameUrl) {
      localStorage.setItem('avatarFrame', frameUrl);
    } else {
      localStorage.removeItem('avatarFrame');
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

  const triggerBgAnimation = useCallback(() => {
    setAnimPhase('bg-loading');
  }, []);

  const finishBgAnimation = useCallback(() => {
    setAnimPhase('bg-expand');
    timerRef.current = setTimeout(() => {
      setAnimPhase('idle');
    }, 800);
  }, []);

  const cancelBgAnimation = useCallback(() => {
    setAnimPhase('idle');
  }, []);

  // Apply saved theme on mount
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, []);

  return (
    <ThemeContext.Provider value={{ 
      theme, toggleTheme, 
      isAnimating, animPhase, 
      customBg, updateCustomBg, 
      avatarFrame, updateAvatarFrame,
      triggerBgAnimation, finishBgAnimation, cancelBgAnimation 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
