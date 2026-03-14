import { Home, Heart, ShoppingCart, Settings, ShieldCheck } from "lucide-react";
import { useI18n } from "../hooks/useI18n";

interface BottomNavProps {
  active: string;
  onNavigate: (tab: string) => void;
  basketCount?: number;
  favoritesCount?: number;
  isAdmin?: boolean;
}

const tabIcons = {
  home: Home,
  favorites: Heart,
  basket: ShoppingCart,
  settings: Settings,
  admin: ShieldCheck,
};

const tabKeys: Record<string, string> = {
  home: "nav.home",
  favorites: "nav.favorites",
  basket: "nav.basket",
  settings: "nav.settings",
  admin: "nav.admin",
};

const BottomNav = ({ active, onNavigate, basketCount = 0, favoritesCount = 0, isAdmin = false }: BottomNavProps) => {
  const { t } = useI18n();
  const tabs = (["home", "favorites", "basket", "settings", (isAdmin ? "admin" : null)].filter(Boolean) as (keyof typeof tabIcons)[]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/5 pt-1 pb-[var(--safe-area-bottom)]">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-4">
        {tabs.map((id) => {
          const isActive = active === id;
          const Icon = tabIcons[id];
          return (
            <button
              key={id}
              id={`nav-tab-${id}`}
              onClick={() => onNavigate(id)}
              className={`relative flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-300 active:scale-95 touch-manipulation select-none ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-white/60"
              }`}
            >
              <div className="relative flex items-center justify-center">
                {isActive && (
                  <div className="absolute inset-0 -m-3 bg-primary/10 blur-xl rounded-full animate-pulse" />
                )}
                <div className={`relative p-2 rounded-2xl transition-all duration-300 ${isActive ? "bg-primary/10 shadow-lg shadow-primary/5" : ""}`}>
                  <Icon className={`h-5 w-5 transition-all duration-300 ${isActive ? "scale-110 stroke-[2.5px]" : "stroke-[2px]"}`} />
                </div>
                {(id === "favorites" && favoritesCount > 0) && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[8px] font-black min-w-[14px] h-3.5 rounded-full flex items-center justify-center ring-2 ring-background">
                    {favoritesCount}
                  </span>
                )}
                {(id === "basket" && basketCount > 0) && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[8px] font-black min-w-[14px] h-3.5 rounded-full flex items-center justify-center ring-2 ring-background">
                    {basketCount}
                  </span>
                )}
              </div>
              <span className={`text-[9px] font-black uppercase tracking-tighter transition-all duration-300 ${isActive ? "text-primary opacity-100 translate-y-0" : "opacity-0 translate-y-1"}`}>
                {t(tabKeys[id])}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
