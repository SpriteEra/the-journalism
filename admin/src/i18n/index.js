import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { hi } from "./hi";

export const LANGUAGES = [
  { code: "en", label: "English", short: "EN" },
  { code: "hi", label: "हिन्दी", short: "हिं" },
];

const saved = (() => { try { return localStorage.getItem("lang"); } catch { return null; } })();

// The English text is the key; nsSeparator / keySeparator are off so sentences with ":" or "." work as keys.
i18n.use(initReactI18next).init({
  resources: { en: { translation: {} }, hi: { translation: hi } },
  lng: saved === "hi" ? "hi" : "en",
  fallbackLng: "en",
  keySeparator: false,
  nsSeparator: false,
  returnEmptyString: false,
  interpolation: { escapeValue: false },
  saveMissing: false,
});

i18n.on("languageChanged", (lng) => {
  try { localStorage.setItem("lang", lng); } catch { /* private mode */ }
  if (typeof document !== "undefined") document.documentElement.lang = lng;
});
if (typeof document !== "undefined") document.documentElement.lang = i18n.language;

export default i18n;
