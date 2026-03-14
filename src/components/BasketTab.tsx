import { ShoppingBasket, Trash2, TrendingDown } from "lucide-react";
import { Product, getLowestPrice, getSavingsPercent } from "../data/groceryData";
import { useI18n } from "../hooks/useI18n";
import { useProductName } from "../hooks/useProductName";

interface BasketTabProps {
  items: Product[];
  onRemove: (id: string) => void;
}

const BasketTab = ({ items, onRemove }: BasketTabProps) => {
  const { getProductName } = useProductName();

  const totalCost = items.reduce((sum, item) => sum + getLowestPrice(item).price, 0);
  const totalSavings = items.reduce((sum, item) => {
    const low = getLowestPrice(item).price;
    const prices = item.prices.map(p => p.price);
    const high = Math.max(...prices);
    return sum + (high - low);
  }, 0);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
          <ShoppingBasket className="h-8 w-8 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Your Basket is Empty</h3>
          <p className="text-sm text-muted-foreground">Start adding grocery deals to save!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="bg-gradient-to-br from-primary/20 to-card border border-primary/30 rounded-2xl p-5 flex items-center justify-between shadow-lg">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-1">Estimated Total</p>
          <h2 className="text-3xl font-display font-bold text-white">€{totalCost.toFixed(2)}</h2>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-primary justify-end">
            <TrendingDown className="h-4 w-4" />
            <span className="font-bold">Save €{totalSavings.toFixed(2)}</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">{items.length} items in basket</p>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const lowest = getLowestPrice(item);
          const savings = getSavingsPercent(item);
          
          return (
            <div key={item.id} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4 group transition-all hover:border-primary/30">
              <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center text-2xl">
                {item.image}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm text-white truncate">{getProductName(item)}</h4>
                <p className="text-xs text-muted-foreground">€{lowest.price.toFixed(2)} at {lowest.storeId}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                {savings > 5 && (
                  <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                    -{savings}%
                  </span>
                )}
                <button 
                  onClick={() => onRemove(item.id)}
                  className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BasketTab;
