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
import AuthScreen from "./components/AuthScreen";
import { useGroceryData } from "./hooks/useGroceryData";
import { useI18n, categoryKeyMap } from "./hooks/useI18n";
import { useProductName } from "./hooks/useProductName";
import { useFavorites } from "./hooks/useFavorites";
import { Store, stores } from "./data/groceryData";


const App = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("home");
  const [user, setUser] = useState<string | null>(() => localStorage.getItem("shelfsmart_user"));
  const { products, setProducts, isLoading, getStats } = useGroceryData();
  const [basket, setBasket] = useState<string[]>([]);
  const { t } = useI18n();
  const { getProductName } = useProductName();
  const { isFavorite, toggleFavorite, favoritesCount, favorites } = useFavorites();
  const stats = getStats();

  const filtered = useMemo(() => {
    let base = activeTab === "favorites" 
      ? products.filter(p => favorites.includes(p.id))
      : products;

    if (activeTab === "favorites" && selectedStores.length > 0) {
      base = base.filter(p => p.prices.some(pr => selectedStores.includes(pr.storeId)));
    }

    return base.filter((p) => {
      const localName = getProductName(p);
      const matchesSearch = localName.toLowerCase().includes(search.toLowerCase()) ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.brand && p.brand.toLowerCase().includes(search.toLowerCase()));
      const matchesCategory = category === "All" || p.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [search, category, products, getProductName, activeTab, favorites, selectedStores]);

  const storeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    stores.forEach(s => {
      counts[s.id] = products.filter(p => p.prices.some(pr => pr.storeId === s.id)).length;
    });
    return counts;
  }, [products]);

  const handleNavigate = (tab: string) => {
    setActiveTab(tab);
  };

  const handleLogin = (email: string) => {
    localStorage.setItem("shelfsmart_user", email);
    setUser(email);
  };

  if (!user) {
    return <AuthScreen onLogin={handleLogin} />;
  }

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
          <div className="space-y-6 animate-fade-in-up pb-10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <Heart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-display font-bold text-white leading-none">My Favorites</h2>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {favorites.length} saved - {selectedStores.length} stores selected
                </p>
              </div>
            </div>

            <SearchBar 
              value={search} 
              onChange={setSearch} 
              placeholder="Search & add products to favorites..." 
            />

            <div className="space-y-3">
              <h3 className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground px-1">
                Select Stores to Browse
              </h3>
              <div className="flex flex-wrap gap-2">
                {stores.map((store) => {
                  const isSelected = selectedStores.includes(store.id);
                  return (
                    <button
                      key={store.id}
                      onClick={() => setSelectedStores(prev => 
                        isSelected ? prev.filter(id => id !== store.id) : [...prev, store.id]
                      )}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                        isSelected 
                          ? "bg-primary/15 border-primary text-white shadow-lg shadow-primary/5" 
                          : "bg-card/40 border-border/50 text-muted-foreground hover:border-primary/30"
                      }`}
                    >
                      <ShoppingBasket className="h-3.5 w-3.5" />
                      <span className="text-xs font-semibold">{store.name}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                        isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}>
                        {storeCounts[store.id] || 0}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-3 pt-2">
              {filtered.map((product, i) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={i}
                  isFavorite={favorites.includes(product.id)}
                  onToggleFavorite={() => toggleFavorite(product.id)}
                  isInBasket={basket.includes(product.id)}
                  onAddToBasket={() => setBasket(prev => 
                    prev.includes(product.id) ? prev.filter(id => id !== product.id) : [...prev, product.id]
                  )}
                />
              ))}

              {(favorites.length === 0 || (selectedStores.length > 0 && filtered.length === 0)) && (
                <div className="space-y-4 pt-4">
                  <div className="bg-card/40 backdrop-blur-md border border-border/50 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <Heart className="h-6 w-6 text-muted-foreground/50" />
                    </div>
                    <p className="text-sm text-muted-foreground font-medium max-w-[200px]">
                      Sign in to save favorites across stores.
                    </p>
                  </div>

                  <div className="bg-card/40 backdrop-blur-md border border-border/50 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <ShoppingBasket className="h-6 w-6 text-muted-foreground/50" />
                    </div>
                    <p className="text-sm text-muted-foreground font-medium max-w-[220px]">
                      Select one or more stores above to browse and save products.
                    </p>
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
          <SettingsTab 
            user={user} 
            onLogout={() => {
              localStorage.removeItem("shelfsmart_user");
              setUser(null);
            }} 
          />
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
