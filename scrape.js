import "dotenv/config";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Config ───────────────────────────────────────────────────────────────────
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const KIMBINO_BASE = "https://www.kimbino.be";

const STORES = [
  { id: "delhaize", name: "Delhaize", path: "/delhaize/" },
  { id: "aldi", name: "Aldi", path: "/aldi/" },
  { id: "lidl", name: "Lidl", path: "/lidl/" },
  { id: "carrefour", name: "Carrefour", path: "/carrefour/" },
  { id: "colruyt", name: "Colruyt", path: "/colruyt/" },
  { id: "albert-heijn", name: "Albert Heijn", path: "/albert-heijn/" },
];

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

// Download image and convert to base64
async function imageToBase64(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buffer = await res.arrayBuffer();
  return Buffer.from(buffer).toString("base64");
}

// Extract folder page image URLs from Kimbino HTML
function extractPageImages(html) {
  // Regex for Kimbino CDN images
  const kimbinoRegex = /src="(https:\/\/eu\.kimbicdns\.com\/[^"]+\/(\d+)\.jpg[^"]*)"/g;
  const images = [];
  let match;
  while ((match = kimbinoRegex.exec(html)) !== null) {
    const pageNum = parseInt(match[2]);
    images.push({ url: match[1], page: pageNum });
  }

  // Fallback: Look for any high-res images that might be folder pages
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

  // Deduplicate by URL and sort
  const seen = new Set();
  return images
    .filter((img) => {
      if (seen.has(img.url)) return false;
      seen.add(img.url);
      return true;
    })
    .sort((a, b) => a.page - b.page);
}

// Extract promotions from a single page image using Groq vision
async function extractFromImage(imageBase64, pageNum, storeName) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.2-11b-vision-preview",
      messages: [
        { role: "system", content: EXTRACTION_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Extract all grocery promotions from page ${pageNum} of this ${storeName} folder. Look carefully at every product, price, and discount label.`,
            },
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
            },
          ],
        },
      ],
      temperature: 0.1,
      max_tokens: 4000,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq error [${res.status}]: ${err}`);
  }

  const data = await res.json();
  const reply = data.choices?.[0]?.message?.content || "[]";

  const jsonMatch = reply.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    log(`    ⚠ No JSON found for page ${pageNum}: ${reply.substring(0, 150)}`);
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
  
  let latestFolder = store.directUrl || null;

  if (!latestFolder) {
    const storeUrl = `${KIMBINO_BASE}${store.path}`;
    // Step 1: Find the latest folder page URL
    log(`📄 Fetching Kimbino ${store.name} overview...`);
    const mainHtml = await fetchPage(storeUrl);

    // Find the most recent folder link
    const folderRegex = new RegExp(`href="(${store.path}[^"]*?folder[^"]*?)"`, "g");
    const matches = [];
    let match;
    while ((match = folderRegex.exec(mainHtml)) !== null) {
      matches.push(KIMBINO_BASE + match[1]);
    }
    
    // Pick the first one (usually the newest/next week)
    if (matches.length > 0) {
      latestFolder = matches[0];
    }

    if (!latestFolder) {
      // Fallback: try broader pattern
      const broadRegex = new RegExp(`href="(${store.path}[^"]*)"`, "gi");
      while ((match = broadRegex.exec(mainHtml)) !== null) {
        if (match[1].length > store.path.length + 5 && !match[1].includes("archief")) {
          latestFolder = KIMBINO_BASE + match[1];
          break;
        }
      }
    }
  }

  if (!latestFolder) {
    log(`❌ Could not find any ${store.name} folder links`);
    return [];
  }

  log(`📂 Found folder: ${latestFolder}`);

  // Step 2: Fetch the folder page to find page images
  log("📄 Fetching folder pages...");
  const folderHtml = await fetchPage(latestFolder);
  const pageImages = extractPageImages(folderHtml);

  log(`  Found ${pageImages.length} folder pages`);

  if (pageImages.length === 0) {
    log("❌ No folder page images found");
    return [];
  }

  // Step 3: Process each page image with vision AI
  const allPromos = [];
  const maxPages = Math.min(pageImages.length, 5); // Limit to 5 pages per store to prevent rate limits

  for (let i = 0; i < maxPages; i++) {
    const img = pageImages[i];
    // Skip cover page (page 0)
    if (img.page === 0) {
      log(`  ⏭ Skipping cover page`);
      continue;
    }

    try {
      log(`  🖼️  Processing page ${img.page}...`);
      const base64 = await imageToBase64(img.url);
      log(`    Downloaded (${Math.round(base64.length / 1024)}KB)`);

      const promos = await extractFromImage(base64, img.page, store.name);
      
      // Add store data to each promo
      const promosWithStore = promos.map(p => ({
        ...p,
        store: store.id
      }));
      
      log(`    ✅ Found ${promosWithStore.length} promotions`);
      allPromos.push(...promosWithStore);

      // Rate limit between API calls
      await new Promise((r) => setTimeout(r, 2000));
    } catch (e) {
      log(`    ⚠ Error on page ${img.page}: ${e.message}`);
      // If rate limited, wait longer
      if (e.message.includes("429")) {
        log(`    ⏳ Rate limited, waiting 30s...`);
        await new Promise((r) => setTimeout(r, 30000));
      }
    }
  }

  log(`\n✅ Total: ${allPromos.length} promotions extracted from ${maxPages} pages`);
  return allPromos;
}

// ─── Entry Point ──────────────────────────────────────────────────────────────
async function main() {
  if (!GROQ_API_KEY || GROQ_API_KEY.includes("your-")) {
    console.error("❌ Please set your GROQ_API_KEY in the .env file");
    console.error("   Get a free key at: https://console.groq.com/keys");
    process.exit(1);
  }

  try {
    const allStoresPromotions = [];
    
    // Scrape all stores sequentially
    for (const store of STORES) {
      try {
        const promos = await scrapeStore(store);
        allStoresPromotions.push(...promos);
      } catch (err) {
        console.error(`❌ Failed to scrape ${store.name}: ${err.message}`);
      }
      
      // Delay between stores
      await new Promise((r) => setTimeout(r, 5000));
    }

    // Save results
    const dataDir = join(__dirname, "data");
    if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });

    const outputPath = join(dataDir, "promotions.json");
    const output = {
      scraped_at: new Date().toISOString(),
      stores_scraped: STORES.map(s => s.id),
      total_promotions: allStoresPromotions.length,
      promotions: allStoresPromotions,
    };

    writeFileSync(outputPath, JSON.stringify(output, null, 2), "utf-8");
    log(`💾 Saved ${allStoresPromotions.length} total promotions to ${outputPath}`);

    // Print summary
    console.log("\n═══════════════════════════════════════");
    console.log(`  🛒 Overall Promotions: ${allStoresPromotions.length} items from ${STORES.length} stores`);
    console.log("═══════════════════════════════════════");
    for (const p of allStoresPromotions.slice(0, 15)) {
      const price = p.promo_price ? `€${p.promo_price}` : p.discount_type || "—";
      console.log(`  • [${p.store.toUpperCase()}] ${p.product_name} ${p.brand ? `(${p.brand})` : ""} → ${price}`);
    }
    if (allStoresPromotions.length > 15) {
      console.log(`  ... and ${allStoresPromotions.length - 15} more across all stores`);
    }
    console.log("═══════════════════════════════════════\n");
  } catch (e) {
    console.error(`\n❌ Scrape process failed: ${e.message}`);
    process.exit(1);
  }
}

main();
