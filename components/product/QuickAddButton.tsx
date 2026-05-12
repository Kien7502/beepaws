"use client";

import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import type { Product } from "@/types/shopify";
import Button from "@/components/ui/Button";
import QuickAddModal from "./QuickAddModal";

export default function QuickAddButton({ product }: { product: Product }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="primary"
        fullWidth
        leftIcon={<ShoppingBag size={18} />}
        className="mt-auto min-h-[44px]"
        onClick={(e) => {
          e.preventDefault();
          setOpen(true);
        }}
      >
        Add to Cart
      </Button>
      {open && (
        <QuickAddModal
          product={product}
          open={open}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
