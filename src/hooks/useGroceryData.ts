import { useState, useEffect } from "react";
import { Product, stores as staticStores, getSavingsPercent } from "../data/groceryData";

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
    getStats: () => {
      if (products.length === 0) return { total: 0, avgSavings: 0, totalPotentialSavings: 0 };
      const total = products.length;
      const savings = products.map(p => getSavingsPercent(p));
      const avgSavings = Math.round(savings.reduce((a, b) => a + b, 0) / total);
      
      // Calculate total potential savings (diff between high and low for a typical "basket")
      const totalPotentialSavings = products.reduce((acc, p) => {
        const prices = p.prices.map(pr => pr.price);
        const diff = Math.max(...prices) - Math.min(...prices);
        return acc + diff;
      }, 0);

      return { total, avgSavings, totalPotentialSavings };
    }
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
