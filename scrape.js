import "dotenv/config";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Config ───────────────────────────────────────────────────────────────────
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const KIMBINO_BASE = "https://www.kimbino.be";
const DELHAIZE_URL = `${KIMBINO_BASE}/delhaize/`;

// ─── Extraction Prompt ────────────────────────────────────────────────────────
const EXTRACTION_PROMPT = `You are a grocery promotion data extractor for Belgian supermarkets. You will receive text content scraped from a Delhaize promotional folder page. Your job is to extract EVERY single product promotion visible.

CRITICAL INSTRUCTIONS:
- Look at EVERY product mentioned, even small references
- Read ALL text: product names, brands, prices, weights, discount labels, validity dates
- Pay close attention to price tags, discount stickers, "1+1", "2de -50%", etc.
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

IMPORTANT: Extract EVERY product mentioned. Only include food/grocery items.
Return ONLY the JSON array, no other text. If no promotions found, return [].`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function log(msg) {
  const time = new Date().toLocaleTimeString();
  console.log(`[${time}] ${msg}`);
}

function stripHtml(html) {
  // Remove script and style tags with their content
  let text = html.replace(/<script[\s\S]*?<\/script>/gi, "");
  text = text.replace(/<style[\s\S]*?<\/style>/gi, "");
  // Replace block-level tags with newlines
  text = text.replace(/<(br|p|div|h[1-6]|li|tr)[^>]*>/gi, "\n");
  // Remove all other tags
  text = text.replace(/<[^>]+>/g, " ");
  // Decode common HTML entities
  text = text.replace(/&euro;/g, "€").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
  text = text.replace(/&nbsp;/g, " ").replace(/&#8364;/g, "€").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(n));
  // Collapse whitespace
  text = text.replace(/[ \t]+/g, " ");
  text = text.replace(/\n\s*\n/g, "\n");
  return text.trim();
}

async function fetchPage(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "nl-BE,nl;q=0.9,en;q=0.8",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return await res.text();
}

async function extractWithOpenAI(content) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: EXTRACTION_PROMPT },
        {
          role: "user",
          content: `Extract all grocery promotions from this Delhaize folder content:\n\n${content.substring(0, 15000)}`,
        },
      ],
      temperature: 0.1,
      max_tokens: 8000,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI error [${res.status}]: ${err}`);
  }

  const data = await res.json();
  const reply = data.choices?.[0]?.message?.content || "[]";

  const jsonMatch = reply.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    log(`  ⚠ No JSON array in AI response: ${reply.substring(0, 200)}`);
    return [];
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    log(`  ⚠ Failed to parse AI response`);
    return [];
  }
}

// ─── Main Scraper ─────────────────────────────────────────────────────────────
async function scrapeDelhaize() {
  log("🚀 Starting Delhaize folder scrape...");

  // Step 1: Fetch the main Kimbino Delhaize page to find folder links
  log("📄 Fetching Kimbino Delhaize page...");
  const mainHtml = await fetchPage(DELHAIZE_URL);
  log(`  Got ${mainHtml.length} bytes of HTML`);

  // Step 2: Extract folder sub-page links from the HTML
  const folderLinkRegex = /href="(\/delhaize\/delhaize-folder[^"]*?)"/g;
  const folderLinks = new Set();
  let match;
  while ((match = folderLinkRegex.exec(mainHtml)) !== null) {
    folderLinks.add(KIMBINO_BASE + match[1]);
  }

  // Also try broader pattern for any Delhaize folder links
  const broadRegex = /href="(\/delhaize\/[^"]*folder[^"]*?)"/gi;
  while ((match = broadRegex.exec(mainHtml)) !== null) {
    folderLinks.add(KIMBINO_BASE + match[1]);
  }

  log(`  Found ${folderLinks.size} folder link(s)`);

  // Step 3: Scrape all found pages + the main page
  let allText = stripHtml(mainHtml);
  log(`  Main page text: ${allText.length} chars`);

  for (const link of folderLinks) {
    try {
      log(`  📄 Fetching ${link}...`);
      const html = await fetchPage(link);
      const text = stripHtml(html);
      if (text.length > 100) {
        allText += `\n\n--- PAGE: ${link} ---\n${text}`;
        log(`    Got ${text.length} chars`);
      }
      // Rate limit
      await new Promise((r) => setTimeout(r, 500));
    } catch (e) {
      log(`    ⚠ Failed: ${e.message}`);
    }
  }

  if (allText.length < 200) {
    log("❌ Not enough content found. Exiting.");
    return [];
  }

  log(`📝 Total scraped text: ${allText.length} chars`);

  // Step 4: Extract promotions with OpenAI
  log("🤖 Extracting promotions with OpenAI GPT-4o...");
  const promos = await extractWithOpenAI(allText);
  log(`✅ Extracted ${promos.length} promotions!`);

  return promos;
}

// ─── Entry Point ──────────────────────────────────────────────────────────────
async function main() {
  if (!OPENAI_API_KEY || OPENAI_API_KEY.includes("your-")) {
    console.error("❌ Please set your OPENAI_API_KEY in the .env file");
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
