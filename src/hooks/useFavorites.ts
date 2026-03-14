import { useState, useEffect } from "react";

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("favorites");
    if (saved) {
      try {
        setFavorites(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse favorites", e);
      }
    }
  }, []);

  const toggleFavorite = (productId: string) => {
    setFavorites(prev => {
      const next = prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId];
      localStorage.setItem("favorites", JSON.stringify(next));
      return next;
    });
  };

  const isFavorite = (productId: string) => favorites.includes(productId);

  return {
    favorites,
    toggleFavorite,
    isFavorite,
    favoritesCount: favorites.length
  };
}
