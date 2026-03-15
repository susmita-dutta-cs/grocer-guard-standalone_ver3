import { useState, useEffect } from "react";
import { Product, stores, getLowestPrice, getSavingsPercent } from "../data/groceryData";
import { TrendingDown, Heart, Plus, Check } from "lucide-react";
import { useI18n } from "../hooks/useI18n";
import { useProductName } from "../hooks/useProductName";
import { useProductImage } from "../hooks/useProductImage";

interface ProductCardProps {
  product: Product;
  index: number;
  onView?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  isInBasket?: boolean;
  onAddToBasket?: () => void;
}

const ProductCard = ({ product, index, onView, isFavorite, onToggleFavorite, isInBasket, onAddToBasket }: ProductCardProps) => {
  const { t } = useI18n();
  const { getProductName } = useProductName();
  const { getProductImage, isEmoji } = useProductImage();
  const initialSource = getProductImage(product);
  const [imgSrc, setImgSrc] = useState(initialSource);

  // Update image if product changes
  useEffect(() => {
    setImgSrc(getProductImage(product));
  }, [product, getProductImage]);

  const translatedName = getProductName(product);
  const translatedUnit = t(`unit.${product.unit}`) !== `unit.${product.unit}` ? t(`unit.${product.unit}`) : product.unit;
  const lowest = getLowestPrice(product);
  const savings = getSavingsPercent(product);
  const lowestStore = stores.find((s) => s.id === lowest.storeId);

  return (
    <div
      onClick={onView}
      className={`relative bg-card/30 backdrop-blur-md rounded-[24px] border border-white/5 p-4 transition-all duration-300 active:scale-[0.96] cursor-pointer overflow-hidden group shadow-lg ${
        isFavorite ? "bg-primary/5 ring-1 ring-primary/20" : ""
      }`}
      style={{ animationDelay: `${index * 30}ms` }}
    >
      {/* Ripple background effect for touch */}
      <div className="absolute inset-0 bg-primary/0 group-active:bg-primary/5 transition-colors pointer-events-none" />
      
      <div className="flex items-center gap-4 relative z-10">
        <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center text-3xl shrink-0 group-hover:scale-105 transition-transform duration-500 shadow-inner overflow-hidden">
          {isEmoji(imgSrc) ? (
            imgSrc
          ) : (
            <img 
              src={imgSrc} 
              alt={translatedName} 
              className="w-full h-full object-contain p-1.5"
              onError={() => {
                // Fallback to local icon if URL fails
                const localFallback = initialSource.startsWith("http") ? "/assets/icons/zucchini.png" : initialSource; // Simplified for demo, ideally we'd map category again
                setImgSrc(localFallback);
              }}
            />
          )}
        </div>
        
        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <h3 className="font-display font-bold text-[15px] text-white leading-tight truncate">
              {translatedName}
            </h3>
            {savings > 15 && (
              <span className="flex items-center gap-0.5 bg-primary/20 text-primary text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-tighter">
                BEST
              </span>
            )}
          </div>
          
          {product.brand && (
            <p className="text-[10px] text-primary/60 font-black uppercase tracking-widest">{product.brand}</p>
          )}
          
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-lg font-display font-black text-white">
              €{lowest.price.toFixed(2)}
            </span>
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground/60 font-medium">
                at {lowestStore?.name} • {translatedUnit}
              </span>
              {lowest.promo_details?.discount_type && (
                <span className="text-[9px] text-primary font-bold uppercase tracking-tight">
                  {lowest.promo_details.discount_type}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3 shrink-0">
          <div className="flex items-center gap-1">
            {onToggleFavorite && (
              <button
                onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
                className="p-2 rounded-xl bg-white/5 active:bg-white/10 transition-all active:scale-90"
              >
                <Heart
                  className={`h-4 w-4 transition-all ${isFavorite ? "fill-primary text-primary scale-110" : "text-muted-foreground/40"}`}
                />
              </button>
            )}
            
            {onAddToBasket && (
              <button
                onClick={(e) => { e.stopPropagation(); onAddToBasket(); }}
                className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all active:scale-75 ${
                  isInBasket 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 rotate-0" 
                    : "bg-white/5 text-muted-foreground hover:bg-primary/20 hover:text-primary"
                }`}
              >
                {isInBasket ? <Check className="h-4.5 w-4.5 stroke-[3px]" /> : <Plus className="h-4.5 w-4.5 stroke-[3px]" />}
              </button>
            )}
          </div>
          
          {savings > 5 && (
            <div className="flex items-center gap-1 bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded-full ring-1 ring-primary/20">
              <TrendingDown className="h-3 w-3" />
              {savings}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
