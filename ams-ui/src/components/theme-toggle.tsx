'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-bg-surface border border-bg-border shadow-card backdrop-blur-md transition-all hover:scale-105 hover:bg-bg-hover active:scale-95"
      aria-label="Toggle theme"
    >
      <div className="relative flex h-full w-full items-center justify-center text-txt-primary">
        <Sun className="absolute h-[1.2rem] w-[1.2rem] transition-all duration-300 dark:-rotate-90 dark:scale-0 dark:opacity-0" />
        <Moon className="absolute h-[1.2rem] w-[1.2rem] transition-all duration-300 rotate-90 scale-0 opacity-0 dark:rotate-0 dark:scale-100 dark:opacity-100" />
      </div>
    </button>
  );
}
