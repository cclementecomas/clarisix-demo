import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Which identifier leads wherever a product is shown. 'asin' = Amazon's product id
// (default, current behaviour); 'sku' = the seller's own code. Applied live everywhere
// both are visible: the chosen one goes primary, the other drops to a muted secondary.
export type ProductId = 'asin' | 'sku';

export const PRODUCT_ID_LABEL: Record<ProductId, string> = { asin: 'ASIN', sku: 'SKU' };

interface ProductIdContextType {
  productId: ProductId;
  setProductId: (id: ProductId) => void;
  /** Order an (asin, sku) pair by the active preference. `secondary` is null when there's
   *  nothing to demote (only one id present, or both equal the primary). */
  resolve: (asin?: string | null, sku?: string | null) => {
    primary: string;
    secondary: string | null;
    primaryKind: 'ASIN' | 'SKU';
    secondaryKind: 'ASIN' | 'SKU';
  };
}

const ProductIdContext = createContext<ProductIdContextType | undefined>(undefined);

export function ProductIdProvider({ children }: { children: ReactNode }) {
  const [productId, setProductIdState] = useState<ProductId>(() => {
    const stored = localStorage.getItem('productId');
    return stored === 'sku' ? 'sku' : 'asin';
  });

  useEffect(() => {
    localStorage.setItem('productId', productId);
  }, [productId]);

  const resolve: ProductIdContextType['resolve'] = (asin, sku) => {
    const a = asin?.trim() || null;
    const s = sku?.trim() || null;
    if (productId === 'sku' && s) {
      return { primary: s, secondary: a, primaryKind: 'SKU', secondaryKind: 'ASIN' };
    }
    return { primary: a ?? s ?? '', secondary: a && s ? s : null, primaryKind: 'ASIN', secondaryKind: 'SKU' };
  };

  return (
    <ProductIdContext.Provider value={{ productId, setProductId: setProductIdState, resolve }}>
      {children}
    </ProductIdContext.Provider>
  );
}

export function useProductId(): ProductIdContextType {
  const ctx = useContext(ProductIdContext);
  if (!ctx) throw new Error('useProductId must be used within a ProductIdProvider');
  return ctx;
}
