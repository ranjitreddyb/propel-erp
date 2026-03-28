'use client';

import { useEffect } from 'react';

export function ThemeInitializer() {
  useEffect(() => {
    // Initialize theme from localStorage on app load
    const storedTheme = localStorage.getItem('app_theme');
    if (storedTheme) {
      document.documentElement.setAttribute('data-theme', storedTheme);
    } else {
      // Default theme
      document.documentElement.setAttribute('data-theme', 'teal-gold');
    }
  }, []);

  return null;
}
