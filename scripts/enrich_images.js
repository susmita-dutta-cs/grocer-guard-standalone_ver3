import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, "../public/data/db.json");

const SCRAPED_MAPPING = {
  "Bio Village Courgettes": "https://images.openfoodfacts.org/images/products/356/470/069/9991/front_fr.21.400.jpg",
  "Bio Village Zucchini": "https://images.openfoodfacts.org/images/products/356/470/069/9991/front_fr.21.400.jpg",
  "Campina Whole Milk": "https://static.ah.nl/dam/product/AHI_43545239353733303930?revLabel=2&rendition=800x800_JPG_Q90&fileType=binary",
  "Campina Semi-Skimmed Milk": "https://static.ah.nl/dam/product/AHI_43545239383733303639?revLabel=2&rendition=800x800_JPG_Q90&fileType=binary",
  "Heinz Ketchup": "https://static.ah.nl/dam/product/AHI_5433694332634932534e694570466255734e7a574467?revLabel=1&rendition=800x800_JPG_Q90&fileType=binary",
  "Coca-Cola": "https://static.ah.nl/dam/product/AHI_4354523130323037373634?revLabel=1&rendition=800x800_JPG_Q90&fileType=binary",
  "Barilla Spaghetti": "https://static.ah.nl/dam/product/AHI_4354523130313838323033?revLabel=1&rendition=800x800_JPG_Q90&fileType=binary",
  "AH Elstar": "https://static.ah.nl/dam/product/AHI_4354523130313031373033?revLabel=1&rendition=800x800_JPG_Q90&fileType=binary",
  "Boni Bananas": "https://images.openfoodfacts.org/images/products/540/014/152/9845/front_en.12.400.jpg",
  "Danone Yogurt": "https://static.ah.nl/dam/product/AHI_43545239393836343939?revLabel=1&rendition=800x800_JPG_Q90&fileType=binary",
  "Lay's Classic": "https://static.ah.nl/dam/product/AHI_325f5f756f505950517a4738496c4366693839625367?revLabel=1&rendition=800x800_JPG_Q90&fileType=binary",
  "Dreft": "https://static.ah.nl/dam/product/AHI_4c6b5844787a5674537571414a6a6241434a4d733867?revLabel=1&rendition=800x800_JPG_Q90&fileType=binary"
};

try {
  const db = JSON.parse(readFileSync(dbPath, "utf8"));
  let updatedCount = 0;

  db.products = db.products.map(product => {
    for (const [key, url] of Object.entries(SCRAPED_MAPPING)) {
      if (product.name.toLowerCase().includes(key.toLowerCase())) {
        product.image = url;
        updatedCount++;
        break;
      }
    }
    return product;
  });

  writeFileSync(dbPath, JSON.stringify(db, null, 2));
  console.log(`✅ Success! Updated ${updatedCount} products with real image URLs.`);
} catch (error) {
  console.error("❌ Error enrichment db.json:", error);
}
