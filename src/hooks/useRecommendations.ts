import { useMemo, useCallback, useState } from "react";
import { Product, stores, getHighestPrice, getSavingsPercent } from "../data/groceryData";
import { useGroceryData } from "./useGroceryData";

// --- Types ---
export type RecommendationReason =
  | "best_value"
  | "smart_basket"
  | "personalized"
  | "deal_trending";

export type Recommendation = {
  product: Product;
  reason: RecommendationReason;
  label: string;
  score: number;
};

export type SmartBasketItem = {
  productId: string;
  productName: string;
  brand?: string;
  image: string;
  price: number;
  available: boolean;
};

export type SmartBasketResult = {
  storeId: string;
  storeName: string;
  totalCost: number;
  itemCount: number;
  savings: number;
  items: SmartBasketItem[];
};

// --- Browsing history (localStorage) ---
const HISTORY_KEY = "shelfsmart_history";
const MAX_HISTORY = 50;

function getViewHistory(): string[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

function addToViewHistory(productId: string) {
  const history = getViewHistory();
  // Avoid duplicates in history
  const filtered = history.filter(id => id !== productId);
  filtered.unshift(productId);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered.slice(0, MAX_HISTORY)));
}

// --- Algorithms ---

function getBestValuePicks(allProducts: Product[], count = 4): Recommendation[] {
  return allProducts
    .map((p) => ({
      product: p,
      reason: "best_value" as const,
      label: `Save ${getSavingsPercent(p)}%`,
      score: getSavingsPercent(p),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
}

function getSmartBasket(allProducts: Product[], selectedIds: string[]): SmartBasketResult[] {
  const selected = allProducts.filter((p) => selectedIds.includes(p.id));
  if (selected.length === 0) return [];

  return stores
    .map((store) => {
      const items: SmartBasketItem[] = selected.map((p) => {
        const storePrice = p.prices.find((pp) => pp.storeId === store.id);
        return {
          productId: p.id,
          productName: p.name,
          brand: p.brand,
          image: p.image,
          price: storePrice?.price ?? 0,
          available: !!storePrice,
        };
      });

      const totalCost = items.reduce((sum, item) => sum + item.price, 0);
      const maxTotal = selected.reduce((sum, p) => sum + getHighestPrice(p).price, 0);

      return {
        storeId: store.id,
        storeName: store.name,
        totalCost: Math.round(totalCost * 100) / 100,
        itemCount: selected.length,
        savings: Math.round((maxTotal - totalCost) * 100) / 100,
        items,
      };
    })
    .sort((a, b) => a.totalCost - b.totalCost);
}

function getDealsAndTrending(allProducts: Product[], count = 4): Recommendation[] {
  const onSaleProducts = allProducts.filter((p) =>
    p.prices.some((pp) => pp.onSale)
  );

  return onSaleProducts
    .map((p) => {
      const salePrice = p.prices.find((pp) => pp.onSale)!;
      const highest = getHighestPrice(p).price;
      const discount = Math.round(((highest - salePrice.price) / highest) * 100);
      const store = stores.find((s) => s.id === salePrice.storeId);
      return {
        product: p,
        reason: "deal_trending" as const,
        label: `${store?.name || "Store"} — €${salePrice.price.toFixed(2)}`,
        score: discount,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
}

function getPersonalized(
  allProducts: Product[],
  productsByCategory: Record<string, Product[]>, 
  viewHistory: string[], 
  count = 4
): Recommendation[] {
  if (viewHistory.length === 0) return [];

  // 1. Get cat frequencies from history (small array)
  const catFreq: Record<string, number> = {};
  viewHistory.slice(0, 10).forEach((id) => {
    const p = allProducts.find((pr) => pr.id === id); // This is still a bit slow if history is long, but we slice it
    if (p) {
      catFreq[p.category] = (catFreq[p.category] || 0) + 1;
    }
  });

  const topCats = Object.entries(catFreq)
    .sort(([, a], [, b]) => b - a)
    .map(([cat]) => cat)
    .slice(0, 3); // Top 3 categories

  const recentSet = new Set(viewHistory.slice(0, 20));
  const recommendations: Recommendation[] = [];

  // 2. Only search within top categories
  topCats.forEach((cat, index) => {
    const catProducts = productsByCategory[cat] || [];
    const bestInCat = catProducts
      .filter(p => !recentSet.has(p.id))
      .map(p => ({
        product: p,
        reason: "personalized" as const,
        label: p.category,
        score: (index + 1) * -1 + getSavingsPercent(p),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.ceil(count / topCats.length));
    
    recommendations.push(...bestInCat);
  });

  return recommendations.sort((a, b) => b.score - a.score).slice(0, count);
}

function getWeeklyDeals(allProducts: Product[], count = 6, storeId?: string): Recommendation[] {
  // Products with explicit promo details from the folder scraper
  const promoProducts = allProducts.filter((p) =>
    p.prices.some((pp) => pp.onSale && pp.promo_details && (!storeId || pp.storeId === storeId))
  );

  return promoProducts
    .map((p) => {
      const bestPromo = p.prices.find((pp) => pp.onSale && pp.promo_details && (!storeId || pp.storeId === storeId))!;
      const store = stores.find((s) => s.id === bestPromo.storeId);
      
      return {
        product: p,
        reason: "deal_trending" as const,
        label: `${p.category} • ${store?.name || "Store"}: ${bestPromo.promo_details?.discount_type || "On Sale"}`,
        score: getSavingsPercent(p) + 50,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
}

// --- Hook ---
export function useRecommendations(promoStoreId?: string) {
  const { products: allProducts, productsByCategory } = useGroceryData();
  const [historyVersion, setHistoryVersion] = useState(0);

  const trackView = useCallback((productId: string) => {
    addToViewHistory(productId);
    setHistoryVersion((v) => v + 1);
  }, []);

  const weeklyDeals = useMemo(() => {
    if (allProducts.length === 0) return [];
    return getWeeklyDeals(allProducts, 6, promoStoreId);
  }, [allProducts, promoStoreId]);

  const bestValue = useMemo(() => {
    if (allProducts.length === 0) return [];
    return getBestValuePicks(allProducts, 4);
  }, [allProducts]);

  const deals = useMemo(() => {
    if (allProducts.length === 0) return [];
    return getDealsAndTrending(allProducts, 4);
  }, [allProducts]);

  const personalized = useMemo(() => {
    if (allProducts.length === 0) return [];
    return getPersonalized(allProducts, productsByCategory, getViewHistory(), 4);
  }, [allProducts, productsByCategory, historyVersion]);

  return {
    weeklyDeals,
    bestValue,
    deals,
    personalized,
    trackView,
    getSmartBasket: useCallback((ids: string[]) => getSmartBasket(allProducts, ids), [allProducts]),
  };
}
