import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'dark');

  useEffect(() => {
    localStorage.setItem('asrama_theme', theme);
  }, [theme]);

  const changeTheme = (nextTheme) => {
    document.documentElement.dataset.theme = nextTheme;
    setTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme harus digunakan di dalam ThemeProvider.');
  return context;
}
