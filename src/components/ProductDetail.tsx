import { ArrowLeft, Heart } from "lucide-react";
import { Product, stores } from "../data/groceryData";
import { useProductName } from "../hooks/useProductName";
import { useMemo } from "react";

const storeColorMap: Record<string, string> = {
  aldi: "bg-[#002d72]",
  "albert-heijn": "bg-[#00a1e1]",
  carrefour: "bg-[#003da5]",
  colruyt: "bg-[#f47321]",
  jumbo: "bg-[#e2b007]",
  lidl: "bg-[#0050aa]",
  delhaize: "bg-[#e30613]",
};

const storeHomeBrands: Record<string, string[]> = {
  aldi: ["Aldi", "Lyttos", "Moser Roth", "Specially Selected", "Casa Morando", "Mamia", "Lacura", "Brooklea"],
  "albert-heijn": ["AH", "Albert Heijn", "AH Basic", "AH Excellent", "AH Terra"],
  carrefour: ["Carrefour", "Carrefour Bio", "Carrefour Classic", "Carrefour Extra", "Carrefour Original", "Simpl", "Carrefour Discount"],
  colruyt: ["Boni", "Everyday", "Spar"],
  lidl: ["Lidl", "Milbona", "Cien", "Silvercrest", "Parkside", "Perlenbacher", "Pilos"],
  delhaize: ["Delhaize", "365"],
};

function isHomeBrandForStore(brand: string, storeId: string): boolean {
  const brands = storeHomeBrands[storeId] || [];
  return brands.some((hb) => brand.toLowerCase().includes(hb.toLowerCase()));
}

function isAnyHomeBrand(brand: string | undefined): boolean {
  if (!brand) return false;
  return Object.values(storeHomeBrands).some((brands) =>
    brands.some((hb) => brand.toLowerCase().includes(hb.toLowerCase()))
  );
}

function getHomeBrandStoreId(brand: string): string | undefined {
  for (const [storeId, brands] of Object.entries(storeHomeBrands)) {
    if (brands.some((hb) => brand.toLowerCase().includes(hb.toLowerCase()))) {
      return storeId;
    }
  }
  return undefined;
}

interface ProductDetailProps {
  product: Product;
  relatedProducts: Product[];
  onBack: () => void;
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (id: string) => void;
}

type BrandPrice = {
  productId: string;
  brand: string;
  price: number;
  onSale: boolean;
};

type StoreGroup = {
  storeId: string;
  storeName: string;
  brands: BrandPrice[];
  cheapest: number;
};

