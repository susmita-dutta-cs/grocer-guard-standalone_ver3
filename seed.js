import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STORES = ["aldi", "albert-heijn", "carrefour", "colruyt", "lidl", "delhaize"];

// Price ranges by category [min, max] in EUR
const PRICE_RANGES = {
  "Fruits & Vegetables": [0.49, 6.99],
  "Dairy & Eggs": [0.59, 8.99],
  "Meat & Seafood": [1.99, 24.99],
  "Bakery": [0.69, 5.99],
  "Pantry": [0.39, 12.99],
  "Beverages": [0.29, 9.99],
  "Snacks": [0.79, 7.99],
  "Frozen": [1.49, 12.99],
  "Household": [0.99, 14.99],
  "Personal Care": [0.99, 12.99],
};

const STORE_MULTIPLIERS = {
  aldi: [0.85, 0.95],
  lidl: [0.84, 0.94],
  colruyt: [0.90, 1.00],
  carrefour: [0.95, 1.08],
  "albert-heijn": [0.98, 1.12],
  delhaize: [1.00, 1.15],
};

const BRANDS = {
  "Fruits & Vegetables": ["Bio Village", "Nature's Best", "Green Garden", "Farm Fresh", "Everyday", "Boni", "365", "AH Bio", "Carrefour Bio", "Colruyt Eco", "Local Harvest", "Sun Ripe", "Golden Fields"],
  "Dairy & Eggs": ["Campina", "Danone", "Alpro", "Boni", "Everyday", "AH", "Président", "Philadelphia", "Arla", "Milka", "Zottegem", "Lactel", "Vache Bleue", "Bridel", "Elle & Vire"],
  "Meat & Seafood": ["Boni", "Everyday", "Imperial", "Herta", "Aoste", "Come a Casa", "Père Dodu", "Fleury Michon", "AH", "Farm Fresh", "North Sea", "Ocean Best", "Belgian Farms"],
  "Bakery": ["Harry's", "Jacquet", "Boni", "Everyday", "AH", "Délifrance", "Pain Quotidien", "Colruyt", "Golden Crust", "La Boulangère", "Vandemoortele"],
  "Pantry": ["Heinz", "Barilla", "De Cecco", "Boni", "Everyday", "AH", "Knorr", "Maggi", "Devos Lemmens", "Uncle Ben's", "Buitoni", "Panzani", "Lotus", "Calvé", "Lesieur"],
  "Beverages": ["Coca-Cola", "Pepsi", "Spa", "Chaudfontaine", "Lipton", "Fuze Tea", "Fanta", "Tropicana", "Innocent", "AH", "Boni", "Everyday", "Schweppes", "Red Bull", "Capri-Sun"],
  "Snacks": ["Lay's", "Doritos", "Pringles", "Côte d'Or", "Leonidas", "LU", "Lotus", "Boni", "Everyday", "AH", "Liga", "Sultana", "Griesson", "Chio"],
  "Frozen": ["Iglo", "McCain", "Dr. Oetker", "Boni", "Everyday", "AH", "Come a Casa", "Marie", "Findus", "Magnum", "Ben & Jerry's", "Häagen-Dazs"],
  "Household": ["Dreft", "Vanish", "Cillit Bang", "Ajax", "Cif", "Swiffer", "Boni", "Everyday", "AH", "Scottex", "Lotus", "Fairy", "Sun", "Finish"],
  "Personal Care": ["Dove", "Nivea", "Gillette", "Oral-B", "Colgate", "Head & Shoulders", "Boni", "Everyday", "AH", "Sanex", "Dettol", "Always", "Pampers"],
};

