import { Trash2, ShoppingBasket, TrendingDown, Store } from "lucide-react";
import { Product, getLowestPrice, getHighestPrice, stores } from "../data/groceryData";
import { useProductName } from "../hooks/useProductName";
import { SmartBasketResult } from "../hooks/useRecommendations";

interface BasketTabProps {
  items: Product[];
  onRemove: (id: string) => void;
  itemsByStore?: SmartBasketResult[];
}

const BasketTab = ({ items, onRemove, itemsByStore }: BasketTabProps) => {
  const { getProductName } = useProductName();

  const totalCost = items.reduce((sum, item) => sum + getLowestPrice(item).price, 0);
  const totalSavings = items.reduce((sum, item) => {
    const low = getLowestPrice(item).price;
    const high = getHighestPrice(item).price;
    return sum + (high - low);
  }, 0);

  return (
    <div className="space-y-6 animate-fade-in-up pb-10">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <ShoppingBasket className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-white leading-none">Your Basket</h2>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest font-bold">Smart Optimization Active</p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-primary justify-end">
            <TrendingDown className="h-4 w-4" />
            <p className="text-primary font-black">€{totalSavings.toFixed(2)}</p>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">{items.length} items in basket</p>
        </div>
      </div>

      <div className="bg-card/40 backdrop-blur-md rounded-3xl border border-white/5 p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />
        <div className="relative space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Est. Lowest Total</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-display font-black text-white">€{totalCost.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {itemsByStore && itemsByStore.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Store className="h-4 w-4 text-primary" />
            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Comparative Pricing</h3>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
            {itemsByStore.map((storeResult) => (
              <div 
                key={storeResult.storeId}
                className="min-w-[140px] bg-card/40 backdrop-blur-md rounded-2xl border border-border/50 p-3 flex flex-col gap-1 shadow-lg"
              >
                <p className="text-[10px] font-black uppercase tracking-tighter text-white truncate">{storeResult.storeName}</p>
                <div className="flex flex-col">
                  <span className="text-base font-display font-black text-white">€{storeResult.totalCost.toFixed(2)}</span>
                  <span className="text-[9px] font-bold text-primary italic">Save €{storeResult.savings.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {items.map((item) => {
          const lowest = getLowestPrice(item);
          return (
            <div
              key={item.id}
              className="group bg-card/30 backdrop-blur-sm rounded-2xl border border-white/5 p-3 flex items-center gap-4 transition-all hover:bg-card/50"
            >
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 transition-transform">
                {item.image}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-white truncate">{getProductName(item)}</h4>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{item.unit}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-black text-primary">€{lowest.price.toFixed(2)}</span>
                  <span className="text-[9px] text-muted-foreground">at {stores.find(s => s.id === lowest.storeId)?.name}</span>
                </div>
              </div>
              <button
                onClick={() => onRemove(item.id)}
                className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-95"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}

        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
            <ShoppingBasket className="h-16 w-16 mb-4 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Your basket is empty</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BasketTab;
