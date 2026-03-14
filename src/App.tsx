import { useState, useMemo } from "react";
import { ShoppingBasket, Sparkles, RefreshCcw, Heart } from "lucide-react";
import heroImage from "./assets/hero-groceries.png";
import SearchBar from "./components/SearchBar";
import CategoryFilter from "./components/CategoryFilter";
import ProductCard from "./components/ProductCard";
import BottomNav from "./components/BottomNav";
import AdminTab from "./components/AdminTab";
import BasketTab from "./components/BasketTab";
import SettingsTab from "./components/SettingsTab";
import AuthScreen from "./components/AuthScreen";
import ProductDetail from "./components/ProductDetail";
import RecommendationRow from "./components/RecommendationRow";
import { useGroceryData } from "./hooks/useGroceryData";
import { useI18n } from "./hooks/useI18n";
import { useProductName } from "./hooks/useProductName";
import { useFavorites } from "./hooks/useFavorites";
import { useRecommendations } from "./hooks/useRecommendations";
import { stores } from "./data/groceryData";
import type { Product } from "./data/groceryData";


const App = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>("home");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [user, setUser] = useState<string | null>(() => localStorage.getItem("shelfsmart_user"));
  
  const { products, setProducts, isLoading, getStats } = useGroceryData();
  const [basket, setBasket] = useState<string[]>([]);
  const [basketSearch, setBasketSearch] = useState("");
  const [basketCategory, setBasketCategory] = useState("All");
  const { t } = useI18n();
  const { getProductName } = useProductName();
  const { isFavorite, toggleFavorite, favoritesCount, favorites } = useFavorites();
  const { bestValue, deals, personalized, trackView, getSmartBasket } = useRecommendations();
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
    setSelectedProduct(null);
  };

  const handleProductSelect = (product: Product) => {
    trackView(product.id);
    setSelectedProduct(product);
  };

  const relatedProducts = useMemo(() => {
    if (!selectedProduct) return [];
    return products.filter(p => p.category === selectedProduct.category && p.id !== selectedProduct.id);
  }, [selectedProduct, products]);

  const handleLogin = (email: string) => {
    localStorage.setItem("shelfsmart_user", email);
    setUser(email);
  };

  const handleLogout = () => {
    localStorage.removeItem("shelfsmart_user");
    setUser(null);
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
    <div className="min-h-screen bg-background pb-24 font-sans relative overflow-hidden">
      {/* Premium Background Accents */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[80%] h-[50%] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[80%] h-[50%] bg-blue-500/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <header className="glass border-b border-white/5 sticky top-0 z-40 px-4">
        <div className="max-w-lg mx-auto py-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center shadow-inner">
            <ShoppingBasket className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="font-display font-black text-xl text-white tracking-tight leading-none">ShelfSmart</h1>
            <p className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-widest mt-1">{t("app.tagline")}</p>
          </div>
          <div className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center transition-transform active:scale-90">
            <Sparkles className="h-5 w-5 text-primary animate-float" />
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6 relative z-10">
        {activeTab === "home" && (
          selectedProduct ? (
            <ProductDetail
              product={selectedProduct}
              relatedProducts={relatedProducts}
              onBack={() => setSelectedProduct(null)}
              isFavorite={isFavorite}
              onToggleFavorite={toggleFavorite}
            />
          ) : (
          <>
            <section className="relative h-48 rounded-3xl overflow-hidden group shadow-2xl">
              <img src={heroImage} alt="Hero" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end p-6">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1 drop-shadow-md">Active Tracking</span>
                <h2 className="text-3xl font-display font-black text-white leading-[0.9] drop-shadow-xl uppercase italic">
                  {t("hero.title1")}
                  <br />
                  <span className="text-primary">{t("hero.title2")}</span>
                  <br />
                  <span className="text-white/60 text-lg normal-case">{t("hero.subtitle")}</span>
                </h2>
              </div>
            </section>

            <SearchBar value={search} onChange={setSearch} />

            {search.trim() ? (
              <div className="space-y-3">
                {filtered.map((product, i) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    index={i}
                    onView={() => handleProductSelect(product)}
                    isFavorite={isFavorite(product.id)}
                    onToggleFavorite={() => toggleFavorite(product.id)}
                    isInBasket={basket.includes(product.id)}
                    onAddToBasket={() => setBasket(prev => 
                      prev.includes(product.id) ? prev.filter(id => id !== product.id) : [...prev, product.id]
                    )}
                  />
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-card/40 backdrop-blur-md rounded-2xl p-3 border border-border/50 shadow-lg">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Items</p>
                    <p className="text-xl font-display font-black text-white leading-none">{stats.total}</p>
                  </div>
                  <div className="bg-card/40 backdrop-blur-md rounded-2xl p-3 border border-border/50 shadow-lg">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Avg Sav</p>
                    <p className="text-xl font-display font-black text-primary leading-none">{stats.avgSavings}%</p>
                  </div>
                  <div className="bg-card/40 backdrop-blur-md rounded-2xl p-3 border border-border/50 shadow-lg">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Total Savings</p>
                    <p className="text-lg font-display font-black text-white leading-none">€{(stats.totalPotentialSavings || 0).toFixed(2)}</p>
                  </div>
                </div>

                <RecommendationRow
                  recommendations={deals}
                  reason="deal_trending"
                  onView={(id) => handleProductSelect(products.find(p => p.id === id)!)}
                />

                <RecommendationRow
                  recommendations={bestValue}
                  reason="best_value"
                  onView={(id) => handleProductSelect(products.find(p => p.id === id)!)}
                />

                {personalized.length > 0 && (
                  <RecommendationRow
                    recommendations={personalized}
                    reason="personalized"
                    onView={(id) => handleProductSelect(products.find(p => p.id === id)!)}
                  />
                )}

                <CategoryFilter selected={category} onSelect={setCategory} />

                <div className="flex items-center justify-between px-1">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Trending & Hot Deals</h3>
                </div>

                <div className="grid grid-cols-1 gap-3 pb-4">
                  {filtered.slice(0, 50).map((product, i) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      index={i}
                      onView={() => handleProductSelect(product)}
                      isFavorite={isFavorite(product.id)}
                      onToggleFavorite={() => toggleFavorite(product.id)}
                      isInBasket={basket.includes(product.id)}
                      onAddToBasket={() => setBasket(prev => 
                        prev.includes(product.id) ? prev.filter(id => id !== product.id) : [...prev, product.id]
                      )}
                    />
                  ))}
                </div>
              </>
            )}
          </>
          )
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
            onRemove={(id) => setBasket(prev => prev.filter(x => x !== id))}
            onAdd={(id) => setBasket(prev => [...prev, id])}
            itemsByStore={getSmartBasket(basket)}
            allProducts={products}
            search={basketSearch}
            setSearch={setBasketSearch}
            category={basketCategory}
            setCategory={setBasketCategory}
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
