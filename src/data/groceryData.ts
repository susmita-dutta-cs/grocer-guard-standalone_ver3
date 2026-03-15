export type Store = {
  id: string;
  name: string;
  colorClass: string;
};

export type ProductPrice = {
  storeId: string;
  price: number;
  onSale?: boolean;
  promo_details?: {
    discount_type?: string | null;
    valid_until?: string | null;
    original_product_name?: string | null;
  };
};

export type Product = {
  id: string;
  name: string;
  name_nl?: string;
  name_fr?: string;
  brand?: string;
  category: string;
  unit: string;
  image: string;
  prices: ProductPrice[];
};

export const stores: Store[] = [
  { id: "aldi", name: "Aldi", colorClass: "bg-store-1" },
  { id: "albert-heijn", name: "Albert Heijn", colorClass: "bg-store-2" },
  { id: "carrefour", name: "Carrefour", colorClass: "bg-store-3" },
  { id: "colruyt", name: "Colruyt", colorClass: "bg-store-4" },
  { id: "jumbo", name: "Jumbo", colorClass: "bg-store-5" },
  { id: "lidl", name: "Lidl", colorClass: "bg-store-6" },
  { id: "delhaize", name: "Delhaize", colorClass: "bg-store-7" },
];

export const categories = [
  "All",
  "Fruits & Vegetables",
  "Dairy & Eggs",
  "Meat & Seafood",
  "Bakery",
  "Pantry",
  "Beverages",
  "Snacks",
  "Frozen",
  "Household",
  "Personal Care",
];

export function getLowestPrice(product: Product): ProductPrice {
  return product.prices.reduce((min, p) => (p.price < min.price ? p : min), product.prices[0]);
}

export function getHighestPrice(product: Product): ProductPrice {
  return product.prices.reduce((max, p) => (p.price > max.price ? p : max), product.prices[0]);
}

export function getSavingsPercent(product: Product): number {
  if (product.prices.length < 2) return 0;
  const low = getLowestPrice(product).price;
  const high = getHighestPrice(product).price;
  return Math.round(((high - low) / high) * 100);
}
