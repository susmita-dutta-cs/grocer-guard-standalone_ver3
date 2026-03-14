import { Globe, Shield, Trash2, Info, ChevronRight } from "lucide-react";
import { useI18n } from "../hooks/useI18n";

const SettingsTab = () => {
  const { language, setLanguage } = useI18n();

  const handleClearData = () => {
    if (confirm("Clear all local data including favorites?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="px-1">
        <h2 className="text-xl font-display font-bold text-white">Settings</h2>
        <p className="text-xs text-muted-foreground">Manage your app experience</p>
      </div>

      <div className="space-y-2">
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="p-4 flex items-center gap-3 border-b border-border/50">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Globe className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">Language</p>
              <p className="text-[10px] text-muted-foreground">Current: {language.toUpperCase()}</p>
            </div>
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-transparent border-none text-primary text-xs font-bold focus:ring-0 cursor-pointer"
            >
              <option value="en">English</option>
              <option value="nl">Nederlands</option>
              <option value="fr">Français</option>
            </select>
          </div>

          <button className="w-full p-4 flex items-center gap-3 hover:bg-white/5 transition-colors text-left border-b border-border/50">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Shield className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">Privacy & Terms</p>
              <p className="text-[10px] text-muted-foreground">Your data stays on your device</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>

          <button 
            onClick={handleClearData}
            className="w-full p-4 flex items-center gap-3 hover:bg-destructive/5 transition-colors text-left group"
          >
            <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive">
              <Trash2 className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-destructive">Clear All Data</p>
              <p className="text-[10px] text-muted-foreground">Reset app to initial state</p>
            </div>
          </button>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3 group">
          <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
            <Info className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">ShelfSmart Standalone</p>
            <p className="text-[10px] text-muted-foreground">Version 1.2.0 • Build 2026.03</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;
