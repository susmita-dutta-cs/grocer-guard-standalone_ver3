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
  "bread": "/assets/icons/bread.png",
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
  "apple": "/assets/icons/apples.png",
  "zucchini": "/assets/icons/zucchini.png",
  "courgette": "/assets/icons/zucchini.png",
  "milk": "/assets/icons/milk.png",
  "bread": "/assets/icons/bread.png",
  "egg": "/assets/icons/eggs.png",
  "meat": "/assets/icons/meat.png",
  "cheese": "/assets/icons/cheese.png",
  "pantry": "/assets/icons/pantry.png",
  "beverage": "/assets/icons/beverages.png",
  "snack": "/assets/icons/snacks.png",
  "frozen": "/assets/icons/frozen.png",
  "house": "/assets/icons/household.png",
  "care": "/assets/icons/personal_care.png",
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

    // 4. Ultimate fallback to what was in the data (likely emoji)
    return product.image;
  };

  const isEmoji = (source: string): boolean => {
    return !source.startsWith("/") && !isUrl(source);
  };

  return { getProductImage, getFallbackIcon, isEmoji };
};
