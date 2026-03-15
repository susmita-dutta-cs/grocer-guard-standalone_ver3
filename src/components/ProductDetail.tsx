import { ArrowLeft, Heart, Plus, Check } from "lucide-react";
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

interface ProductDetailProps {
  product: Product;
  relatedProducts: Product[];
  onBack: () => void;
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (id: string) => void;
  isInBasket: (id: string) => boolean;
  onAddToBasket: (id: string) => void;
}

type MatrixRow = {
  productId: string;
  image: string;
  name: string;
  brand: string | undefined;
  unit: string;
  storeId: string;
  storeName: string;
  price: number;
  onSale: boolean;
  promoText?: string | null;
};

const ProductDetail = ({
  product,
  relatedProducts,
  onBack,
  isFavorite,
  onToggleFavorite,
  isInBasket,
  onAddToBasket
}: ProductDetailProps) => {
  const { getProductName } = useProductName();

  const matrixData: MatrixRow[] = useMemo(() => {
    const allVariants = [product, ...relatedProducts.filter((p) => p.id !== product.id)];
    const rows: MatrixRow[] = [];

    for (const variant of allVariants) {
      for (const pp of variant.prices) {
        const store = stores.find((s) => s.id === pp.storeId);
        if (!store) continue;

        rows.push({
          productId: variant.id,
          image: variant.image,
          name: getProductName(variant),
          brand: variant.brand,
          unit: variant.unit,
          storeId: pp.storeId,
          storeName: store.name,
          price: pp.price,
          onSale: pp.onSale || false,
          promoText: pp.promo_details?.discount_type,
        });
      }
    }

    return rows.sort((a, b) => a.price - b.price);
  }, [product, relatedProducts, getProductName]);

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
              {matrixData.length} VARIATIONS ACROSS STORES · {product.unit}
            </p>
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="bg-card/40 backdrop-blur-md rounded-3xl border border-border/50 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/5 font-display">
                <th className="px-5 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Product</th>
                <th className="px-5 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Store</th>
                <th className="px-5 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Price</th>
                <th className="px-5 py-4 text-[10px] font-black text-white text-center uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {matrixData.map((row, i) => {
                const isFavorited = isFavorite(row.productId);
                const inBasket = isInBasket(row.productId);
                
                return (
                  <tr 
                    key={`${row.productId}-${row.storeId}`} 
                    className={`group transition-colors hover:bg-white/5 ${i === 0 ? "bg-primary/5" : ""}`}
                  >
                    <td className="px-5 py-4 min-w-[200px]">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl shrink-0 group-hover:scale-110 transition-transform">{row.image}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate leading-tight">{row.name}</p>
                          {row.brand && (
                            <p className="text-[9px] text-primary/70 font-black uppercase tracking-tighter mt-1">{row.brand}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`h-2.5 w-2.5 rounded-full shadow-lg ${storeColorMap[row.storeId] || "bg-muted"}`} />
                        <span className="text-[10px] font-black text-muted-foreground uppercase group-hover:text-white/80 transition-colors tracking-tight">{row.storeName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col">
                        <span className={`text-sm font-display font-black ${row.onSale ? "text-primary" : "text-white"}`}>
                          €{row.price.toFixed(2)}
                        </span>
                        {row.onSale && (
                          <div className="flex flex-col gap-1 mt-1">
                            <span className="inline-block self-start text-[8px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-black uppercase tracking-tighter shadow-sm animate-pulse-subtle">
                              SALE
                            </span>
                            {row.promoText && (
                              <span className="text-[8px] text-primary/80 font-bold uppercase truncate max-w-[80px]">
                                {row.promoText}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => onToggleFavorite(row.productId)}
                          className={`p-2 rounded-xl transition-all active:scale-90 ${isFavorited ? "bg-primary/10" : "hover:bg-white/10"}`}
                        >
                          <Heart className={`h-4 w-4 ${isFavorited ? "fill-primary text-primary" : "text-muted-foreground/30"}`} />
                        </button>
                        <button
                          onClick={() => onAddToBasket(row.productId)}
                          className={`p-2 rounded-xl transition-all active:scale-95 ${inBasket ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-white/5 text-muted-foreground/40 hover:bg-white/10"}`}
                        >
                          {inBasket ? <Check className="h-4 w-4 stroke-[3px]" /> : <Plus className="h-4 w-4 stroke-[3px]" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
