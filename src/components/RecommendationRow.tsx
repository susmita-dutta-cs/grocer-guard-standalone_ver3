import { useState, useEffect } from "react";
import { stores, getLowestPrice } from "../data/groceryData";
import { Sparkles, TrendingDown, Tag, Heart, Plus, Check } from "lucide-react";
import { useI18n } from "../hooks/useI18n";
import { useProductName } from "../hooks/useProductName";
import { useProductImage } from "../hooks/useProductImage";
import type { Recommendation } from "../hooks/useRecommendations";

const reasonConfig: Record<string, { icon: any; titleKey: string; accent: string; bg: string }> = {
  best_value: { icon: TrendingDown, titleKey: "rec.bestValue", accent: "text-emerald-400", bg: "bg-emerald-400/10" },
  deal_trending: { icon: Tag, titleKey: "rec.deals", accent: "text-amber-400", bg: "bg-amber-400/10" },
  personalized: { icon: Heart, titleKey: "rec.personalized", accent: "text-primary", bg: "bg-primary/10" },
};

interface RecommendationRowProps {
  recommendations: Recommendation[];
  reason: string;
  onView: (id: string) => void;
  title?: string;
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (id: string) => void;
  isInBasket: (id: string) => boolean;
  onAddToBasket: (id: string) => void;
}

const RecommendationRow = ({ 
  recommendations, 
  reason, 
  onView, 
  title,
  isFavorite,
  onToggleFavorite,
  isInBasket,
  onAddToBasket
}: RecommendationRowProps) => {
  const { t } = useI18n();
  const { getProductName } = useProductName();
  const { getProductImage, isEmoji } = useProductImage();
  
  if (recommendations.length === 0) return null;
  const config = reasonConfig[reason] || { icon: Sparkles, titleKey: "rec.deals", accent: "text-primary", bg: "bg-primary/10" };
  const Icon = config.icon;

  return (
    <div className="space-y-4 py-2 animate-fade-in-up">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <div className={`h-8 w-8 rounded-xl ${config.bg} flex items-center justify-center`}>
            <Icon className={`h-4 w-4 ${config.accent}`} />
          </div>
          <h3 className="font-display font-bold text-white tracking-wide text-sm uppercase">
            {title || t(config.titleKey)}
          </h3>
        </div>
      </div>
      
      <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide px-1 -mx-4 container-padding">
        {recommendations.map((rec, i) => {
          const lowest = getLowestPrice(rec.product);
          const store = stores.find((s) => s.id === lowest.storeId)!;
          const favorited = isFavorite(rec.product.id);
          const inBasket = isInBasket(rec.product.id);

          return (
            <RecommendationCard 
              key={rec.product.id}
              rec={rec}
              i={i}
              onView={onView}
              favorited={favorited}
              inBasket={inBasket}
              onToggleFavorite={onToggleFavorite}
              onAddToBasket={onAddToBasket}
              config={config}
              getProductImage={getProductImage}
              getProductName={getProductName}
              isEmoji={isEmoji}
            />
          );
        })}
      </div>
    </div>
  );
};

const RecommendationCard = ({ 
  rec, i, onView, favorited, inBasket, onToggleFavorite, onAddToBasket, 
  config, getProductImage, getProductName, isEmoji 
}: any) => {
  const initialImg = getProductImage(rec.product);
  const [imgSrc, setImgSrc] = useState(initialImg);

  useEffect(() => {
    setImgSrc(getProductImage(rec.product));
  }, [rec.product, getProductImage]);

  const lowest = getLowestPrice(rec.product);
  const store = stores.find((s) => s.id === lowest.storeId)!;

  return (
    <div
      onClick={() => onView(rec.product.id)}
      className={`min-w-[170px] bg-card/40 backdrop-blur-md rounded-3xl border p-4 shadow-xl hover:border-primary/30 transition-all flex-shrink-0 group cursor-pointer active:scale-95 relative overflow-hidden ${
        favorited ? "border-primary/20 bg-primary/5" : "border-border/50"
      }`}
      style={{ animationDelay: `${i * 80}ms` }}
    >
       {/* Quick Actions */}
       <div className="absolute top-3 right-3 flex flex-col gap-2 z-20">
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(rec.product.id); }}
          className="p-1.5 rounded-lg bg-white/5 active:bg-white/10 transition-all active:scale-90"
        >
          <Heart
            className={`h-3.5 w-3.5 transition-all ${favorited ? "fill-primary text-primary scale-110" : "text-muted-foreground/40"}`}
          />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onAddToBasket(rec.product.id); }}
          className={`p-1.5 rounded-lg transition-all active:scale-75 ${
            inBasket 
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105" 
              : "bg-white/5 text-muted-foreground hover:bg-primary/20 hover:text-primary"
          }`}
        >
          {inBasket ? <Check className="h-3.5 w-3.5 stroke-[3px]" /> : <Plus className="h-3.5 w-3.5 stroke-[3px]" />}
        </button>
      </div>

      <div className="h-12 w-12 rounded-2xl bg-primary/15 flex items-center justify-center text-3xl mb-3 shadow-inner transition-transform group-hover:scale-110 overflow-hidden">
        {isEmoji(imgSrc) ? (
          imgSrc
        ) : (
          <img 
            src={imgSrc} 
            alt={getProductName(rec.product)} 
            className="w-full h-full object-contain p-1"
            onError={() => {
              const localFallback = initialImg.startsWith("http") ? "/assets/icons/apples.png" : initialImg;
              setImgSrc(localFallback);
            }}
          />
        )}
      </div>
      <p className="font-bold text-sm text-white leading-tight truncate pr-8">
        {getProductName(rec.product)}
      </p>
      {rec.product.brand && (
        <p className="text-[10px] text-primary/70 font-black uppercase tracking-tighter mt-0.5">{rec.product.brand}</p>
      )}
      <p className="text-[10px] text-muted-foreground font-medium mt-1 uppercase tracking-widest">{rec.product.unit}</p>
      <div className="mt-3 flex flex-col gap-0.5">
        <span className="text-xl font-display font-black text-white">
          €{lowest.price.toFixed(2)}
        </span>
        <span className="text-[10px] text-muted-foreground font-black uppercase">at {store.name}</span>
        {lowest.promo_details?.discount_type && (
          <span className="text-[9px] text-primary font-bold uppercase tracking-tight mt-1">
            {lowest.promo_details.discount_type}
          </span>
        )}
      </div>
      <div className={`mt-3 inline-block text-[9px] font-black uppercase tracking-tight px-2.5 py-1 rounded-lg ${config.bg} ${config.accent}`}>
        {rec.label}
      </div>
    </div>
  );
};

export default RecommendationRow;
