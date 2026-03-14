import "dotenv/config";
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { GoogleGenerativeAI } from "@google/generative-ai";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Config ───────────────────────────────────────────────────────────────────
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const KIMBINO_BASE = "https://www.kimbino.be";

const STORES = [
  { id: "delhaize", name: "Delhaize", path: "/delhaize/" },
  { id: "aldi", name: "Aldi", path: "/aldi/" },
  { id: "lidl", name: "Lidl", path: "/lidl/" },
  { id: "carrefour", name: "Carrefour", path: "/carrefour/" },
  { id: "colruyt", name: "Colruyt", path: "/colruyt/" },
  { id: "albert-heijn", name: "Albert Heijn", path: "/albert-heijn/" },
];

// Initialize Gemini
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// ─── Extraction Prompt ────────────────────────────────────────────────────────
const EXTRACTION_PROMPT = `You are a grocery promotion data extractor for Belgian supermarkets. You will receive an image from a promotional folder/flyer. Your job is to extract EVERY single product promotion visible on the page.

CRITICAL INSTRUCTIONS:
- Look at EVERY product on the page, even small ones in corners or partially visible
- Read ALL text: product names, brands, prices, weights, discount labels, validity dates
- Pay close attention to price tags, red/yellow discount stickers, "1+1", "2de -50%", etc.
- Extract the EXACT brand name as printed (e.g. "Boni Selection", "Everyday", "Danone", "Coca-Cola")
- Extract the EXACT quantity/weight as printed (e.g. "1,5 kg", "500 g", "6 x 33 cl", "per stuk", "per kg")
- Extract both the promotional price AND original price when visible
- Note the discount type exactly as shown (e.g. "1+1 gratis", "2de aan -50%", "€1 korting", "-25%", "2 voor €3")
- Look for validity dates (e.g. "geldig van 03/03 tot 09/03")

Return a JSON array of objects with these fields:
- product_name: the specific product name in Dutch as printed
- brand: the exact brand name as printed (null if not visible)
- quantity: the exact quantity/weight as printed (null if not visible)
- discount_type: the exact discount/promotion type as shown
- promo_price: the promotional/discounted price as a number (null if not available)
- original_price: the original/regular price as a number (null if not available)
- category: product category in English (e.g. "dairy", "meat", "vegetables", "fruit", "beverages", "bakery", "snacks", "household", "frozen", "other")
- valid_from: start date if visible in format "YYYY-MM-DD" (null if not visible)
- valid_until: end date if visible in format "YYYY-MM-DD" (null if not visible)

IMPORTANT: Extract EVERY product. A typical folder page has 4-12 products. If you find fewer than 3, look again carefully.
Only include food/grocery items. Skip non-food items.
Return ONLY the JSON array, no other text. If no promotions found, return [].`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function log(msg) {
  const time = new Date().toLocaleTimeString();
  console.log(`[${time}] ${msg}`);
}

async function fetchPage(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "nl-BE,nl;q=0.9,en;q=0.8",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return await res.text();
}

async function imageToPart(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buffer = await res.arrayBuffer();
  return {
    inlineData: {
      data: Buffer.from(buffer).toString("base64"),
      mimeType: "image/jpeg",
    },
  };
}

function extractPageImages(html) {
  const kimbinoRegex = /src="(https:\/\/eu\.kimbicdns\.com\/[^"]+\/(\d+)\.jpg[^"]*)"/g;
  const images = [];
  let match;
  while ((match = kimbinoRegex.exec(html)) !== null) {
    const pageNum = parseInt(match[2]);
    images.push({ url: match[1], page: pageNum });
  }

  if (images.length === 0) {
    const imgRegex = /src="(https?:\/\/[^"]+\.(jpg|jpeg|png|webp)[^"]*)"/gi;
    let count = 0;
    while ((match = imgRegex.exec(html)) !== null) {
      const url = match[1];
      if (url.includes("page") || url.includes("folder") || url.includes("flyer") || url.includes("data")) {
        images.push({ url: url, page: count++ });
      }
    }
  }

  const seen = new Set();
  return images
    .filter((img) => {
      if (seen.has(img.url)) return false;
      seen.add(img.url);
      return true;
    })
    .sort((a, b) => a.page - b.page);
}

