import { useState } from "react";
import { Mail, Lock, LogIn, ShoppingBasket, Sparkles } from "lucide-react";
import heroImage from "../assets/hero-groceries.png";

interface AuthScreenProps {
  onLogin: (email: string) => void;
}

const AuthScreen = ({ onLogin }: AuthScreenProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      onLogin(email);
      setIsSubmitting(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans pb-[var(--safe-area-bottom)]">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-secondary/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="w-full max-w-sm space-y-8 animate-scale-in relative z-10">
        <div className="text-center space-y-2">
          <div className="mx-auto h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-primary/5 animate-pulse" />
            <ShoppingBasket className="h-10 w-10 text-primary relative z-10 animate-float" />
          </div>
          <h1 className="text-4xl font-display font-black text-white tracking-tighter leading-none">ShelfSmart</h1>
          <p className="text-muted-foreground/60 text-xs font-medium uppercase tracking-[0.2em] mt-2 italic">Mastering the Cart</p>
        </div>

        <div className="bg-card/40 backdrop-blur-2xl border border-white/5 rounded-[32px] p-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary/20 via-primary to-primary/20" />
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground/40 ml-1">Email Terminal</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors duration-300" />
                <input 
                  type="email"
                  inputMode="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-background/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all placeholder:text-muted-foreground/30 shadow-inner"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground/40 ml-1">Secure Key</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors duration-300" />
                <input 
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-background/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all placeholder:text-muted-foreground/30 shadow-inner"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-primary-foreground font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:opacity-95 active:scale-95 transition-all disabled:opacity-50 shadow-xl shadow-primary/20 text-xs uppercase tracking-widest mt-4"
            >
              {isSubmitting ? (
                <div className="h-5 w-5 border-[3px] border-primary-foreground/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Initialize Session
                </>
              )}
            </button>
          </form>

          <button 
            type="button"
            onClick={() => onLogin("guest@shelfsmart.local")}
            className="w-full text-center mt-8 text-[10px] uppercase tracking-[0.3em] font-black text-muted-foreground/40 hover:text-primary transition-colors active:scale-95"
          >
            Enter as Guest
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 px-6 py-4 bg-white/5 border border-white/5 rounded-[24px] backdrop-blur-md">
          <Sparkles className="h-4 w-4 text-primary animate-pulse" />
          <p className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground/60">Mistral AI Engine Integrated</p>
        </div>
      </div>
    </div>
      </div>
    </div>
  );
};

export default AuthScreen;
