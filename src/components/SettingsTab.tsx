import { Globe, Shield, Trash2, Info, LogOut, User, Cpu, Sparkles } from "lucide-react";
import { useI18n } from "../hooks/useI18n";

interface SettingsTabProps {
  user: string;
  onLogout: () => void;
}

const SettingsTab = ({ user, onLogout }: SettingsTabProps) => {
  const { language, setLanguage } = useI18n();

  const handleClearData = () => {
    if (confirm("Clear all local data including favorites?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up pb-20">
      <div className="px-1">
        <h2 className="text-2xl font-display font-black text-white tracking-tight italic">Settings</h2>
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mt-1">Personalize your experience</p>
      </div>

      {/* Account Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <User className="h-4 w-4 text-primary" />
          <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">My Account</h3>
        </div>
        <div className="bg-card/40 backdrop-blur-md rounded-[32px] border border-white/5 p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-primary/10 transition-colors" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 shadow-inner">
              <User className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{user}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black opacity-60">Subscriber</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full mt-6 flex items-center justify-center gap-2 bg-white/5 hover:bg-red-500/10 border border-white/5 rounded-2xl py-3 text-xs font-bold text-muted-foreground hover:text-red-500 transition-all active:scale-95"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Preferences Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Globe className="h-4 w-4 text-primary" />
          <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">App Preferences</h3>
        </div>
        <div className="bg-card/40 backdrop-blur-md rounded-[32px] border border-white/5 p-4 shadow-xl space-y-4">
          <div className="flex flex-col gap-3 p-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-white">Language</p>
              <p className="text-[10px] text-primary font-black uppercase tracking-widest">Active</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'en', label: 'English', flag: '🇬🇧' },
                { id: 'nl', label: 'Dutch', flag: '🇳🇱' },
                { id: 'fr', label: 'French', flag: '🇫🇷' }
              ].map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => setLanguage(lang.id)}
                  className={`flex flex-col items-center justify-center gap-1 py-3 rounded-2xl border transition-all active:scale-95 ${
                    language === lang.id 
                      ? "bg-primary border-primary shadow-lg shadow-primary/20" 
                      : "bg-background/20 border-white/5 text-muted-foreground hover:bg-white/5"
                  }`}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span className={`text-[9px] font-black uppercase ${language === lang.id ? "text-primary-foreground" : ""}`}>{lang.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={handleClearData}
            className="w-full p-4 flex items-center gap-3 hover:bg-destructive/5 transition-colors text-left group"
          >
            <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive">
              <Trash2 className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-destructive">Delete All Data</p>
              <p className="text-[10px] text-muted-foreground">Reset your favorites and cache</p>
            </div>
          </button>
        </div>
      </div>

      {/* About Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Info className="h-4 w-4 text-primary" />
          <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">About ShelfSmart</h3>
        </div>
        <div className="bg-gradient-to-br from-card/60 to-background/40 backdrop-blur-md rounded-[32px] border border-white/5 p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
            <Cpu className="h-12 w-12 text-primary/10 animate-float" />
          </div>
          <div className="space-y-4 relative z-10">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="text-xs font-black text-white uppercase tracking-widest">Powered by Mistral AI</p>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed font-medium">
              ShelfSmart is an intelligent grocery optimization platform that scans thousands of deals across Belgian stores to find you the absolute lowest prices.
            </p>
            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-white uppercase tracking-widest">Version 2.0.0</p>
                <p className="text-[9px] text-muted-foreground font-bold">Stable Android Build</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center">
                <Shield className="h-4 w-4 text-muted-foreground/40" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;