const PRODUCTS_DATA = {
    "Fruits & Vegetables": {
      names: ["Red Apples", "Green Apples", "Pink Lady Apples", "Granny Smith Apples", "Fuji Apples", "Royal Gala Apples", "Bananas", "Organic Bananas", "Baby Bananas", "Plantains", "Oranges", "Blood Oranges", "Navel Oranges", "Mandarins", "Clementines", "Tangerines", "Satsumas", "Lemons", "Limes", "Grapefruit", "Pomelo", "Strawberries", "Blueberries", "Raspberries", "Blackberries", "Cranberries", "Redcurrants", "Gooseberries", "Grapes Red", "Grapes White", "Grapes Black", "Watermelon", "Cantaloupe", "Honeydew Melon", "Galia Melon", "Pineapple", "Mango", "Papaya", "Kiwi", "Passion Fruit", "Dragon Fruit", "Lychee", "Pomegranate", "Peaches", "Nectarines", "Plums", "Apricots", "Cherries", "Figs", "Pears Conference", "Pears Williams", "Pears Doyenné", "Avocado", "Avocado Hass", "Avocado Ready-to-Eat", "Tomatoes", "Cherry Tomatoes", "Plum Tomatoes", "Beef Tomatoes", "Vine Tomatoes", "Sun-dried Tomatoes", "Cucumber", "Mini Cucumbers", "Bell Pepper Red", "Bell Pepper Yellow", "Bell Pepper Green", "Bell Pepper Orange", "Mixed Bell Peppers", "Chili Peppers Red", "Chili Peppers Green", "Jalapeños", "Habanero Peppers", "Onions Yellow", "Onions Red", "Onions White", "Spring Onions", "Shallots", "Leek", "Garlic", "Garlic Peeled", "Ginger", "Potatoes", "Baby Potatoes", "Sweet Potatoes", "Baking Potatoes", "Red Potatoes", "Carrots", "Baby Carrots", "Parsnips", "Turnips", "Beetroot", "Celeriac", "Radishes", "Broccoli", "Cauliflower", "Brussels Sprouts", "Cabbage White", "Cabbage Red", "Savoy Cabbage", "Lettuce Iceberg", "Lettuce Romaine", "Lettuce Butterhead", "Lettuce Little Gem", "Mixed Salad Leaves", "Spinach Fresh", "Baby Spinach", "Rocket (Arugula)", "Kale", "Chard", "Courgettes (Zucchini)", "Aubergine (Eggplant)", "Asparagus Green", "Asparagus White", "Green Beans", "Sugar Snap Peas", "Mange Tout", "Mushrooms White", "Mushrooms Chestnut", "Mushrooms Portobello", "Shiitake Mushrooms", "Oyster Mushrooms", "Corn on the Cob", "Baby Corn", "Fennel", "Artichoke", "Celery", "Pak Choi", "Bean Sprouts", "Fresh Herbs Basil", "Fresh Herbs Coriander", "Fresh Herbs Parsley", "Fresh Herbs Mint", "Fresh Herbs Rosemary", "Fresh Herbs Thyme", "Coconut Fresh", "Dates Fresh", "Rhubarb", "Mixed Fruit Bowl", "Prepared Fruit Salad", "Stir-Fry Vegetables Mix", "Soup Vegetables Mix", "Organic Carrots", "Organic Tomatoes", "Organic Spinach", "Organic Potatoes"],
      units: ["per kg", "per 500g", "per piece", "per bunch", "per pack", "per 250g", "per net"]
    },
    "Dairy & Eggs": {
      names: ["Whole Milk 1L", "Semi-Skimmed Milk 1L", "Skimmed Milk 1L", "Whole Milk 2L", "Semi-Skimmed Milk 2L", "Lactose-Free Milk 1L", "Chocolate Milk 1L", "Strawberry Milk 500ml", "Oat Milk 1L", "Almond Milk 1L", "Soy Milk 1L", "Coconut Milk 1L", "Rice Milk 1L", "Buttermilk 1L", "Kefir 500ml", "Acidophilus Milk 1L", "Butter Unsalted 250g", "Butter Salted 250g", "Butter Roll 500g", "Cooking Butter", "Margarine 500g", "Light Spread 500g", "Cream Cheese 200g", "Cream Cheese Light", "Cream Cheese Herbs", "Natural Yogurt 500g", "Greek Yogurt 500g", "Greek Yogurt 0%", "Skyr Natural", "Fruit Yogurt Strawberry", "Fruit Yogurt Peach", "Fruit Yogurt Blueberry", "Fruit Yogurt Mixed Berry", "Drinking Yogurt Natural", "Drinking Yogurt Strawberry", "Crème Fraîche 200ml", "Sour Cream 200ml", "Whipping Cream 250ml", "Cooking Cream 250ml", "Eggs Free Range 6", "Eggs Free Range 10", "Eggs Free Range 12", "Eggs Organic 6", "Eggs Organic 10", "Eggs Barn 12", "Eggs Large 15", "Quail Eggs 12", "Gouda Cheese Young 400g", "Gouda Cheese Matured 400g", "Gouda Cheese Old 400g", "Gouda Cheese Sliced", "Emmental Cheese 200g", "Gruyère Cheese 200g", "Comté Cheese 200g", "Cheddar Cheese Block", "Cheddar Cheese Sliced", "Cheddar Cheese Grated", "Mozzarella Ball 125g", "Mozzarella Grated 200g", "Mozzarella Burrata", "Parmesan Cheese 200g", "Parmesan Grated 100g", "Pecorino 150g", "Brie 200g", "Camembert 250g", "Blue Cheese 150g", "Roquefort 100g", "Feta Cheese 200g", "Halloumi 250g", "Ricotta 250g", "Mascarpone 250g", "Cheese Spread Plain", "Cheese Spread Herbs", "Cheese Cubes for Salad", "Cottage Cheese 200g", "Cottage Cheese Light", "Whipped Cream Spray 250ml", "Custard 500ml", "Chocolate Pudding 4-pack", "Rice Pudding 500g", "Panna Cotta 2-pack", "Tiramisu 2-pack", "Fresh Pasta Sheets", "Fresh Ravioli Ricotta", "Fresh Tortellini"],
      units: ["per piece", "per pack", "per 500g", "per liter", "per 200g", "per 250g", "per 125g", "per 400g"]
    },
    "Meat & Seafood": {
        names: ["Chicken Breast Fillet", "Chicken Thigh Fillet", "Chicken Drumsticks", "Chicken Wings", "Whole Chicken", "Chicken Minced 500g", "Chicken Satay Skewers", "Chicken Escalope", "Turkey Breast Fillet", "Turkey Minced 500g", "Turkey Escalope", "Turkey Leg", "Pork Chops", "Pork Tenderloin", "Pork Belly", "Pork Shoulder Roast", "Pork Minced 500g", "Pork Sausages 6-pack", "Pork Ribs", "Pork Escalope", "Beef Steak Sirloin", "Beef Steak Ribeye", "Beef Steak Filet Mignon", "Beef Minced 500g", "Beef Minced Lean 500g", "Beef Stewing Cubes", "Beef Roast", "Beef Burger Patties 4-pack", "Beef Tartare 200g", "Beef Carpaccio 100g", "Lamb Chops", "Lamb Leg Roast", "Lamb Minced 500g", "Lamb Shoulder", "Veal Escalope", "Veal Minced 500g", "Veal Stewing Cubes", "Mixed Minced Meat 500g", "Mixed Minced Meat 1kg", "Bacon Smoked 200g", "Bacon Unsmoked 200g", "Bacon Strips 150g", "Pancetta 100g", "Ham Sliced 200g", "Ham Cooked 200g", "Parma Ham 100g", "Serrano Ham 100g", "Salami Milano 150g", "Chorizo 200g", "Mortadella 150g", "Sausage Bratwurst 4-pack", "Sausage Merguez 6-pack", "Sausage Chipolata 8-pack", "Boudin Blanc 4-pack", "Boudin Noir 4-pack", "Salmon Fillet Fresh", "Salmon Fillet Smoked 100g", "Salmon Steak", "Cod Fillet Fresh", "Cod Fillet Frozen 400g", "Tuna Steak Fresh", "Shrimp Raw 200g", "Shrimp Cooked 200g", "Shrimp Cocktail", "Mussels Fresh 1kg", "Mussels Cooked 500g", "Sea Bass Fillet", "Sole Fillet", "Haddock Fillet", "Mackerel Fillet", "Trout Whole", "Sardines Fresh", "Crab Meat 200g", "Lobster Tail", "Scallops 200g", "Calamari Rings 300g", "Fish Fingers 10-pack", "Fish Cakes 4-pack", "Organic Chicken Breast", "Organic Beef Minced 500g", "Organic Pork Sausages", "Marinated Chicken Tikka", "Marinated Pork Souvlaki", "BBQ Chicken Drumsticks"],
        units: ["per kg", "per 500g", "per pack", "per piece", "per 200g", "per 100g", "per 4-pack"]
    },
    // Adding more abbreviated categories for brevity in first script write
    "Bakery": {
        names: ["White Bread Sliced", "Wholemeal Bread Sliced", "Multigrain Bread Sliced", "Sourdough Bread", "Rye Bread", "Baguette", "Croissants 4-pack", "Pain au Chocolat 4-pack", "Brioche", "Pita Bread 6-pack", "Tortilla Wraps 8-pack", "Bagels Sesame 4-pack", "Burger Buns 4-pack", "Pancakes 8-pack", "Waffles Belgian 4-pack", "Cake Chocolate", "Muffins Blueberry 4-pack", "Cookies Chocolate Chip 200g"],
        units: ["per piece", "per pack", "per loaf", "per 4-pack", "per 6-pack"]
    },
    "Pantry": {
        names: ["Spaghetti 500g", "Penne 500g", "Fusilli 500g", "Basmati Rice 1kg", "Jasmine Rice 1kg", "Flour All-Purpose 1kg", "Sugar White 1kg", "Olive Oil Extra Virgin 500ml", "Sunflower Oil 1L", "Tomato Sauce 500g", "Ketchup 500ml", "Mayonnaise 500ml", "Honey 350g", "Nutella 400g", "Peanut Butter 350g", "Jam Strawberry 450g", "Canned Tuna in Oil 200g", "Canned chickpeas 400g", "Coffee Ground 250g", "Tea Black 20 bags"],
        units: ["per pack", "per bottle", "per 500g", "per 1kg"]
    }
    // ... we can extend this or just use these to reach 5k via variants
};

