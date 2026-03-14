import { Trash2, ShoppingBasket, TrendingDown, Store, Plus, Search, Tag } from "lucide-react";
import { Product, getLowestPrice, getHighestPrice, stores, categories } from "../data/groceryData";
import { useProductName } from "../hooks/useProductName";
import { SmartBasketResult } from "../hooks/useRecommendations";
import { useMemo, useState } from "react";

interface BasketTabProps {
  items: Product[];
  onRemove: (id: string) => void;
  onAdd: (id: string) => void;
  itemsByStore?: SmartBasketResult[];
  allProducts: Product[];
  search: string;
  setSearch: (s: string) => void;
  category: string;
  setCategory: (c: string) => void;
}

const BasketTab = ({ 
  items, 
  onRemove, 
  onAdd, 
  itemsByStore, 
  allProducts,
  search,
  setSearch,
  category,
  setCategory
}: BasketTabProps) => {
  const { getProductName } = useProductName();

  const totalCost = items.reduce((sum, item) => sum + getLowestPrice(item).price, 0);
  const totalSavings = items.reduce((sum, item) => {
    const low = getLowestPrice(item).price;
    const high = getHighestPrice(item).price;
    return sum + (high - low);
  }, 0);

  const [brand, setBrand] = useState("All Brands");

  // Extract unique brands for the current category
  const availableBrands = useMemo(() => {
    const brands = new Set<string>(["All Brands"]);
    allProducts.forEach(p => {
      if ((category === "All" || p.category === category) && p.brand) {
        brands.add(p.brand);
      }
    });
    return Array.from(brands).sort();
  }, [allProducts, category]);

  // Discoverable products (filtered, but not in basket)
  const discoveryProducts = useMemo(() => {
    if (!search.trim() && category === "All" && brand === "All Brands") return [];
    return allProducts
      .filter(p => !items.some(item => item.id === p.id))
      .filter(p => {
        const localName = getProductName(p);
        const matchesSearch = localName.toLowerCase().includes(search.toLowerCase()) ||
          p.brand?.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = category === "All" || p.category === category;
        const matchesBrand = brand === "All Brands" || p.brand === brand;
        return matchesSearch && matchesCategory && matchesBrand;
      })
      .slice(0, 10);
  }, [allProducts, items, search, category, brand, getProductName]);

  return (
    <div className="space-y-6 animate-fade-in-up pb-10">
      {/* Header & Stats */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <ShoppingBasket className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-white leading-none">Smart Basket</h2>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest font-bold">Price Comparison Active</p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-primary justify-end">
            <TrendingDown className="h-4 w-4" />
            <p className="text-primary font-black">€{totalSavings.toFixed(2)}</p>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">{items.length} items</p>
        </div>
      </div>

      {/* Main Totals Card */}
      <div className="bg-card/40 backdrop-blur-md rounded-3xl border border-white/5 p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />
        <div className="relative space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Est. Lowest Total</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-display font-black text-white">€{totalCost.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Search & Discovery Section */}
      <div className="space-y-4 bg-white/5 rounded-[32px] p-5 border border-white/5">
        <div className="flex items-center gap-2 px-1">
          <Search className="h-4 w-4 text-primary" />
          <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Build Your List</h3>
        </div>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input 
            type="text"
            placeholder="Search to add products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-background/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/30"
          />
        </div>

        {/* Categories Chip Scroller */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => { setCategory(cat); setBrand("All Brands"); }}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                category === cat 
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105" 
                  : "bg-white/5 text-muted-foreground hover:bg-white/10"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Brands Chip Scroller */}
        {availableBrands.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
            {availableBrands.map((b) => (
              <button
                key={b}
                onClick={() => setBrand(b)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-tight transition-all border ${
                  brand === b 
                    ? "bg-white/10 border-primary text-primary" 
                    : "bg-transparent border-white/5 text-muted-foreground/40 hover:text-muted-foreground hover:border-white/10"
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        )}

        {/* Discovery Results */}
        {discoveryProducts.length > 0 && (
          <div className="space-y-2 pt-2 animate-scale-in">
            {discoveryProducts.map((p) => (
              <div 
                key={p.id}
                onClick={() => onAdd(p.id)}
                className="flex items-center gap-3 bg-white/5 rounded-2xl p-2 border border-white/5 active:scale-[0.98] transition-all cursor-pointer hover:bg-white/10"
              >
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl shrink-0">
                  {p.image}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">{getProductName(p)}</p>
                  <p className="text-[9px] text-muted-foreground uppercase">{p.brand || p.category}</p>
                </div>
                <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                  <Plus className="h-4 w-4" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Comparative Pricing */}
      {itemsByStore && itemsByStore.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Store className="h-4 w-4 text-primary" />
            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Store Comparison</h3>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 font-sans">
            {itemsByStore.map((storeResult, i) => (
              <div 
                key={storeResult.storeId}
                className={`min-w-[150px] bg-card/40 backdrop-blur-md rounded-[24px] border p-4 flex flex-col gap-1 transition-all ${
                  i === 0 ? "border-primary/40 shadow-lg shadow-primary/5 ring-1 ring-primary/20" : "border-white/5"
                }`}
              >
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">{storeResult.storeName}</p>
                <div className="flex flex-col">
                  <span className={`text-xl font-display font-black ${i === 0 ? "text-primary" : "text-white"}`}>
                    €{storeResult.totalCost.toFixed(2)}
                  </span>
                  <span className="text-[9px] font-bold text-primary italic">Save €{storeResult.savings.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Basket Items List */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Tag className="h-4 w-4 text-primary" />
          <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Items in Basket</h3>
        </div>
        {items.map((item) => {
          const lowest = getLowestPrice(item);
          return (
            <div
              key={item.id}
              className="group bg-card/30 backdrop-blur-sm rounded-3xl border border-white/5 p-4 flex items-center gap-4 transition-all hover:bg-card/50"
            >
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl shrink-0 group-hover:scale-110 transition-transform shadow-inner">
                {item.image}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-white truncate">{getProductName(item)}</h4>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold opacity-60">{item.brand || item.category} · {item.unit}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs font-black text-primary">€{lowest.price.toFixed(2)}</span>
                  <div className="h-1 w-1 rounded-full bg-white/20" />
                  <span className="text-[9px] text-muted-foreground font-bold">Best: {stores.find(s => s.id === lowest.storeId)?.name}</span>
                </div>
              </div>
              <button
                onClick={() => onRemove(item.id)}
                className="h-10 w-10 rounded-2xl bg-red-500/5 flex items-center justify-center text-red-500/40 hover:bg-red-500 hover:text-white transition-all active:scale-95 border border-red-500/10"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}

        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="h-24 w-24 rounded-full bg-white/5 flex items-center justify-center border border-white/5 animate-pulse">
              <ShoppingBasket className="h-12 w-12 text-muted-foreground/20" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-black text-muted-foreground uppercase tracking-[0.2em]">Basket is empty</p>
              <p className="text-[10px] text-muted-foreground/40 font-medium">Use the search above to start building your list</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BasketTab;
