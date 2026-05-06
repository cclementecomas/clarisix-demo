// ─── Product Mapping (Brand/Category/Subcategory/Tag per SKU) ──────────────
// Joined with the Amazon catalog (inventoryData) to produce a full mapping
// view used by Settings → Products. SKUs without Brand or Category set fall
// back to "NA" in filters and breakdown tables, which is not useful.

export interface ProductMapping {
  sku: string;
  brand?: string;
  category?: string;
  subcategory?: string;
  tag?: string;
}

export type MappingStatus = 'complete' | 'partial' | 'needs-mapping';

export interface ProductMappingRow {
  sku: string;
  asin: string;
  title: string;
  brand: string;
  category: string;
  subcategory: string;
  tag: string;
  status: MappingStatus;
}

/**
 * A SKU is "mapped" when both Brand and Category are set.
 * "Partial" = both set but Subcategory or Tag missing (informational).
 */
export function getMappingStatus(m: { brand: string; category: string; subcategory: string; tag: string }): MappingStatus {
  const hasBrand = m.brand.trim().length > 0;
  const hasCategory = m.category.trim().length > 0;
  if (!hasBrand || !hasCategory) return 'needs-mapping';
  const hasSub = m.subcategory.trim().length > 0;
  const hasTag = m.tag.trim().length > 0;
  return hasSub && hasTag ? 'complete' : 'partial';
}

// Seed mappings — the 5 originally shown in the Data Mapping card.
// Aligned with the first 5 SKUs in inventoryData (SKU-001..SKU-005).
export const seedMappings: ProductMapping[] = [
  { sku: 'SKU-001', brand: 'ZeroWater', category: 'Home & Kitchen', subcategory: 'Water Filtration', tag: 'Bestseller' },
  { sku: 'SKU-002', brand: 'ZeroWater', category: 'Home & Kitchen', subcategory: 'Water Filtration', tag: 'Replenishable' },
  { sku: 'SKU-003', brand: 'Zamst',     category: 'Sports & Outdoors', subcategory: 'Braces & Supports', tag: 'New' },
  { sku: 'SKU-004', brand: 'BrightLife', category: 'Electronics', subcategory: 'Lighting', tag: '' },
  { sku: 'SKU-005', brand: 'ClearPath', category: 'Accessories', subcategory: 'Bags & Packs', tag: 'Seasonal' },
];

export const MAPPING_HEADERS = ['SKU', 'ASIN', 'Product Title', 'Brand', 'Category', 'Subcategory', 'Tag'];
