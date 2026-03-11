import { useState, useMemo } from "react";
import { ShoppingBasket, Sparkles, RefreshCcw } from "lucide-react";
import heroImage from "./assets/hero-groceries.png";
import SearchBar from "./components/SearchBar";
import CategoryFilter from "./components/CategoryFilter";
import ProductCard from "./components/ProductCard";
import BottomNav from "./components/BottomNav";
import { useGroceryData } from "./hooks/useGroceryData";
import { useI18n } from "./hooks/useI18n";
import { useProductName } from "./hooks/useProductName";
import type { Product } from "./data/groceryData";

const App = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [activeTab, setActiveTab] = useState("home");
  const { products, isLoading } = useGroceryData();
  const { t } = useI18n();
  const { getProductName } = useProductName();

  const filtered = useMemo(() => {
    return products.filter((p) => {
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
            <h1 className="font-display font-bold text-base text-white">GrocerySaver</h1>
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

            <SearchBar value={search} onChange={setSearch} />

            <CategoryFilter selected={category} onSelect={setCategory} />

            <div className="space-y-3">
              {filtered.map((product, i) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={i}
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

        {activeTab === "basket" && (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <ShoppingBasket className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Your Basket is Empty</h3>
              <p className="text-sm text-muted-foreground">Start adding grocery deals to save!</p>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-white px-1">Settings</h2>
            <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Language</p>
                  <p className="text-xs text-muted-foreground">Choose your preferred language</p>
                </div>
                <select className="bg-background border border-border rounded-lg px-2 py-1 text-xs text-white">
                  <option>English</option>
                  <option>Dutch</option>
                  <option>French</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </main>

      <BottomNav active={activeTab} onNavigate={handleNavigate} />
    </div>
  );
};

export default App;
