import { useState, useEffect, useMemo } from 'react'
import { Search, ShoppingBasket, Filter, ExternalLink, Calendar, RefreshCcw } from 'lucide-react'

interface Promotion {
  product_name: string;
  brand: string | null;
  quantity: string | null;
  discount_type: string;
  promo_price: number | null;
  original_price: number | null;
  category: string;
  valid_from: string | null;
  valid_until: string | null;
  store: string;
}

interface PromotionsData {
  scraped_at: string;
  stores_scraped: string[];
  total_promotions: number;
  promotions: Promotion[];
}

function App() {
  const [data, setData] = useState<PromotionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeStore, setActiveStore] = useState('all');

  useEffect(() => {
    fetch('/data/promotions.json')
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load promotions:', err);
        setLoading(false);
      });
  }, []);

  const filteredPromos = useMemo(() => {
    if (!data) return [];
    return data.promotions.filter(p => {
      const matchesSearch = p.product_name.toLowerCase().includes(search.toLowerCase()) ||
                          (p.brand && p.brand.toLowerCase().includes(search.toLowerCase()));
      const matchesStore = activeStore === 'all' || p.store === activeStore;
      return matchesSearch && matchesStore;
    });
  }, [data, search, activeStore]);

  const stores = ['all', ...(data?.stores_scraped || [])];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0c0e12' }}>
        <RefreshCcw className="animate-spin" size={48} color="#4f46e5" />
      </div>
    );
  }

  return (
    <>
      <header className="premium-header">
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div className="glass-panel" style={{ padding: '0.8rem', display: 'flex' }}>
              <ShoppingBasket size={32} color="#4f46e5" />
            </div>
          </div>
          <h1>GrocerySaver Premium</h1>
          <p>Smart promotion tracking for Belgian supermarkets</p>
          {data && (
            <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Last updated: {new Date(data.scraped_at).toLocaleString()} • {data.total_promotions} deals found
            </div>
          )}
        </div>
      </header>

      <main className="container">
        <div className="controls glass-panel" style={{ padding: '1.5rem', marginBottom: '3rem' }}>
          <div style={{ position: 'relative', flex: '1' }}>
            <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={20} />
            <input 
              type="text" 
              className="search-input" 
              style={{ paddingLeft: '3rem' }}
              placeholder="Search products or brands..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <Filter size={18} color="var(--text-muted)" style={{ marginRight: '0.5rem' }} />
            {stores.map(store => (
              <button 
                key={store}
                className={`filter-chip ${activeStore === store ? 'active' : ''}`}
                onClick={() => setActiveStore(store)}
              >
                {store.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="promo-grid">
          {filteredPromos.map((promo, idx) => (
            <div key={`${promo.store}-${idx}`} className="promo-card glass-panel animate-fade-in" style={{ animationDelay: `${(idx % 12) * 0.05}s`, position: 'relative' }}>
              <div className="promo-badge">{promo.discount_type}</div>
              <div className="promo-content">
                <div className="promo-store">{promo.store}</div>
                <h3 className="promo-title">{promo.product_name}</h3>
                {promo.brand && <div className="promo-brand">{promo.brand}</div>}
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  <Calendar size={14} />
                  <span>
                    {promo.valid_until ? `Until ${new Date(promo.valid_until).toLocaleDateString()}` : 'Validity unknown'}
                  </span>
                </div>
              </div>

              <div className="promo-footer">
                <div className="promo-price-group">
                  {promo.promo_price ? (
                    <>
                      <span className="promo-price">€{promo.promo_price.toFixed(2)}</span>
                      {promo.original_price && <span className="promo-old-price">€{promo.original_price.toFixed(2)}</span>}
                    </>
                  ) : (
                    <span className="promo-price" style={{ fontSize: '1rem', color: 'var(--secondary)' }}>{promo.discount_type}</span>
                  )}
                  {promo.quantity && <span className="promo-quantity">{promo.quantity}</span>}
                </div>
                
                <button style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}>
                  <ExternalLink size={20} />
                </button>
              </div>
            </div>
          ))}

          {filteredPromos.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '5rem 0', color: 'var(--text-muted)' }}>
              <RefreshCcw size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
              <p>No promotions found matching your criteria.</p>
            </div>
          )}
        </div>
      </main>

      <footer style={{ marginTop: 'auto', padding: '3rem 1rem', textAlign: 'center', borderTop: '1px solid var(--card-border)', background: 'rgba(0,0,0,0.2)' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          © {new Date().getFullYear()} GrocerySaver Premium • Powered by AI Intelligence
        </p>
      </footer>
    </>
  )
}

export default App
