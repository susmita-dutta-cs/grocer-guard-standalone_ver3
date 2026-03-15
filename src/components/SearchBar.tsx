import { useState, useEffect, useRef, useMemo } from "react";
import { Search, X, History, Sparkles, ArrowRight } from "lucide-react";
import { useI18n } from "../hooks/useI18n";
import type { Product } from "../data/groceryData";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  products: Product[];
  placeholder?: string;
}

const SearchBar = ({ value, onChange, products, placeholder }: SearchBarProps) => {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("shelfsmart_recent_searches");
    if (saved) setRecentSearches(JSON.parse(saved));

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const saveSearch = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    const updated = [trimmed, ...recentSearches.filter(s => s !== trimmed)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("shelfsmart_recent_searches", JSON.stringify(updated));
  };

  const suggestions = useMemo(() => {
    if (!value.trim() || value.length < 2) return [];
    
    const query = value.toLowerCase();
    const matches = new Set<string>();
    
    for (const p of products) {
      if (p.name.toLowerCase().includes(query)) matches.add(p.name);
      if (p.brand?.toLowerCase().includes(query)) matches.add(p.brand);
      if (p.category.toLowerCase().includes(query)) matches.add(p.category);
      if (matches.size >= 8) break;
    }
    
    return Array.from(matches);
  }, [value, products]);

  const handleSelect = (term: string) => {
    onChange(term);
    saveSearch(term);
    setIsOpen(false);
  };

  const handleClearRecent = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches([]);
    localStorage.removeItem("shelfsmart_recent_searches");
  };

  return (
    <div className="relative w-full max-w-xl mx-auto group z-50" ref={containerRef}>
      <div className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center pointer-events-none">
        <Search className={`h-4 w-4 transition-colors ${isOpen ? "text-primary" : "text-muted-foreground"}`} />
      </div>
      
      <input
        type="text"
        inputMode="search"
        placeholder={placeholder || t("search.placeholder")}
        value={value}
        onFocus={() => setIsOpen(true)}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            saveSearch(value);
            setIsOpen(false);
          }
        }}
        className="w-full pl-11 pr-11 py-3.5 rounded-2xl bg-card border border-white/5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all text-sm shadow-2xl"
      />

      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 active:scale-90 transition-all"
        >
          <X className="h-3 w-3 text-muted-foreground" />
        </button>
      )}

      {/* Dropdown menu */}
      {isOpen && (recentSearches.length > 0 || suggestions.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 glass border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          
          {value.length < 2 && recentSearches.length > 0 && (
            <div className="p-2">
              <div className="px-3 py-2 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Recent Searches</span>
                <button onClick={handleClearRecent} className="text-[10px] text-primary font-bold hover:underline">Clear</button>
              </div>
              {recentSearches.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSelect(s)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-left transition-colors group"
                >
                  <History className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                  <span className="text-sm text-foreground/80 group-hover:text-white">{s}</span>
                </button>
              ))}
            </div>
          )}

          {value.length >= 2 && suggestions.length > 0 && (
            <div className="p-2">
              <div className="px-3 py-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">Suggestions</span>
              </div>
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSelect(s)}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl hover:bg-primary/10 text-left transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-3.5 w-3.5 text-primary/40 group-hover:text-primary transition-colors" />
                    <span className="text-sm text-foreground/80 group-hover:text-white font-medium">{s}</span>
                  </div>
                  <ArrowRight className="h-3 w-3 text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
