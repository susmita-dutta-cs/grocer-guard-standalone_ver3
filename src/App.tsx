import { useState, useMemo } from "react";
import { ShoppingBasket, Sparkles, RefreshCcw } from "lucide-react";
import heroImage from "./assets/hero-groceries.png";
import SearchBar from "./components/SearchBar";
import CategoryFilter from "./components/CategoryFilter";
import ProductCard from "./components/ProductCard";
import BottomNav from "./components/BottomNav";
import AdminTab from "./components/AdminTab";
import BasketTab from "./components/BasketTab";
import SettingsTab from "./components/SettingsTab";
import { useGroceryData } from "./hooks/useGroceryData";
import { useI18n } from "./hooks/useI18n";
import { useProductName } from "./hooks/useProductName";
import { useFavorites } from "./hooks/useFavorites";


const App = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [activeTab, setActiveTab] = useState("home");
  const { products, setProducts, isLoading, getStats } = useGroceryData();
  const [basket, setBasket] = useState<string[]>([]);
  const { t } = useI18n();
  const { getProductName } = useProductName();
  const { isFavorite, toggleFavorite, favoritesCount, favorites } = useFavorites();
  const stats = getStats();

  const filtered = useMemo(() => {
    const base = activeTab === "favorites" 
      ? products.filter(p => favorites.includes(p.id))
      : products;

    return base.filter((p) => {
      const localName = getProductName(p);
      const matchesSearch = localName.toLowerCase().includes(search.toLowerCase()) ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.brand && p.brand.toLowerCase().includes(search.toLowerCase()));
      const matchesCategory = category === "All" || p.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [search, category, products, getProductName]);

  const handleNavigate = (tab: string) => {
    setActiveTab(tab);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <RefreshCcw className="h-10 w-10 text-primary animate-spin" />
        <p className="mt-4 text-muted-foreground font-medium">Loading grocery deals...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 font-sans">
      <header className="glass border-b border-border sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/15 flex items-center justify-center">
            <ShoppingBasket className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="font-display font-bold text-base text-white">ShelfSmart</h1>
            <p className="text-[10px] text-muted-foreground">{t("app.tagline")}</p>
          </div>
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-5">
        {activeTab === "home" && (
          <>
            <section className="relative bg-gradient-to-br from-primary/15 via-card to-card rounded-2xl border border-border overflow-hidden p-5">
              <div className="flex items-center gap-4">
                <div className="flex-1 space-y-2">
                  <h2 className="font-display font-extrabold text-2xl text-white leading-tight">
                    {t("hero.title1")}
                    <br />
                    <span className="text-primary">{t("hero.title2")}</span>
                  </h2>
                  <p className="text-muted-foreground text-xs">{t("hero.subtitle")}</p>
                </div>
                <img src={heroImage} alt="Fresh groceries" className="w-24 h-24 rounded-lg object-cover opacity-90 shadow-2xl" />
              </div>
            </section>
            <section className="grid grid-cols-3 gap-3">
              <div className="bg-card/50 border border-border p-3 rounded-2xl flex flex-col items-center justify-center text-center">
                <span className="text-primary font-bold text-lg">{stats.total}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Products</span>
              </div>
              <div className="bg-card/50 border border-border p-3 rounded-2xl flex flex-col items-center justify-center text-center">
                <span className="text-primary font-bold text-lg">€{(stats.avgSavings / 100).toFixed(2)}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Avg. Savings</span>
              </div>
              <div className="bg-card/50 border border-border p-3 rounded-2xl flex flex-col items-center justify-center text-center">
                <span className="text-primary font-bold text-lg">€{stats.totalPotentialSavings.toFixed(0)}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Total Potential</span>
              </div>
            </section>

            <SearchBar value={search} onChange={setSearch} />

            <CategoryFilter selected={category} onSelect={setCategory} />

            <div className="flex items-center justify-between px-1">
              <h3 className="font-display font-bold text-sm text-white">Hot Deals & Trending</h3>
              <Sparkles className="h-4 w-4 text-primary" />
            </div>

            <div className="grid grid-cols-1 gap-3">
              {filtered.map((product, i) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={i}
                  isFavorite={isFavorite(product.id)}
                  onToggleFavorite={() => toggleFavorite(product.id)}
                  isInBasket={basket.includes(product.id)}
                  onAddToBasket={() => setBasket(prev => 
                    prev.includes(product.id) ? prev.filter(id => id !== product.id) : [...prev, product.id]
                  )}
                />
              ))}
              {filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ShoppingBasket className="h-12 w-12 text-muted-foreground/20 mb-3" />
                  <p className="text-sm text-muted-foreground">No deals found for "{search}"</p>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === "favorites" && (
          <div className="space-y-5 animate-fade-in-up">
            <div className="px-1">
              <h2 className="text-xl font-display font-bold text-white">Your Favorites</h2>
              <p className="text-xs text-muted-foreground">{filtered.length} items saved</p>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {filtered.map((product, i) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={i}
                  isFavorite={true}
                  onToggleFavorite={() => toggleFavorite(product.id)}
                  isInBasket={basket.includes(product.id)}
                  onAddToBasket={() => setBasket(prev => 
                    prev.includes(product.id) ? prev.filter(id => id !== product.id) : [...prev, product.id]
                  )}
                />
              ))}
              {filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                    <Heart className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">No Favorites Yet</h3>
                    <p className="text-sm text-muted-foreground">Tap the heart on any product to save it here.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "basket" && (
          <BasketTab 
            items={products.filter(p => basket.includes(p.id))} 
            onRemove={(id) => setBasket(prev => prev.filter(iid => iid !== id))} 
          />
        )}

        {activeTab === "settings" && (
          <SettingsTab />
        )}

        {activeTab === "admin" && (
          <AdminTab products={products} onUpdateProducts={setProducts} />
        )}
      </main>

      <BottomNav 
        active={activeTab} 
        onNavigate={handleNavigate} 
        favoritesCount={favoritesCount} 
        basketCount={basket.length} 
      />
    </div>
  );
};

export default App;
