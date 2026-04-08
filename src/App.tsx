import { useEffect, useState } from "react";
import { InteractiveWallCalendar } from "./components/InteractiveWallCalendar";

const THEME_STORAGE_KEY = "wall-calendar-theme";
type ThemeMode = "light" | "dark";

function getInitialTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "light";
  }

  const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (saved === "dark" || saved === "light") {
    return saved;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function App() {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  return (
    <div className="app-shell">
      <InteractiveWallCalendar
        themeToggle={(
          <button
            type="button"
            className="theme-toggle"
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            onClick={() => setTheme((prev) => (prev === "light" ? "dark" : "light"))}
          >
            <span className="theme-toggle-icon" aria-hidden="true">
              {theme === "light" ? (
                <svg viewBox="0 0 24 24" role="presentation" focusable="false">
                  <path d="M21 12.8A9 9 0 1 1 11.2 3a1 1 0 0 1 .9 1.45A7 7 0 0 0 19.55 11a1 1 0 0 1 1.45.9V12.8Z" fill="currentColor" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" role="presentation" focusable="false">
                  <circle cx="12" cy="12" r="4.2" fill="currentColor" />
                  <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <line x1="12" y1="2.5" x2="12" y2="5" />
                    <line x1="12" y1="19" x2="12" y2="21.5" />
                    <line x1="2.5" y1="12" x2="5" y2="12" />
                    <line x1="19" y1="12" x2="21.5" y2="12" />
                    <line x1="5.2" y1="5.2" x2="6.9" y2="6.9" />
                    <line x1="17.1" y1="17.1" x2="18.8" y2="18.8" />
                    <line x1="17.1" y1="6.9" x2="18.8" y2="5.2" />
                    <line x1="5.2" y1="18.8" x2="6.9" y2="17.1" />
                  </g>
                </svg>
              )}
            </span>
          </button>
        )}
      />
    </div>
  );
}

export default App;
