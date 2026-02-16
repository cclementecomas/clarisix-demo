// ─── Content Tracker Data ────────────────────────────────────────────────────

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const rand = seededRandom(77);

// ─── Types ──────────────────────────────────────────────────────────────────

export type MatchStatus = 'perfect' | 'partial' | 'mismatch';

export interface FieldComparison {
  field: string;
  similarity: number; // 0–100
  amazonContent: string;
  sourceContent: string;
  status: MatchStatus;
}

export interface ContentProduct {
  asin: string;
  marketplace: string;
  title: string;
  overallMatch: number;
  status: MatchStatus;
  fields: FieldComparison[];
  lastChecked: string;
}

export interface ContentKPI {
  label: string;
  value: string;
  rawValue: number;
  color: string;
  format?: 'number' | 'percent';
}

export interface FieldMatchRate {
  field: string;
  rate: number; // 0–100
  perfectCount: number;
  partialCount: number;
  mismatchCount: number;
  totalProducts: number;
}

export interface CaseBatch {
  batchNumber: number;
  asins: { asin: string; marketplace: string; overallMatch: number }[];
}

// ─── Reference data ─────────────────────────────────────────────────────────

const marketplaces = ['US', 'UK', 'DE', 'FR', 'IT', 'ES'];

const productTitles = [
  'Premium Wireless Earbuds with Noise Cancellation',
  'Organic Green Tea Matcha Powder 100g',
  'Stainless Steel Water Bottle 750ml',
  'Bamboo Cutting Board Set (3 Pack)',
  'LED Desk Lamp with USB Charging Port',
  'Memory Foam Travel Pillow - Ergonomic',
  'Natural Charcoal Teeth Whitening Powder',
  'Silicone Kitchen Utensil Set (12 Pieces)',
  'Portable Bluetooth Speaker Waterproof',
  'Vitamin D3 5000 IU Softgels (360 Count)',
  'Resistance Bands Set with Door Anchor',
  'Ceramic Coffee Mug with Lid 400ml',
  'Microfiber Cleaning Cloth Pack (24 Count)',
  'Adjustable Phone Stand for Desk',
  'Essential Oil Diffuser 300ml Ultrasonic',
  'Yoga Mat Non-Slip 6mm Thick',
  'USB-C Fast Charging Cable 2m (3 Pack)',
  'Stainless Steel Insulated Lunch Box',
  'Digital Kitchen Scale with Tare Function',
  'Reusable Grocery Bags Set of 6',
  'Wireless Charging Pad 15W Fast Charge',
  'Organic Cold-Pressed Coconut Oil 500ml',
  'Anti-Blue Light Computer Glasses',
  'Collapsible Silicone Food Storage Containers',
  'Smart Watch Band Compatible 42mm/44mm',
  'Activated Charcoal Face Mask (6 Pack)',
  'Ergonomic Keyboard Wrist Rest Pad',
  'Stainless Steel French Press 1L',
  'Biodegradable Phone Case - Clear',
  'Hair Growth Serum with Biotin 60ml',
  'Car Phone Mount Magnetic Dashboard',
  'Organic Turmeric Curcumin Capsules (120)',
  'Foldable Laptop Stand Aluminum',
  'Beeswax Food Wraps Assorted (3 Pack)',
  'Adjustable Dumbbell Set 20kg',
  'Bamboo Toothbrush Set (4 Pack)',
  'Insulated Wine Tumbler 350ml',
  'Digital Meat Thermometer Instant Read',
  'Meditation Cushion Round Buckwheat Fill',
  'Portable Jump Starter 12000mAh',
];

const bulletTemplates = [
  ['High-quality materials for lasting durability', 'Premium grade construction ensures long-term use'],
  ['Easy to use with intuitive design', 'User-friendly design for effortless operation'],
  ['Compact and lightweight for portability', 'Lightweight compact form factor for easy transport'],
  ['Eco-friendly and sustainable manufacturing', 'Sustainably sourced eco-conscious production'],
  ['100% satisfaction guarantee with free returns', 'Backed by our hassle-free return policy'],
];

