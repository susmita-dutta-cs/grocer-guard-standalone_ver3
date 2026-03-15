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
  "Fruits & Vegetables": "/assets/icons/apples.png", // Generic fruit fallback
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

export const useProductImage = () => {
  const getProductImage = (product: Product): string => {
    const nameLower = product.name.toLowerCase();
    
    // 1. Try exact name mapping
    for (const [key, path] of Object.entries(IMAGE_MAP)) {
      if (nameLower.includes(key)) {
        return path;
      }
    }

    // 2. Try category mapping
    if (CATEGORY_MAP[product.category]) {
      // Special logic for Dairy & Eggs
      if (product.category === "Dairy & Eggs" && nameLower.includes("milk")) {
        return "/assets/icons/milk.png";
      }
      return CATEGORY_MAP[product.category];
    }

    // 3. Fallback to the emoji stored in the data
    return product.image;
  };

  const isEmoji = (source: string): boolean => {
    return !source.startsWith("/") && !source.startsWith("http");
  };

  return { getProductImage, isEmoji };
};
