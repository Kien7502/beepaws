"use client";

import { useState } from "react";
import type { Product } from "@/types/shopify";
import Button from "@/components/ui/Button";
import { useCart } from "@/components/cart/CartProvider";

type Props = {
  currentProduct: Product;
  products: Product[];
};

function getPrimaryVariant(product: Product) {
  return product.variants.edges[0]?.node;
}

function formatMoney(amount: number, currencyCode: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode || "USD",
  }).format(amount);
}

export function BundleBuyCard({ currentProduct, products }: Props) {
  const [selected, setSelected] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(products.map((p) => [p.handle, true])),
  );
  const { addItem } = useCart();

  const currentVariant = getPrimaryVariant(currentProduct);
  const currencyCode = currentVariant?.price.currencyCode || "USD";

  const selectedProducts = products.filter((p) => selected[p.handle]);

  const total = (() => {
    const currentAmount = Number(currentVariant?.price.amount || 0);
    const bundleAmount = selectedProducts.reduce((sum, p) => {
      const v = getPrimaryVariant(p);
      return sum + Number(v?.price.amount || 0);
    }, 0);
    return currentAmount + bundleAmount;
  })();

  const canAdd = !!currentVariant?.availableForSale;

  function onAddSelected() {
    if (!currentVariant || !currentVariant.availableForSale) return;

    addItem({
      merchandiseId: currentVariant.id,
      productHandle: currentProduct.handle,
      productTitle: currentProduct.title,
      variantTitle: currentVariant.title,
      imageUrl: currentProduct.images.edges[0]?.node?.url || "/product-placeholder.svg",
      currencyCode: currentVariant.price.currencyCode,
      unitPriceAmount: currentVariant.price.amount,
      quantity: 1,
    });

    for (const product of selectedProducts) {
      const variant = getPrimaryVariant(product);
      if (!variant || !variant.availableForSale) continue;
      addItem({
        merchandiseId: variant.id,
        productHandle: product.handle,
        productTitle: product.title,
        variantTitle: variant.title,
        imageUrl: product.images.edges[0]?.node?.url || "/product-placeholder.svg",
        currencyCode: variant.price.currencyCode,
        unitPriceAmount: variant.price.amount,
        quantity: 1,
      });
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-[var(--color-border)]/80 bg-[var(--color-surface-2)] p-4">
      <p className="text-sm font-semibold text-[var(--color-foreground)]">
        Bundle suggestions
      </p>
      <ul className="mt-3 space-y-2">
        {products.map((product) => {
          const variant = getPrimaryVariant(product);
          const amount = Number(variant?.price.amount || 0);
          return (
            <li key={product.id} className="flex items-start gap-3">
              <input
                id={`bundle-${product.handle}`}
                type="checkbox"
                checked={!!selected[product.handle]}
                onChange={(e) =>
                  setSelected((prev) => ({
                    ...prev,
                    [product.handle]: e.target.checked,
                  }))
                }
                className="mt-1 h-4 w-4 rounded border-slate-300"
              />
              <label
                htmlFor={`bundle-${product.handle}`}
                className="min-h-[44px] flex-1 cursor-pointer text-sm text-slate-600 dark:text-slate-300"
              >
                <span className="block font-medium text-[var(--color-foreground)]">
                  {product.title}
                </span>
                <span>{formatMoney(amount, currencyCode)}</span>
              </label>
            </li>
          );
        })}
      </ul>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-[var(--color-foreground)]">
          Total: {formatMoney(total, currencyCode)}
        </p>
        <Button
          type="button"
          size="md"
          variant="primary"
          onClick={onAddSelected}
          disabled={!canAdd}
          className="min-h-[44px]"
        >
          Add selected bundle
        </Button>
      </div>
    </div>
  );
}