const ProductDetail = ({
  product,
  relatedProducts,
  onBack,
  isFavorite,
  onToggleFavorite,
}: ProductDetailProps) => {
  const { getProductName } = useProductName();

  const allVariants = useMemo(
    () => [product, ...relatedProducts.filter((p) => p.id !== product.id)],
    [product, relatedProducts]
  );

  const storeGroups: StoreGroup[] = useMemo(() => {
    const map = new Map<string, BrandPrice[]>();

    for (const variant of allVariants) {
      const brandName = variant.brand || getProductName(variant);
      const homeBrandOwner = isAnyHomeBrand(variant.brand) ? getHomeBrandStoreId(variant.brand!) : null;

      for (const pp of variant.prices) {
        if (homeBrandOwner && pp.storeId !== homeBrandOwner) continue;

        if (!map.has(pp.storeId)) map.set(pp.storeId, []);
        map.get(pp.storeId)!.push({
          productId: variant.id,
          brand: brandName,
          price: pp.price,
          onSale: pp.onSale || false,
        });
      }
    }

    const groups: StoreGroup[] = [];
    for (const [storeId, brands] of map) {
      const store = stores.find((s) => s.id === storeId);
      if (!store) continue;
      const sorted = brands.slice().sort((a, b) => a.price - b.price);
      groups.push({
        storeId,
        storeName: store.name,
        brands: sorted,
        cheapest: sorted[0].price,
      });
    }

    return groups.sort((a, b) => a.cheapest - b.cheapest);
  }, [allVariants, getProductName]);

  const globalMax = useMemo(() => {
    let max = 0;
    for (const g of storeGroups) {
      for (const b of g.brands) {
        if (b.price > max) max = b.price;
      }
    }
    return max || 1;
  }, [storeGroups]);

  return (
    <div className="space-y-6 animate-fade-in-up pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 bg-card/30 backdrop-blur-md p-4 rounded-3xl border border-white/5 sticky top-0 z-10">
        <button
          onClick={onBack}
          className="h-10 w-10 rounded-2xl bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors active:scale-95"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="h-12 w-12 rounded-2xl bg-primary/15 flex items-center justify-center text-3xl shrink-0 shadow-inner">
            {product.image}
          </div>
          <div className="min-w-0">
            <h2 className="font-display font-bold text-xl text-white truncate leading-tight">
              {getProductName(product)}
            </h2>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mt-1">
              {storeGroups.length} STORES · {allVariants.length} VARIANTS · {product.unit}
            </p>
          </div>
        </div>
      </div>

      {/* Store cards */}
      <div className="space-y-4 px-1">
        {storeGroups.map((group, i) => {
          const isCheapestStore = i === 0;

          return (
            <div
              key={group.storeId}
              className={`bg-card/40 backdrop-blur-md rounded-3xl border p-5 space-y-4 animate-fade-in-up transition-all hover:border-primary/20 ${
                isCheapestStore ? "border-primary/40 shadow-lg shadow-primary/5 ring-1 ring-primary/20" : "border-border/50"
              }`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {/* Store header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-4 w-4 rounded-full shadow-lg ${storeColorMap[group.storeId] || "bg-muted"}`} />
                  <p className="font-display font-bold text-white tracking-wide uppercase text-xs">
                    {group.storeName}
                  </p>
                  {isCheapestStore && (
                    <span className="bg-primary text-primary-foreground text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-sm">
                      Best Store
                    </span>
                  )}
                </div>
              </div>

              {/* Brand price bars */}
              <div className="space-y-2.5">
                {group.brands.map((bp) => {
                  const barWidth = Math.max(30, (bp.price / globalMax) * 100);
                  const isLowest = bp.price === group.cheapest;
                  const isHome = isHomeBrandForStore(bp.brand, group.storeId);

                  return (
                    <div key={bp.productId} className="group/item flex items-center gap-3">
                      <div className="w-24 flex items-center gap-1.5 min-w-0 shrink-0">
                        <span className={`text-[10px] font-bold truncate transition-colors ${isLowest ? "text-primary" : "text-muted-foreground group-hover/item:text-white"}`}>
                          {bp.brand}
                        </span>
                        {isHome && (
                          <span title="Store Brand" className="shrink-0 text-[8px] bg-white/10 text-white px-1 py-0.5 rounded-md font-black">
                            🏠
                          </span>
                        )}
                      </div>
                      <div className="flex-1 h-8 bg-black/20 rounded-xl overflow-hidden relative border border-white/5">
                        <div
                          className={`h-full rounded-xl transition-all duration-1000 ease-out shadow-inner ${storeColorMap[group.storeId] || "bg-muted"} ${
                            isLowest ? "opacity-100 shadow-[0_0_15px_rgba(var(--primary),0.3)]" : "opacity-20"
                          }`}
                          style={{ width: `${barWidth}%` }}
                        />
                        <div className="absolute inset-0 flex items-center justify-between px-3">
                           <span className={`text-[10px] font-black ${isLowest ? "text-white" : "text-muted-foreground group-hover/item:text-white"}`}>
                            €{bp.price.toFixed(2)}
                          </span>
                          {bp.onSale && (
                            <span className="text-primary font-black text-[9px] uppercase italic">
                              SALE
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => onToggleFavorite(bp.productId)}
                        className={`p-1.5 rounded-xl transition-all active:scale-90 ${
                          isFavorite(bp.productId) ? "bg-primary/10" : "hover:bg-white/5"
                        }`}
                      >
                        <Heart
                          className={`h-4 w-4 transition-colors ${
                            isFavorite(bp.productId) ? "fill-primary text-primary" : "text-muted-foreground"
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Store cheapest footer */}
              <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Pricing starts from</span>
                <span className="text-sm font-display font-black text-primary">
                  €{group.cheapest.toFixed(2)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProductDetail;