const descTemplates = [
  'Discover the perfect combination of quality and value with our {title}. Designed with premium materials and built to last, this product delivers exceptional performance for everyday use. Whether at home or on the go, you\'ll appreciate the thoughtful design and reliable construction.',
  'Introducing our {title} — the ultimate solution for modern living. Crafted with attention to detail and engineered for excellence, this product stands out from the competition. Join thousands of satisfied customers who have made the switch.',
  'Experience the difference with our {title}. Made from carefully selected materials and manufactured to the highest standards, this product offers unmatched quality at an affordable price. Perfect for gifting or treating yourself.',
];

// ─── Generate products ──────────────────────────────────────────────────────

const fieldNames = ['Product Title', 'Description', 'Bullet Point 1', 'Bullet Point 2', 'Bullet Point 3', 'Bullet Point 4', 'Bullet Point 5'];

function generateFieldComparisons(title: string): FieldComparison[] {
  return fieldNames.map((field) => {
    const r = rand();
    let similarity: number;
    // Weighted: ~40% perfect, ~35% partial, ~25% mismatch
    if (r < 0.40) {
      similarity = 95 + Math.round(rand() * 5);
    } else if (r < 0.75) {
      similarity = 70 + Math.round(rand() * 24);
    } else {
      similarity = 20 + Math.round(rand() * 49);
    }

    const status: MatchStatus = similarity >= 90 ? 'perfect' : similarity >= 70 ? 'partial' : 'mismatch';

    let amazonContent: string;
    let sourceContent: string;

    if (field === 'Product Title') {
      sourceContent = title;
      if (similarity >= 90) {
        amazonContent = title;
      } else if (similarity >= 70) {
        const words = title.split(' ');
        const dropCount = Math.max(1, Math.floor(words.length * 0.2));
        amazonContent = words.slice(0, words.length - dropCount).join(' ');
      } else {
        amazonContent = title.split(' ').slice(0, 3).join(' ') + ' - Updated Version';
      }
    } else if (field === 'Description') {
      const tpl = descTemplates[Math.floor(rand() * descTemplates.length)];
      sourceContent = tpl.replace('{title}', title);
      if (similarity >= 90) {
        amazonContent = sourceContent;
      } else {
        const sentences = sourceContent.split('. ');
        amazonContent = sentences.slice(0, Math.max(1, sentences.length - 1)).join('. ') + '.';
      }
    } else {
      const idx = parseInt(field.replace('Bullet Point ', '')) - 1;
      const tplPair = bulletTemplates[idx % bulletTemplates.length];
      sourceContent = tplPair[0];
      if (similarity >= 90) {
        amazonContent = tplPair[0];
      } else if (similarity >= 70) {
        amazonContent = tplPair[1];
      } else {
        amazonContent = tplPair[1].split(' ').slice(0, 3).join(' ') + '...';
      }
    }

    return { field, similarity, amazonContent, sourceContent, status };
  });
}

function generateProducts(): ContentProduct[] {
  const products: ContentProduct[] = [];
  const asins: string[] = [];

  for (let i = 0; i < 40; i++) {
    asins.push(`B0${String(Math.floor(rand() * 9000000 + 1000000)).slice(0, 7)}${String.fromCharCode(65 + Math.floor(rand() * 26))}${String.fromCharCode(65 + Math.floor(rand() * 26))}`);
  }

  for (let i = 0; i < 80; i++) {
    const asinIdx = i % 40;
    const asin = asins[asinIdx];
    const marketplace = marketplaces[Math.floor(rand() * marketplaces.length)];
    const titleIdx = asinIdx % productTitles.length;
    const title = productTitles[titleIdx];

    const fields = generateFieldComparisons(title);
    const overallMatch = Math.round(fields.reduce((s, f) => s + f.similarity, 0) / fields.length * 10) / 10;
    const status: MatchStatus = overallMatch >= 90 ? 'perfect' : overallMatch >= 70 ? 'partial' : 'mismatch';

    const daysAgo = Math.floor(rand() * 14);
    const date = new Date(2026, 1, 16 - daysAgo);
    const lastChecked = date.toISOString().split('T')[0];

    products.push({ asin, marketplace, title, overallMatch, status, fields, lastChecked });
  }

  return products;
}

