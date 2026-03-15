import { Product } from "../data/groceryData";

const IMAGE_MAP: Record<string, string> = {
  // Exact name matches (case insensitive)
  "red apples": "/assets/icons/apples.png",
  "green apples": "/assets/icons/apples.png",
  "royal gala apples": "/assets/icons/apples.png",
  "fuji apples": "/assets/icons/apples.png",
  "granny smith apples": "/assets/icons/apples.png",
  "zucchini": "/assets/icons/zucchini.png",
  "courgettes": "/assets/icons/zucchini.png",
  "milk": "/assets/icons/milk.png",
  "vollemelk": "/assets/icons/milk.png",
  "halfvolle melk": "/assets/icons/milk.png",
  "bread": "/assets/icons/bread.png",
  "tijgerbrood": "/assets/icons/bread.png",
  "witbrood": "/assets/icons/bread.png",
  "bruinbrood": "/assets/icons/bread.png",
  "eggs": "/assets/icons/eggs.png",
  "eieren": "/assets/icons/eggs.png",
};

const CATEGORY_MAP: Record<string, string> = {
  "Fruits & Vegetables": "/assets/icons/apples.png",
  "Dairy & Eggs": "/assets/icons/eggs.png",
  "Meat & Seafood": "/assets/icons/meat.png",
  "Bakery": "/assets/icons/bread.png",
  "Pantry": "/assets/icons/pantry.png",
  "Beverages": "/assets/icons/beverages.png",
  "Snacks": "/assets/icons/snacks.png",
  "Frozen": "/assets/icons/frozen.png",
  "Household": "/assets/icons/household.png",
  "Personal Care": "/assets/icons/personal_care.png",
};

// Map of specific keywords to their best-fit premium icon
const FALLBACK_ICON_MAP: Record<string, string> = {
  "zucchini": "/assets/icons/zucchini.png",
  "courgette": "/assets/icons/zucchini.png",
  "milk": "/assets/icons/milk.png",
  "melk": "/assets/icons/milk.png",
  "lait": "/assets/icons/milk.png",
  "bread": "/assets/icons/bread.png",
  "brood": "/assets/icons/bread.png",
  "pain": "/assets/icons/bread.png",
  "egg": "/assets/icons/eggs.png",
  "ei": "/assets/icons/eggs.png",
  "oeuf": "/assets/icons/eggs.png",
  "meat": "/assets/icons/meat.png",
  "vlees": "/assets/icons/meat.png",
  "viande": "/assets/icons/meat.png",
  "cheese": "/assets/icons/eggs.png", // Fallback to eggs/dairy icon
  "kaas": "/assets/icons/eggs.png",
  "fromage": "/assets/icons/eggs.png",
  "pantry": "/assets/icons/pantry.png",
  "beverage": "/assets/icons/beverages.png",
  "snack": "/assets/icons/snacks.png",
  "frozen": "/assets/icons/frozen.png",
  "house": "/assets/icons/household.png",
  "care": "/assets/icons/personal_care.png",
  "kip": "/assets/icons/meat.png",
  "poulet": "/assets/icons/meat.png",
  "chicken": "/assets/icons/meat.png",
  "steak": "/assets/icons/meat.png",
  "varkens": "/assets/icons/meat.png",
  "porc": "/assets/icons/meat.png",
  "vis": "/assets/icons/meat.png",
  "poisson": "/assets/icons/meat.png",
  "fish": "/assets/icons/meat.png",
  "boter": "/assets/icons/milk.png",
  "beurre": "/assets/icons/milk.png",
  "butter": "/assets/icons/milk.png",
  "yoghurt": "/assets/icons/milk.png",
  "apple": "/assets/icons/apples.png",
  "appel": "/assets/icons/apples.png",
  "pomme": "/assets/icons/apples.png",
  "banana": "/assets/icons/apples.png", 
  "banaan": "/assets/icons/apples.png",
  "banane": "/assets/icons/apples.png",
  "carrot": "/assets/icons/zucchini.png",
  "wortel": "/assets/icons/zucchini.png",
  "carotte": "/assets/icons/zucchini.png",
  "bière": "/assets/icons/beverages.png",
  "beer": "/assets/icons/beverages.png",
  "bier": "/assets/icons/beverages.png",
  "wine": "/assets/icons/beverages.png",
  "wijn": "/assets/icons/beverages.png",
  "vin": "/assets/icons/beverages.png",
  "water": "/assets/icons/beverages.png",
  "sap": "/assets/icons/beverages.png",
  "juice": "/assets/icons/beverages.png",
  "jus": "/assets/icons/beverages.png",
};

export const useProductImage = () => {
  const isUrl = (source: string): boolean => {
    return source.startsWith("http") || source.startsWith("blob");
  };

  const getProductImage = (product: Product): string => {
    // 1. If scanned/scraped image exists
    if (isUrl(product.image)) {
      return product.image;
    }

    return getFallbackIcon(product);
  };

  const getFallbackIcon = (product: Product): string => {
    const nameLower = product.name.toLowerCase();
    
    // 1. Try exact name mapping from IMAGE_MAP first
    for (const [key, path] of Object.entries(IMAGE_MAP)) {
      if (nameLower.includes(key)) {
        return path;
      }
    }

    // 2. Try specific keyword mapping
    for (const [key, path] of Object.entries(FALLBACK_ICON_MAP)) {
      if (nameLower.includes(key)) {
        return path;
      }
    }

    // 3. Category fallback
    if (CATEGORY_MAP[product.category]) {
      return CATEGORY_MAP[product.category];
    }

    // 4. Ultimate fallback to a generic pantry icon
    return CATEGORY_MAP["Pantry"];
  };

  const isEmoji = (source: string): boolean => {
    return !source.startsWith("/") && !isUrl(source);
  };

  return { getProductImage, getFallbackIcon, isEmoji };
};