function generatePrice(category) {
  const range = PRICE_RANGES[category] || [0.99, 9.99];
  const base = range[0] + Math.random() * (range[1] - range[0]);
  return Math.floor(base * 10) / 10 + 0.99;
}

function storePrice(basePrice, storeId) {
  const mult = STORE_MULTIPLIERS[storeId] || [0.95, 1.05];
  const factor = mult[0] + Math.random() * (mult[1] - mult[0]);
  return Math.round(basePrice * factor * 100) / 100;
}

async function main() {
  const targetTotal = 5000;
  const products = [];
  const categories = Object.keys(PRODUCTS_DATA);
  const variants = ["Small", "Medium", "Large", "XL", "Family Size", "Economy", "Value", "Premium", "Organic", "Light", "Extra", "Classic", "Original"];

  console.log(`🚀 Starting product generation (target: ${targetTotal})...`);

  let count = 0;
  outer: while (count < targetTotal) {
    for (const category of categories) {
      const { names, units } = PRODUCTS_DATA[category];
      const brands = BRANDS[category] || ["Generic"];
      
      for (const name of names) {
        for (const brand of brands) {
           // We'll add a variant if we need more
           const variant = count > 1000 ? variants[count % variants.length] : "";
           const fullName = `${brand} ${name} ${variant}`.trim();
           const unit = units[Math.floor(Math.random() * units.length)];
           
           const basePrice = generatePrice(category);
           const prices = STORES.map(storeId => ({
             storeId,
             price: storePrice(basePrice, storeId),
             onSale: Math.random() < 0.08
           }));

           products.push({
             id: `prod-${count}`,
             name: fullName,
             category,
             unit,
             image: "🛒",
             prices
           });

           count++;
           if (count >= targetTotal) break outer;
        }
      }
    }
  }

  const dataDir = join(__dirname, "public", "data");
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });

  const outputPath = join(dataDir, "db.json");
  writeFileSync(outputPath, JSON.stringify({ products, generated_at: new Date().toISOString() }, null, 2));

  console.log(`✅ Success! Generated ${products.length} products to ${outputPath}`);
}

main();
