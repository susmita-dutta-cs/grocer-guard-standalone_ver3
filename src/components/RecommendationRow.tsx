import { stores, getLowestPrice } from "../data/groceryData";
import { Sparkles, TrendingDown, Tag, Heart } from "lucide-react";
import { useI18n } from "../hooks/useI18n";
import { useProductName } from "../hooks/useProductName";
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
}

const RecommendationRow = ({ recommendations, reason, onView }: RecommendationRowProps) => {
  const { t } = useI18n();
  const { getProductName } = useProductName();
  
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
          <h3 className="font-display font-bold text-white tracking-wide text-sm uppercase">{t(config.titleKey)}</h3>
        </div>
      </div>
      
      <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide px-1 -mx-4 container-padding">
        {recommendations.map((rec, i) => {
          const lowest = getLowestPrice(rec.product);
          const store = stores.find((s) => s.id === lowest.storeId)!;
          return (
            <div
              key={rec.product.id}
              onClick={() => onView(rec.product.id)}
              className="min-w-[170px] bg-card/40 backdrop-blur-md rounded-3xl border border-border/50 p-4 shadow-xl hover:border-primary/30 transition-all flex-shrink-0 group cursor-pointer active:scale-95"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="h-12 w-12 rounded-2xl bg-primary/15 flex items-center justify-center text-3xl mb-3 shadow-inner transition-transform group-hover:scale-110">
                {rec.product.image}
              </div>
              <p className="font-bold text-sm text-white leading-tight truncate">
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
              </div>
              <div className={`mt-3 inline-block text-[9px] font-black uppercase tracking-tight px-2.5 py-1 rounded-lg ${config.bg} ${config.accent}`}>
                {rec.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecommendationRow;
