import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

type Theme = 'light' | 'dark';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Check localStorage first for immediate application
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('fluency_theme');
      if (saved === 'dark' || saved === 'light') {
        return saved;
      }
      // Check system preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    return 'light';
  });

  // Apply theme to document on mount and changes
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('fluency_theme', theme);
  }, [theme]);

  // Load theme from database when user is authenticated
  const loadThemeFromDB = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('theme')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('[useTheme] Error loading theme:', error);
        return;
      }

      if (data?.theme) {
        const dbTheme = data.theme as Theme;
        setThemeState(dbTheme);
        localStorage.setItem('fluency_theme', dbTheme);
      }
    } catch (err) {
      console.error('[useTheme] Error:', err);
    }
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  return {
    theme,
    setTheme,
    toggleTheme,
    loadThemeFromDB,
    isDark: theme === 'dark',
  };
}

// Initialize theme immediately on script load (before React renders)
export function initializeTheme() {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('fluency_theme');
    if (saved === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (saved === 'light') {
      document.documentElement.classList.remove('dark');
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
    }
  }
}
