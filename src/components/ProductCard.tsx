import { Product, stores, getLowestPrice, getSavingsPercent } from "../data/groceryData";
import { TrendingDown, Heart } from "lucide-react";
import { useI18n } from "../hooks/useI18n";
import { useProductName } from "../hooks/useProductName";

interface ProductCardProps {
  product: Product;
  index: number;
  onView?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

const ProductCard = ({ product, index, onView, isFavorite, onToggleFavorite }: ProductCardProps) => {
  const { t } = useI18n();
  const { getProductName } = useProductName();
  const translatedName = getProductName(product);
  const translatedUnit = t(`unit.${product.unit}`) !== `unit.${product.unit}` ? t(`unit.${product.unit}`) : product.unit;
  const lowest = getLowestPrice(product);
  const savings = getSavingsPercent(product);
  const lowestStore = stores.find((s) => s.id === lowest.storeId);

  return (
    <div
      onClick={onView}
      className="bg-card rounded-2xl border border-border p-4 shadow-sm hover:border-primary/30 transition-all animate-fade-in-up cursor-pointer active:scale-[0.98]"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center text-2xl shrink-0">
          {product.image}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-sm text-card-foreground leading-tight truncate">
            {translatedName}
          </h3>
          {product.brand && (
            <p className="text-[10px] text-primary/70 font-medium mt-0.5">{product.brand}</p>
          )}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-display font-bold text-primary">
              €{lowest.price.toFixed(2)}
            </span>
            <span className="text-[10px] text-muted-foreground">
              at {lowestStore?.name}
            </span>
            <span className="text-[10px] text-muted-foreground ml-auto">
              {translatedUnit}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <div className="flex items-center gap-1">
            {onToggleFavorite && (
              <button
                onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <Heart
                  className={`h-4 w-4 transition-colors ${isFavorite ? "fill-primary text-primary" : "text-muted-foreground"}`}
                />
              </button>
            )}
          </div>
          {savings > 10 && (
            <span className="flex items-center gap-0.5 bg-primary/15 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
              <TrendingDown className="h-3 w-3" />
              {savings}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
