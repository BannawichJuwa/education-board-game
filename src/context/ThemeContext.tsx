import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'auto' | 'day' | 'night';
export type EffectiveTheme = 'day' | 'night';

interface ThemeContextValue {
  themeMode: ThemeMode;
  effectiveTheme: EffectiveTheme;
  setThemeMode: (mode: ThemeMode) => void;
  cycleTheme: () => void;
  toggleTheme: () => void;
}

const STORAGE_KEY = 'eduboard.theme';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getSystemTheme(): EffectiveTheme {
  if (typeof window === 'undefined') return 'day';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'night' : 'day';
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'auto';
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (saved === 'auto' || saved === 'day' || saved === 'night') {
      return saved;
    }
    // Backward compat check
    const legacy = localStorage.getItem('classroom_theme');
    if (legacy === 'night' || legacy === 'day') {
      return legacy;
    }
    return 'auto';
  });

  const [systemTheme, setSystemTheme] = useState<EffectiveTheme>(getSystemTheme);

  // Listen to OS system color scheme changes when in 'auto' mode
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'night' : 'day');
    };
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  const effectiveTheme: EffectiveTheme = themeMode === 'auto' ? systemTheme : themeMode;

  // Sync to HTML element data-theme and localStorage
  useEffect(() => {
    const root = document.documentElement;
    const targetThemeAttr = effectiveTheme === 'night' ? 'dark' : 'light';
    root.setAttribute('data-theme', targetThemeAttr);
    root.setAttribute('data-theme-mode', themeMode);
    localStorage.setItem(STORAGE_KEY, themeMode);
    localStorage.setItem('classroom_theme', effectiveTheme); // backward compat
  }, [effectiveTheme, themeMode]);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
  };

  const cycleTheme = () => {
    setThemeModeState((prev) => {
      if (prev === 'auto') return 'day';
      if (prev === 'day') return 'night';
      return 'auto';
    });
  };

  const toggleTheme = () => {
    setThemeModeState((prev) => {
      const currentEffective = prev === 'auto' ? systemTheme : prev;
      return currentEffective === 'day' ? 'night' : 'day';
    });
  };

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        effectiveTheme,
        setThemeMode,
        cycleTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
