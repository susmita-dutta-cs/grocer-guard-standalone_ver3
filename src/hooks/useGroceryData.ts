import { useState, useEffect } from "react";
import { Product, Store, stores as staticStores } from "../data/groceryData";

export function useGroceryData() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/data/db.json");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setProducts(data.products || []);
      } catch (e) {
        console.error("Error loading grocery data:", e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  return {
    products,
    setProducts,
    stores: staticStores,
    isLoading,
  };
}

function getCategoryEmoji(category: string): string {
  const map: Record<string, string> = {
    "Fruits & Vegetables": "🥦",
    "Dairy & Eggs": "🥛",
    "Meat & Seafood": "🥩",
    "Bakery": "🍞",
    "Pantry": "🥫",
    "Beverages": "🥤",
    "Snacks": "🍿",
    "Frozen": "🧊",
    "Household": "🧽",
    "Personal Care": "🧴",
    "Other": "🛒"
  };
  return map[category] || "🛒";
}