export const contentProducts = generateProducts();

// ─── KPIs ───────────────────────────────────────────────────────────────────

const totalProducts = contentProducts.length;
const perfectMatches = contentProducts.filter((p) => p.status === 'perfect').length;
const partialMatches = contentProducts.filter((p) => p.status === 'partial').length;
const mismatchCount = contentProducts.filter((p) => p.status === 'mismatch').length;
const avgMatch = Math.round(contentProducts.reduce((s, p) => s + p.overallMatch, 0) / totalProducts * 10) / 10;

export const contentKPIs: ContentKPI[] = [
  { label: 'Total Products', value: totalProducts.toLocaleString(), rawValue: totalProducts, color: 'neutral' },
  { label: 'Perfect Match', value: perfectMatches.toLocaleString(), rawValue: perfectMatches, color: 'green' },
  { label: 'Partial Match', value: partialMatches.toLocaleString(), rawValue: partialMatches, color: 'yellow' },
  { label: 'Mismatch', value: mismatchCount.toLocaleString(), rawValue: mismatchCount, color: 'red' },
  { label: 'Avg Match Rate', value: `${avgMatch}%`, rawValue: avgMatch, color: avgMatch >= 85 ? 'green' : avgMatch >= 70 ? 'yellow' : 'red', format: 'percent' },
];

// ─── Field Match Rates ──────────────────────────────────────────────────────

export const fieldMatchRates: FieldMatchRate[] = fieldNames.map((field) => {
  const allFields = contentProducts.map((p) => p.fields.find((f) => f.field === field)!);
  const rate = Math.round(allFields.reduce((s, f) => s + f.similarity, 0) / allFields.length * 10) / 10;
  const perfectCount = allFields.filter((f) => f.status === 'perfect').length;
  const partialCount = allFields.filter((f) => f.status === 'partial').length;
  const mismatchCount = allFields.filter((f) => f.status === 'mismatch').length;
  return { field, rate, perfectCount, partialCount, mismatchCount, totalProducts };
});

// ─── Case Batches ───────────────────────────────────────────────────────────

export const caseBatches: CaseBatch[] = (() => {
  const needsCase = contentProducts
    .filter((p) => p.fields.some((f) => f.similarity < 90))
    .map((p) => ({ asin: p.asin, marketplace: p.marketplace, overallMatch: p.overallMatch }));

  const batches: CaseBatch[] = [];
  for (let i = 0; i < needsCase.length; i += 10) {
    batches.push({
      batchNumber: batches.length + 1,
      asins: needsCase.slice(i, i + 10),
    });
  }
  return batches;
})();

// ─── Marketplace breakdown ──────────────────────────────────────────────────

export interface MarketplaceBreakdown {
  marketplace: string;
  totalProducts: number;
  avgMatch: number;
  perfectCount: number;
  issueCount: number;
}

export const marketplaceBreakdown: MarketplaceBreakdown[] = (() => {
  const grouped: Record<string, ContentProduct[]> = {};
  contentProducts.forEach((p) => {
    if (!grouped[p.marketplace]) grouped[p.marketplace] = [];
    grouped[p.marketplace].push(p);
  });

  return Object.entries(grouped)
    .map(([mp, prods]) => ({
      marketplace: mp,
      totalProducts: prods.length,
      avgMatch: Math.round(prods.reduce((s, p) => s + p.overallMatch, 0) / prods.length * 10) / 10,
      perfectCount: prods.filter((p) => p.status === 'perfect').length,
      issueCount: prods.filter((p) => p.status !== 'perfect').length,
    }))
    .sort((a, b) => b.totalProducts - a.totalProducts);
})();
