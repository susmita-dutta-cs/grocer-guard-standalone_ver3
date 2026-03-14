import { useState, useMemo } from "react";
import { ShieldCheck, Save, RefreshCw, Database, Newspaper, Search, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import SearchBar from "./SearchBar";
import { stores } from "../data/groceryData";
import type { Product } from "../data/groceryData";

interface AdminTabProps {
  products: Product[];
  onUpdateProducts: (products: Product[]) => void;
}

const AdminTab = ({ products, onUpdateProducts }: AdminTabProps) => {
  const [search, setSearch] = useState("");
  const [editingPrices, setEditingPrices] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(search.toLowerCase()))
    ).slice(0, 50); // Limit display for performance
  }, [search, products]);

  const handlePriceChange = (productId: string, storeId: string, value: string) => {
    setEditingPrices(prev => ({
      ...prev,
      [`${productId}_${storeId}`]: value
    }));
  };

  const saveAllPrices = async () => {
    setSaving(true);
    // In a real standalone, we'd need an API to write to db.json
    // For now, we update local state
    const newProducts = products.map(p => {
      const updatedPrices = p.prices.map(pr => {
        const key = `${p.id}_${pr.storeId}`;
        if (key in editingPrices) {
          return { ...pr, price: parseFloat(editingPrices[key]) || pr.price };
        }
        return pr;
      });
      return { ...p, prices: updatedPrices };
    });

    setTimeout(() => {
      onUpdateProducts(newProducts);
      setEditingPrices({});
      setSaving(false);
      alert("Prices updated in local state! To save permanently, you would need a backend API.");
    }, 1000);
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center gap-3 px-1">
        <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center">
          <ShieldCheck className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Admin Panel</h2>
          <p className="text-xs text-muted-foreground">Manage your local product catalog</p>
        </div>
      </div>

      {/* Maintenance Actions */}
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" />
            Data Maintenance
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-background border border-border space-y-2">
                <p className="text-xs font-semibold text-white">Product Seeding</p>
                <p className="text-[10px] text-muted-foreground">Generate 5,000 products with realistic prices.</p>
                <code className="block p-2 bg-black/30 rounded text-primary text-[10px]">node seed.js</code>
            </div>
            <div className="p-4 rounded-xl bg-background border border-border space-y-2">
                <p className="text-xs font-semibold text-white">AI Scraping</p>
                <p className="text-[10px] text-muted-foreground">Extract promotions from store flyers using Gemini.</p>
                <code className="block p-2 bg-black/30 rounded text-primary text-[10px]">node scrape.js</code>
            </div>
          </div>
        </div>
      </div>

      {/* Price Editor */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between gap-4">
           <h3 className="font-bold text-white flex items-center gap-2 whitespace-nowrap">
            <RefreshCw className="h-4 w-4 text-primary" />
            Price Editor
          </h3>
          <button
            onClick={saveAllPrices}
            disabled={saving || Object.keys(editingPrices).length === 0}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-semibold disabled:opacity-40"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? "Saving..." : `Save Changes (${Object.keys(editingPrices).length})`}
          </button>
        </div>

        <div className="p-4">
          <SearchBar value={search} onChange={setSearch} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left py-3 px-4 font-semibold text-white sticky left-0 bg-[#0A0A0B] z-10 w-40">Product</th>
                {stores.map(s => (
                  <th key={s.id} className="text-center py-3 px-2 font-semibold text-white min-w-[80px]">{s.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(product => (
                <tr key={product.id} className="border-b border-border/50 hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4 sticky left-0 bg-[#0A0A0B] z-10 border-r border-border/30">
                    <div className="flex flex-col">
                      <span className="font-medium text-white line-clamp-1">{product.name}</span>
                      <span className="text-[10px] text-muted-foreground">{product.brand} • {product.unit}</span>
                    </div>
                  </td>
                  {stores.map(store => {
                    const priceObj = product.prices.find(pr => pr.storeId === store.id);
                    const key = `${product.id}_${store.id}`;
                    const isEdited = key in editingPrices;
                    const displayValue = isEdited ? editingPrices[key] : (priceObj?.price.toString() || "");

                    return (
                      <td key={store.id} className="p-2 text-center">
                        <input
                          type="number"
                          step="0.01"
                          value={displayValue}
                          onChange={(e) => handlePriceChange(product.id, store.id, e.target.value)}
                          placeholder="—"
                          className={`w-full text-center py-1.5 px-1 rounded-lg border text-[11px] font-medium transition-all ${
                            isEdited
                              ? "bg-primary/20 border-primary/50 text-primary"
                              : "bg-background border-border text-white"
                          } focus:outline-none focus:ring-1 focus:ring-primary/40`}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredProducts.length === 0 && (
          <div className="py-10 text-center text-muted-foreground text-sm">
            No products found matching your search.
          </div>
        )}
        <div className="p-3 border-t border-border bg-muted/20 text-center">
            <p className="text-[10px] text-muted-foreground">Showing first 50 results for performance</p>
        </div>
      </div>
    </div>
  );
};

export default AdminTab;
