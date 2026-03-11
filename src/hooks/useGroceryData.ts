import { useState, useEffect } from "react";
import { Product, Store, stores as staticStores } from "../data/groceryData";

export function useGroceryData() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/data/promotions.json");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        
        // Transform individual promotions into grouped Product objects if names match
        // Or for now, treat each promotion as a separate product to match the scraper's intent
        const transformed: Product[] = data.promotions.map((p: any, idx: number) => ({
          id: `promo-${idx}`,
          name: p.product_name,
          name_nl: p.product_name,
          brand: p.brand || undefined,
          category: p.category || "Other",
          unit: p.quantity || "per unit",
          image: getCategoryEmoji(p.category),
          prices: [{
            storeId: p.store,
            price: p.promo_price || 0,
            onSale: true
          }]
        }));

        setProducts(transformed);
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
