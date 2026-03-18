import React from 'react';
import { useLocation } from 'react-router-dom';
import { useThemeStore } from '../../store/theme.store';

const pageTitles: Record<string, string> = {
  '/': 'Resign IPA',
  '/library': 'App Library',
  '/plans': 'Plans & Upgrade',
  '/certificates': 'Certificates',
  '/account': 'Account',
  '/admin': 'Admin Dashboard',
  '/admin/users': 'Manage Users',
  '/admin/certificates': 'Manage Certificates',
  '/admin/repositories': 'Manage Repositories',
};

export const Header: React.FC = () => {
  const location = useLocation();
  const { theme, toggleTheme } = useThemeStore();
  const title = pageTitles[location.pathname] || 'IPA Resign';

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-100 dark:border-zinc-800 px-4 md:px-6 py-3.5">
      <div className="flex items-center justify-between max-w-5xl mx-auto">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white md:hidden">{title}</h1>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white hidden md:block">{title}</h1>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
};
