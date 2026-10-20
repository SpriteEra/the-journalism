import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

/**
 * Theme = "light" | "dark" | "system". The `dark` class lives on <html> (index.html sets it before first paint),
 * the colour tokens in styles/theme.css switch on it – components never need to know the theme.
 */
const ThemeContext = createContext({ theme: "light", resolved: "light", setTheme: () => {}, toggleTheme: () => {} });
const media = () => window.matchMedia("(prefers-color-scheme: dark)");

const read = () => {
  try { return localStorage.getItem("theme") || "system"; } catch { return "system"; }
};
const resolve = (t) => (t === "system" ? (media().matches ? "dark" : "light") : t);

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(read);
  const [resolved, setResolved] = useState(() => resolve(read()));

  useEffect(() => {
    const apply = () => {
      const r = resolve(theme);
      setResolved(r);
      document.documentElement.classList.toggle("dark", r === "dark");
      document.body.classList.remove("dark", "light");        // legacy: older code toggled the class on <body>
    };
    apply();
    if (theme !== "system") return undefined;
    const mq = media();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [theme]);

  const setTheme = useCallback((t) => {
    try { localStorage.setItem("theme", t); } catch { /* private mode */ }
    setThemeState(t);
  }, []);
  const toggleTheme = useCallback(() => setTheme(resolved === "dark" ? "light" : "dark"), [resolved, setTheme]);

  const value = useMemo(() => ({ theme, resolved, setTheme, toggleTheme }), [theme, resolved, setTheme, toggleTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
