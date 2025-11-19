const STORAGE_KEY = 'theme';
const TOGGLE_SELECTOR = '[data-theme-toggle]';
const DARK_CLASS = 'dark';

type Theme = 'light' | 'dark';

const isBrowser = typeof window !== 'undefined';

const readStoredTheme = (): Theme | null => {
  if (!isBrowser) return null;
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === 'dark' || value === 'light' ? value : null;
  } catch {
    return null;
  }
};

const writeStoredTheme = (theme: Theme) => {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Ignore write failures (storage disabled/private mode).
  }
};

const systemPrefersDark = (): boolean => {
  if (!isBrowser) return false;
  return (
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
};

const getToggleButtons = (): HTMLElement[] =>
  Array.from(document.querySelectorAll<HTMLElement>(TOGGLE_SELECTOR));

const updateToggleStates = (theme: Theme) => {
  const isDark = theme === 'dark';
  getToggleButtons().forEach((button) => {
    button.setAttribute('aria-pressed', String(isDark));
  });
};

const applyThemeClass = (theme: Theme) => {
  if (!isBrowser) return;
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add(DARK_CLASS);
  } else {
    root.classList.remove(DARK_CLASS);
  }
  root.setAttribute('data-color-theme', theme);
  updateToggleStates(theme);
};

const getActiveTheme = (): Theme => {
  if (!isBrowser) return 'light';
  return document.documentElement.classList.contains(DARK_CLASS)
    ? 'dark'
    : 'light';
};

const resolveTheme = (): Theme => {
  const stored = readStoredTheme();
  if (stored) return stored;
  return systemPrefersDark() ? 'dark' : 'light';
};

const ensureThemeApplied = (persistIfMissing = true) => {
  const stored = readStoredTheme();
  const theme = stored ?? resolveTheme();
  applyThemeClass(theme);
  if (!stored && persistIfMissing) {
    writeStoredTheme(theme);
  }
};

const toggleTheme = () => {
  const currentTheme = getActiveTheme();
  const nextTheme: Theme = currentTheme === 'dark' ? 'light' : 'dark';
  applyThemeClass(nextTheme);
  writeStoredTheme(nextTheme);
  
  // Dispatch custom event for other scripts that might need to react
  if (isBrowser) {
    window.dispatchEvent(
      new CustomEvent('themechange', { detail: { theme: nextTheme } })
    );
  }
};

const handleToggleClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (!target) return;
  
  // Check if the click is on the toggle button or any of its children
  // Also check the currentTarget in case React is handling it
  const toggle = target.closest(TOGGLE_SELECTOR) || 
                 (event.currentTarget as HTMLElement)?.closest?.(TOGGLE_SELECTOR);
  if (!toggle) return;
  
  // Don't prevent default if it's already a button - let it work naturally
  if (toggle.tagName !== 'BUTTON') {
    event.preventDefault();
  }
  event.stopPropagation();
  toggleTheme();
};

// Initialize theme manager - only run once
let initialized = false;

const init = () => {
  if (!isBrowser || initialized) return;
  initialized = true;

  // Apply theme immediately
  ensureThemeApplied();

  // Set up click handler with capture phase to catch React events
  window.addEventListener('click', handleToggleClick, true);
  
  // Also listen for custom event from ThemeToggle component
  window.addEventListener('theme-toggle-click', () => {
    toggleTheme();
  });

  // Handle Astro view transitions
  document.addEventListener('astro:before-swap', () => {
    // Before swap, ensure theme is applied
    ensureThemeApplied(false);
  });

  document.addEventListener('astro:after-swap', () => {
    // After swap, re-apply theme and update button states
    ensureThemeApplied(false);
    // Re-attach click handlers to new buttons
    updateToggleStates(getActiveTheme());
  });

  // Listen for system theme changes (only if no stored preference)
  if (window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => {
      // Only update if user hasn't set a preference
      if (!readStoredTheme()) {
        ensureThemeApplied(false);
      }
    };
    mq.addEventListener('change', handleSystemThemeChange);
  }
};

// Initialize immediately if DOM is ready, otherwise wait
if (isBrowser) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    // DOM already ready, initialize immediately
    init();
  }
}

export {};
