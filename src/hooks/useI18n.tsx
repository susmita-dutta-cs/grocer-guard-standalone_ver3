import { createContext, useContext, useState } from "react";

const translations = {
  en: {
    "app.tagline": "Save up to 40% on your weekly groceries",
    "hero.title1": "ShelfSmart",
    "hero.title2": "Track Prices. Catch Deals. Save More.",
    "hero.subtitle": "Compare prices across all Belgian supermarkets in real-time.",
    "search.placeholder": "Search for products...",
    "nav.home": "Home",
    "nav.basket": "Basket",
    "nav.settings": "Settings",
    "unit.each": "each",
    "unit.per kg": "per kg",
    "unit.per liter": "per liter",
  },
  nl: {
    "app.tagline": "Bespaar tot 40% op je wekelijkse boodschappen",
    "hero.title1": "ShelfSmart",
    "hero.title2": "Track Prices. Catch Deals. Save More.",
    "hero.subtitle": "Vergelijk prijzen van alle Belgische supermarkten in real-time.",
    "search.placeholder": "Zoek naar producten...",
    "nav.home": "Home",
    "nav.basket": "Mandje",
    "nav.settings": "Instellingen",
    "unit.each": "per stuk",
    "unit.per kg": "per kg",
    "unit.per liter": "per liter",
  }
};

export const categoryKeyMap: Record<string, string> = {
  "All": "All",
  "Fruits & Vegetables": "Groenten & Fruit",
  "Dairy & Eggs": "Zuivel & Eieren",
};

const I18nContext = createContext({
  t: (key: string) => key,
  language: "en",
  setLanguage: (_lang: string) => {},
});

export const I18nProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguage] = useState("en");
  
  const t = (key: string) => {
    return (translations as any)[language][key] || key;
  };

  return (
    <I18nContext.Provider value={{ t, language, setLanguage }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);
