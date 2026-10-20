import { Palette, Sun, Moon } from "lucide-react";
import { useTheme } from "../utils/Theme";

const ThemeSettings = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="mx-auto p-6 bg-surface rounded-lg shadow-lg w-full">
      <h2 className="text-xl font-bold text-fg mb-4 flex items-center gap-2">
        <Palette className="text-primary" size={20} />
        Theme Settings
      </h2>

      <div className="space-y-4">
        {/* Light Theme */}
        <div className="flex items-center justify-between p-4 bg-surface-2 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-warning-soft">
              <Sun className="text-warning" size={16} />
            </div>
            <span className="font-medium text-fg">
              Light Theme
            </span>
          </div>
          <button
            onClick={() => toggleTheme("light")}
            className={`w-5 h-5 rounded-full border-2 ${
              theme === "light"
                ? "bg-primary border-primary"
                : "bg-surface-3 border-line-strong"
            }`}
          >
            {theme === "light" && (
              <div className="w-full h-full rounded-full bg-surface transform scale-50" />
            )}
          </button>
        </div>

        {/* Dark Theme */}
        <div className="flex items-center justify-between p-4 bg-surface-2 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-surface-3">
              <Moon className="text-fg-faint" size={16} />
            </div>
            <span className="font-medium text-fg">
              Dark Theme
            </span>
          </div>
          <button
            onClick={() => toggleTheme("dark")}
            className={`w-5 h-5 rounded-full border-2 ${
              theme === "dark"
                ? "bg-primary border-primary"
                : "bg-surface-3 border-line-strong"
            }`}
          >
            {theme === "dark" && (
              <div className="w-full h-full rounded-full bg-surface transform scale-50" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThemeSettings;
