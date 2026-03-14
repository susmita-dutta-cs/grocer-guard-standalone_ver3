import { createContext, useContext, useState, useMemo } from "react";

const translations = {
  en: {
    "app.tagline": "Save up to 40% on your weekly groceries",
    "hero.title1": "Track Prices.",
    "hero.title2": "Catch Deals.",
    "hero.subtitle": "Save More.",
    "search.placeholder": "Search for products...",
    "nav.home": "Home",
    "nav.favorites": "Favorites",
    "nav.basket": "Basket",
    "nav.settings": "Settings",
    "nav.admin": "Admin",
    "rec.bestValue": "Best Value Picks",
    "rec.deals": "Deals & Trending",
    "rec.personalized": "Specially for You",
    "unit.each": "per piece",
    "unit.per liter": "per liter",
  },
  nl: {
    "app.tagline": "Bespaar tot 40% op je wekelijkse boodschappen",
    "hero.title1": "Track Prices.",
    "hero.title2": "Catch Deals.",
    "hero.subtitle": "Save More.",
    "search.placeholder": "Zoek naar producten...",
    "nav.home": "Home",
    "nav.favorites": "Favorieten",
    "nav.basket": "Mandje",
    "nav.settings": "Instellingen",
    "nav.admin": "Beheer",
    "rec.bestValue": "Beste Koopjes",
    "rec.deals": "Deals & Trending",
    "rec.personalized": "Speciaal voor Jou",
    "unit.each": "per stuk",
    "unit.per liter": "per liter",
  },
  fr: {
    "app.tagline": "Économisez jusqu'à 40 % sur vos courses hebdomadaires",
    "hero.title1": "Suivez les Prix.",
    "hero.title2": "Saisissez les Offres.",
    "hero.subtitle": "Économisez Plus.",
    "search.placeholder": "Rechercher des produits...",
    "nav.home": "Accueil",
    "nav.favorites": "Favoris",
    "nav.basket": "Panier",
    "nav.settings": "Paramètres",
    "nav.admin": "Admin",
    "rec.bestValue": "Meilleures Affaires",
    "rec.deals": "Offres & Tendances",
    "rec.personalized": "Spécialement pour Vous",
    "unit.each": "par pièce",
    "unit.per liter": "par litre",
  }
};

export const categoryKeyMap: Record<string, string> = {
  "All": "Tout",
  "Fruits & Vegetables": "Fruits & Légumes",
  "Dairy & Eggs": "Œufs & Produits Laitiers",
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
