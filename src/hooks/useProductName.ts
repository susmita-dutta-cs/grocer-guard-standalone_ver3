import { Product } from "../data/groceryData";
import { useI18n } from "./useI18n";

export function useProductName() {
  const { language } = useI18n();

  const getProductName = (product: Product) => {
    if (language === "nl") return product.name_nl || product.name;
    if (language === "fr") return product.name_fr || product.name;
    return product.name;
  };

  return { getProductName };
}
