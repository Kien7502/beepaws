"use client";

import { useState } from 'react';
import { Product } from '@/types/shopify';
import Button from '@/components/ui/Button';
import { ShoppingBag } from 'lucide-react';

export default function VariantSelector({ product }: { product: Product }) {
  // Simple state for first selected variant
  const [selectedVariant, setSelectedVariant] = useState(
    product.variants.edges[0]?.node
  );

  const isAvailable = selectedVariant?.availableForSale;

  const price = selectedVariant?.price 
    ? parseFloat(selectedVariant.price.amount) 
    : 0;

  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: selectedVariant?.price?.currencyCode || 'USD',
  }).format(price);

  return (
    <div className="flex flex-col space-y-6">
      <div className="text-3xl font-extrabold text-[var(--color-primary)]">
        {formattedPrice}
      </div>

      {product.variants.edges.length > 1 && (
        <div className="space-y-4">
          <h4 className="font-semibold text-[var(--color-foreground)]">Select Variant</h4>
          <div className="flex flex-wrap gap-2">
            {product.variants.edges.map(({ node }) => (
              <button
                key={node.id}
                onClick={() => setSelectedVariant(node)}
                className={`px-4 py-2 border-2 rounded-xl text-sm font-bold transition-all ${
                  selectedVariant?.id === node.id
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                    : 'border-[var(--color-border)] text-[var(--color-foreground)] hover:border-[var(--color-primary)]'
                }`}
              >
                {node.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add To Cart Form Region */}
      <div className="pt-4 border-t border-[var(--color-border)]">
        <Button 
          variant="primary" 
          size="lg" 
          fullWidth
          disabled={!isAvailable}
          leftIcon={<ShoppingBag size={20} />}
          className="min-h-[48px]"
        >
          {isAvailable ? 'Add to Cart' : 'Out of Stock'}
        </Button>
      </div>
    </div>
  );
}
