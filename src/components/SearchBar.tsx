import { Search, X } from "lucide-react";
import { useI18n } from "../hooks/useI18n";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const SearchBar = ({ value, onChange, placeholder }: SearchBarProps) => {
  const { t } = useI18n();
  return (
    <div className="relative w-full max-w-xl mx-auto group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center pointer-events-none">
        <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
      </div>
      <input
        type="text"
        inputMode="search"
        placeholder={placeholder || t("search.placeholder")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
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
    </div>
  );
};

export default SearchBar;
