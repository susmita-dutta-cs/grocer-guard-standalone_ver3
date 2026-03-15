import { useState, useEffect, useMemo } from "react";
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

  const productsByCategory = useMemo(() => {
    const map: Record<string, Product[]> = {};
    products.forEach(p => {
      if (!map[p.category]) map[p.category] = [];
      map[p.category].push(p);
    });
    return map;
  }, [products]);

  const stats = useMemo(() => {
    if (products.length === 0) return { total: 0, avgSavings: 0, totalPotentialSavings: 0 };
    
    let totalSavings = 0;
    let totalPotentialSavings = 0;
    const total = products.length;

    for (let i = 0; i < total; i++) {
      const p = products[i];
      totalSavings += getSavingsPercent(p);
      
      const prices = p.prices.map(pr => pr.price);
      totalPotentialSavings += Math.max(...prices) - Math.min(...prices);
    }
    
    const avgSavings = Math.round(totalSavings / total);

    return { total, avgSavings, totalPotentialSavings };
  }, [products]);

  return {
    products,
    productsByCategory,
    setProducts,
    stores: staticStores,
    isLoading,
    stats
  };
}


