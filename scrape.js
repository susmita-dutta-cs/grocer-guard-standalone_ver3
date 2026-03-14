import "dotenv/config";
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { Mistral } from "@mistralai/mistralai";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Config ───────────────────────────────────────────────────────────────────
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const KIMBINO_BASE = "https://www.kimbino.be";

const STORES = [
  { id: "delhaize", name: "Delhaize", path: "/delhaize/" },
  { id: "aldi", name: "Aldi", path: "/aldi/" },
  { id: "lidl", name: "Lidl", path: "/lidl/" },
  { id: "carrefour", name: "Carrefour", path: "/carrefour/" },
  { id: "colruyt", name: "Colruyt", path: "/colruyt/" },
  { id: "albert-heijn", name: "Albert Heijn", path: "/albert-heijn/" },
];

const client = new Mistral({ apiKey: MISTRAL_API_KEY });
const MODEL = "pixtral-large-latest"; // or pixtral-12b-2409

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

function extractPageImages(html) {
  const kimbinoRegex = /src="(https:\/\/eu\.kimbicdns\.com\/[^"]+\/(\d+)\.jpg[^"]*)"/g;
  const images = [];
  let match;
  while ((match = kimbinoRegex.exec(html)) !== null) {
    const pageNum = parseInt(match[2]);
    images.push({ url: match[1], page: pageNum });
  }
  return images.sort((a, b) => a.page - b.page);
}

// Extract promotions using Mistral Pixtral
async function extractFromImage(imageUrl, pageNum, storeName) {
  const prompt = `Extract all grocery promotions from page ${pageNum} of this ${storeName} folder. ${EXTRACTION_PROMPT}`;
  
  try {
    const chatResponse = await client.chat.complete({
      model: MODEL,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              imageUrl: imageUrl,
            },
          ],
        },
      ],
      responseFormat: { type: "json_object" }
    });

    const reply = chatResponse.choices[0].message.content || "[]";
    const jsonMatch = reply.match(/\[[\s\S]*\]/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    
    // Fallback if it returned an object with a products key etc
    const parsed = JSON.parse(reply);
    if (Array.isArray(parsed)) return parsed;
    if (parsed.promotions) return parsed.promotions;
    if (parsed.products) return parsed.products;

  } catch (e) {
    log(`      ⚠ Mistral failed on page ${pageNum}: ${e.message.split('\n')[0]}`);
  }
  return [];
}

// ─── Main Scraper ─────────────────────────────────────────────────────────────
async function scrapeStore(store) {
  log(`🚀 Starting ${store.name} folder scrape...`);
  
  const storeUrl = `${KIMBINO_BASE}${store.path}`;
  const mainHtml = await fetchPage(storeUrl);
  const folderRegex = new RegExp(`href="(${store.path}[^"]*?folder[^"]*?)"`, "g");
  const matches = [];
  let match;
  while ((match = folderRegex.exec(mainHtml)) !== null) {
    matches.push(KIMBINO_BASE + match[1]);
  }
  
  if (matches.length === 0) return [];
  const latestFolder = matches[0];

  log(`📂 Found folder: ${latestFolder}`);
  const folderHtml = await fetchPage(latestFolder);
  const pageImages = extractPageImages(folderHtml);

  log(`  Found ${pageImages.length} folder pages`);
  const allPromos = [];
  const maxPages = Math.min(pageImages.length, 3); // Limit to 3 pages per store

  for (let i = 0; i < maxPages; i++) {
    const img = pageImages[i];
    if (img.page === 0) continue;
    try {
      log(`  🖼️  Processing page ${img.page}...`);
      const promos = await extractFromImage(img.url, img.page, store.name);
      
      const promosWithStore = promos.map(p => ({ ...p, store: store.id }));
      log(`    ✅ Found ${promosWithStore.length} promotions`);
      allPromos.push(...promosWithStore);
      await new Promise((r) => setTimeout(r, 1000));
    } catch (e) {
      log(`    ⚠ Error on page ${img.page}: ${e.message}`);
    }
  }
  return allPromos;
}

async function main() {
  if (!MISTRAL_API_KEY) {
    console.error("❌ MISTRAL_API_KEY is missing in .env!");
    process.exit(1);
  }

  try {
    const allStoresPromotions = [];
    for (const store of STORES) {
      const promos = await scrapeStore(store);
      allStoresPromotions.push(...promos);
    }

    const dbPath = join(__dirname, "public", "data", "db.json");
    if (!existsSync(dbPath)) {
      console.error("❌ db.json not found! Run seed.js first.");
      process.exit(1);
    }

    const db = JSON.parse(readFileSync(dbPath, "utf-8"));
    log(`📝 Merging ${allStoresPromotions.length} promotions into db.json...`);

    let matchedCount = 0;
    for (const promo of allStoresPromotions) {
      const promoWords = promo.product_name.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      const product = db.products.find(p => {
        const pName = p.name.toLowerCase();
        const matchesBrand = promo.brand && pName.includes(promo.brand.toLowerCase());
        const matchesWords = promoWords.some(word => pName.includes(word));
        return matchesBrand || matchesWords;
      });
      if (product) {
        matchedCount++;
        const storePrice = product.prices.find(pr => pr.storeId === promo.store);
        if (storePrice) {
          storePrice.price = promo.promo_price || storePrice.price;
          storePrice.onSale = true;
          storePrice.promo_details = { 
            discount_type: promo.discount_type, 
            valid_until: promo.valid_until,
            original_product_name: promo.product_name 
          };
        }
      }
    }

    db.scraped_at = new Date().toISOString();
    writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf-8");
    log(`✅ Saved matched promotions to db.json (${matchedCount} matched)`);
  } catch (e) {
    console.error(`\n❌ Mistral Scrape process failed: ${e.message}`);
    process.exit(1);
  }
}

main();