// Extract promotions using Gemini
async function extractFromImage(imagePart, pageNum, storeName) {
  const prompt = `Extract all grocery promotions from page ${pageNum} of this ${storeName} folder. ${EXTRACTION_PROMPT}`;
  
  const result = await model.generateContent([prompt, imagePart]);
  const response = await result.response;
  const reply = response.text() || "[]";

  const jsonMatch = reply.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    log(`    ⚠ No JSON found for page ${pageNum}`);
    return [];
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    log(`    ⚠ Failed to parse response for page ${pageNum}`);
    return [];
  }
}

// ─── Main Scraper ─────────────────────────────────────────────────────────────
async function scrapeStore(store) {
  log(`🚀 Starting ${store.name} folder scrape...`);
  
  let latestFolder = null;
  const storeUrl = `${KIMBINO_BASE}${store.path}`;
  log(`📄 Fetching Kimbino ${store.name} overview...`);
  const mainHtml = await fetchPage(storeUrl);

  const folderRegex = new RegExp(`href="(${store.path}[^"]*?folder[^"]*?)"`, "g");
  const matches = [];
  let match;
  while ((match = folderRegex.exec(mainHtml)) !== null) {
    matches.push(KIMBINO_BASE + match[1]);
  }
  
  if (matches.length > 0) latestFolder = matches[0];

  if (!latestFolder) {
    log(`❌ Could not find any ${store.name} folder links`);
    return [];
  }

  log(`📂 Found folder: ${latestFolder}`);
  const folderHtml = await fetchPage(latestFolder);
  const pageImages = extractPageImages(folderHtml);

  log(`  Found ${pageImages.length} folder pages`);
  if (pageImages.length === 0) return [];

  const allPromos = [];
  const maxPages = Math.min(pageImages.length, 3); // Limit to 3 pages for now

  for (let i = 0; i < maxPages; i++) {
    const img = pageImages[i];
    if (img.page === 0) continue;

    try {
      log(`  🖼️  Processing page ${img.page}...`);
      const imagePart = await imageToPart(img.url);
      const promos = await extractFromImage(imagePart, img.page, store.name);
      
      const promosWithStore = promos.map(p => ({
        ...p,
        store: store.id
      }));
      
      log(`    ✅ Found ${promosWithStore.length} promotions`);
      allPromos.push(...promosWithStore);
      await new Promise((r) => setTimeout(r, 1000));
    } catch (e) {
      log(`    ⚠ Error on page ${img.page}: ${e.message}`);
    }
  }

  return allPromos;
}

// ─── Entry Point ──────────────────────────────────────────────────────────────
async function main() {
  if (!GEMINI_API_KEY || GEMINI_API_KEY.trim() === "" || GEMINI_API_KEY.includes("your-")) {
    console.error("❌ GEMINI_API_KEY is missing!");
    process.exit(1);
  }

  try {
    const allStoresPromotions = [];
    for (const store of STORES) {
      try {
        const promos = await scrapeStore(store);
        allStoresPromotions.push(...promos);
      } catch (err) {
        console.error(`❌ Failed to scrape ${store.name}: ${err.message}`);
      }
    }

    // Merge into db.json
    const dbPath = join(__dirname, "public", "data", "db.json");
    if (!existsSync(dbPath)) {
      console.error("❌ db.json not found! Run seed.js first.");
      process.exit(1);
    }

    const db = JSON.parse(readFileSync(dbPath, "utf-8"));
    log(`📝 Merging ${allStoresPromotions.length} promotions into db.json...`);

    let matchedCount = 0;
    for (const promo of allStoresPromotions) {
      // Find a matching product by name (fuzzy matching would be better, but let's start simple)
      const product = db.products.find(p => 
        p.name.toLowerCase().includes(promo.product_name.toLowerCase()) ||
        promo.product_name.toLowerCase().includes(p.name.toLowerCase())
      );

      if (product) {
        matchedCount++;
        const storePrice = product.prices.find(pr => pr.storeId === promo.store);
        if (storePrice) {
          storePrice.price = promo.promo_price || storePrice.price;
          storePrice.onSale = true;
          storePrice.promo_details = {
            discount_type: promo.discount_type,
            valid_until: promo.valid_until
          };
        } else {
          product.prices.push({
            storeId: promo.store,
            price: promo.promo_price || 0,
            onSale: true,
            promo_details: {
                discount_type: promo.discount_type,
                valid_until: promo.valid_until
            }
          });
        }
      }
    }

    db.scraped_at = new Date().toISOString();
    writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf-8");
    log(`✅ Saved matched promotions to db.json (${matchedCount} matched)`);

  } catch (e) {
    console.error(`\n❌ Scrape process failed: ${e.message}`);
    process.exit(1);
  }
}

main();
