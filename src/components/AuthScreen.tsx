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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-primary/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-secondary/10 rounded-full blur-[100px]" />

      <div className="w-full max-w-sm space-y-8 animate-scale-in relative z-10">
        <div className="text-center space-y-2">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/15 flex items-center justify-center mb-4">
            <ShoppingBasket className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-display font-extrabold text-white tracking-tight">ShelfSmart</h1>
          <p className="text-muted-foreground text-sm">Sign in to track prices and save more</p>
        </div>

        <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50 opacity-50" />
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input 
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-background/50 border border-border/50 rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input 
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-background/50 border border-border/50 rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-primary/20 text-sm mt-4"
            >
              {isSubmitting ? (
                <div className="h-5 w-5 border-2 border-primary-foreground/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Sign In
                </>
              )}
            </button>
          </form>

          <button 
            type="button"
            onClick={() => onLogin("guest@shelfsmart.local")}
            className="w-full text-center mt-6 text-[10px] uppercase tracking-widest font-bold text-muted-foreground hover:text-primary transition-colors"
          >
            Continue as Guest
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 px-4 py-3 bg-muted/20 border border-border/30 rounded-2xl">
          <Sparkles className="h-3 w-3 text-primary" />
          <p className="text-[10px] text-muted-foreground">Local account session secured on your device</p>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
