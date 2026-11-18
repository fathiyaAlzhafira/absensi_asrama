import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

function getStoredAuthUser() {
  try {
    const raw = localStorage.getItem('asrama_auth_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getThemeStorageKey(user) {
  if (user?.id) return `asrama_theme_user_${user.id}`;
  if (user?.email) return `asrama_theme_user_${user.email}`;
  if (user?.role && user.role !== 'guest') return `asrama_theme_role_${user.role}`;
  return 'asrama_theme_guest';
}

export function resolveThemeForUser(user) {
  // Bersihkan key global lama agar pengaturan tema satu akun tidak bocor ke akun lain
  localStorage.removeItem('asrama_theme');
  const key = getThemeStorageKey(user);
  const saved = localStorage.getItem(key);
  if (saved === 'light' || saved === 'dark') {
    return saved;
  }
  return 'light';
}

export function ThemeProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => getStoredAuthUser());
  const [theme, setTheme] = useState(() => {
    const initial = resolveThemeForUser(getStoredAuthUser());
    document.documentElement.dataset.theme = initial;
    return initial;
  });

  useEffect(() => {
    const handleAuthChange = (event) => {
      const nextUser = event.detail ?? getStoredAuthUser();
      setCurrentUser(nextUser);
      const userTheme = resolveThemeForUser(nextUser);
      document.documentElement.dataset.theme = userTheme;
      setTheme(userTheme);
    };

    window.addEventListener('asrama-auth-changed', handleAuthChange);
    return () => window.removeEventListener('asrama-auth-changed', handleAuthChange);
  }, []);

  const changeTheme = (nextTheme) => {
    const activeUser = currentUser ?? getStoredAuthUser();
    const key = getThemeStorageKey(activeUser);
    localStorage.setItem(key, nextTheme);
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
