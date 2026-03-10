import "dotenv/config";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Config ───────────────────────────────────────────────────────────────────
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;

const DELHAIZE_CONFIG = {
  url: "https://www.kimbino.be/delhaize/",
  waitFor: 5000,
  crawlLimit: 5,
  includePaths: ["/delhaize/delhaize-folder"],
};

// ─── Extraction Prompt ────────────────────────────────────────────────────────
const EXTRACTION_PROMPT = `You are a grocery promotion data extractor for Belgian supermarkets. You will receive content from a promotional folder/flyer. Your job is to extract EVERY single product promotion visible.

CRITICAL INSTRUCTIONS:
- Look at EVERY product, even small ones in corners or partially visible
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

IMPORTANT: Extract EVERY product. A typical folder page has 4-12 products.
Only include food/grocery items. Skip non-food items.
Return ONLY the JSON array, no other text. If no promotions found, return [].`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function log(msg) {
  const time = new Date().toLocaleTimeString();
  console.log(`[${time}] ${msg}`);
}

async function firecrawlScrape(url, formats = ["markdown"], waitFor = 3000) {
  const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      formats,
      onlyMainContent: true,
      waitFor,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Firecrawl scrape error: ${JSON.stringify(data)}`);
  return data.data || data;
}

async function firecrawlMap(url) {
  const res = await fetch("https://api.firecrawl.dev/v1/map", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      search: "bonus promotie korting aanbieding delhaize folder",
      limit: 30,
      includeSubdomains: false,
    }),
  });
  const data = await res.json();
  return data.links || [];
}

async function extractWithOpenAI(storeName, markdown, screenshot) {
  const messages = [{ role: "system", content: EXTRACTION_PROMPT }];

  const userContent = [];

  if (markdown && markdown.length > 100) {
    userContent.push({
      type: "text",
      text: `Extract grocery promotions from this ${storeName} weekly folder. Here is the text content:\n\n${markdown.substring(0, 15000)}`,
    });
  } else {
    userContent.push({
      type: "text",
      text: `Extract grocery promotions from this ${storeName} weekly folder image. Read all visible product names, prices, and discount labels.`,
    });
  }

  if (screenshot) {
    const imageUrl = screenshot.startsWith("http")
      ? screenshot
      : screenshot.startsWith("data:")
      ? screenshot
      : `data:image/png;base64,${screenshot}`;
    userContent.push({ type: "image_url", image_url: { url: imageUrl } });
  }

  messages.push({ role: "user", content: userContent });

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages,
      temperature: 0.1,
      max_tokens: 8000,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI error [${res.status}]: ${err}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || "[]";

  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    log(`  ⚠ No JSON array found in AI response: ${content.substring(0, 200)}`);
    return [];
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    log(`  ⚠ Failed to parse AI response: ${content.substring(0, 300)}`);
    return [];
  }
}

// ─── Main Scraper ─────────────────────────────────────────────────────────────
async function scrapeDelhaize() {
  log("🚀 Starting Delhaize folder scrape...");

  // Step 1: Scrape main page
  log("📄 Scraping main Delhaize promo page...");
  const mainPage = await firecrawlScrape(
    DELHAIZE_CONFIG.url,
    ["markdown", "screenshot"],
    DELHAIZE_CONFIG.waitFor
  );

  const mainMarkdown = mainPage.markdown || "";
  const mainScreenshot = mainPage.screenshot || undefined;
  log(`  Main page: ${mainMarkdown.length} chars markdown${mainScreenshot ? ", has screenshot" : ""}`);

  // Step 2: Find sub-pages via map
  let extraMarkdown = "";
  try {
    log("🗺️  Mapping sub-pages...");
    const allLinks = await firecrawlMap(DELHAIZE_CONFIG.url);
    const subPages = allLinks
      .filter((l) => {
        if (l === DELHAIZE_CONFIG.url) return false;
        return DELHAIZE_CONFIG.includePaths.some((p) => l.includes(p));
      })
      .slice(0, DELHAIZE_CONFIG.crawlLimit);

    log(`  Found ${subPages.length} sub-pages to scrape`);

    for (const subUrl of subPages) {
      try {
        log(`  📄 Scraping ${subUrl}...`);
        const subPage = await firecrawlScrape(subUrl, ["markdown"], 3000);
        const md = subPage.markdown || "";
        if (md.length > 50) {
          extraMarkdown += `\n\n---PAGE: ${subUrl}---\n${md}`;
          log(`    Got ${md.length} chars`);
        }
      } catch (e) {
        log(`    ⚠ Failed: ${e.message}`);
      }
      // Rate limit
      await new Promise((r) => setTimeout(r, 500));
    }
  } catch (e) {
    log(`  ⚠ Map failed, using main page only: ${e.message}`);
  }

  const fullMarkdown = mainMarkdown + extraMarkdown;

  if (fullMarkdown.length < 100 && !mainScreenshot) {
    log("❌ No content found. Exiting.");
    return [];
  }

  // Step 3: Extract promotions with OpenAI
  log("🤖 Extracting promotions with OpenAI GPT-4o...");
  const promos = await extractWithOpenAI("Delhaize", fullMarkdown, mainScreenshot);
  log(`✅ Extracted ${promos.length} promotions!`);

  return promos;
}

// ─── Entry Point ──────────────────────────────────────────────────────────────
async function main() {
  // Validate keys
  if (!OPENAI_API_KEY || OPENAI_API_KEY.includes("your-")) {
    console.error("❌ Please set your OPENAI_API_KEY in the .env file");
    process.exit(1);
  }
  if (!FIRECRAWL_API_KEY || FIRECRAWL_API_KEY.includes("your-")) {
    console.error("❌ Please set your FIRECRAWL_API_KEY in the .env file");
    process.exit(1);
  }

  try {
    const promotions = await scrapeDelhaize();

    // Save results
    const dataDir = join(__dirname, "data");
    if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });

    const outputPath = join(dataDir, "promotions.json");
    const output = {
      store: "delhaize",
      scraped_at: new Date().toISOString(),
      total_promotions: promotions.length,
      promotions,
    };

    writeFileSync(outputPath, JSON.stringify(output, null, 2), "utf-8");
    log(`💾 Saved ${promotions.length} promotions to ${outputPath}`);

    // Print summary
    console.log("\n═══════════════════════════════════════");
    console.log(`  🛒 Delhaize Promotions: ${promotions.length} items`);
    console.log("═══════════════════════════════════════");
    for (const p of promotions.slice(0, 10)) {
      const price = p.promo_price ? `€${p.promo_price}` : p.discount_type || "—";
      console.log(`  • ${p.product_name} ${p.brand ? `(${p.brand})` : ""} → ${price}`);
    }
    if (promotions.length > 10) {
      console.log(`  ... and ${promotions.length - 10} more`);
    }
    console.log("═══════════════════════════════════════\n");
  } catch (e) {
    console.error(`\n❌ Scrape failed: ${e.message}`);
    process.exit(1);
  }
}

main();
