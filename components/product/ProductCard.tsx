import React from 'react';
import Link from 'next/link';
import Button from '../ui/Button';
import { ShoppingBag } from 'lucide-react';

interface ProductCardProps {
  handle: string;
  title: string;
  price: string;
  compareAtPrice?: string;
  imageUrl: string;
}

const ProductCard: React.FC<ProductCardProps> = ({ handle, title, price, compareAtPrice, imageUrl }) => {
  return (
    <div className="group flex flex-col bg-[var(--color-surface)] rounded-3xl p-3 md:p-4 border border-[var(--color-border)] hover:shadow-xl hover:shadow-[var(--color-primary)]/10 transition-all duration-300">
      
      {/* Image Container */}
      <Link href={`/products/${handle}`} className="relative aspect-square mb-4 overflow-hidden rounded-2xl bg-[var(--background)]">
        {/* We use a standard img tag for mockups. When real data is hooked up, we will use next/image */}
        <img 
          src={imageUrl} 
          alt={title}
          className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500 ease-in-out"
        />
        
        {/* Sale Badge */}
        {compareAtPrice && (
          <div className="absolute top-3 left-3 bg-[var(--color-accent)] text-white text-xs font-black tracking-wide px-3 py-1.5 rounded-full z-10 shadow-sm">
            SALE
          </div>
        )}
      </Link>
      
      {/* Content */}
      <div className="flex flex-col flex-grow text-center">
        <Link href={`/products/${handle}`} className="outline-none">
          <h3 className="text-[var(--color-foreground)] font-bold text-base md:text-lg mb-1 group-hover:text-[var(--color-primary)] transition-colors line-clamp-2">
            {title}
          </h3>
        </Link>
        <div className="flex items-center justify-center space-x-2 mt-auto mb-4">
          <span className="text-[var(--color-foreground)] font-extrabold text-lg">{price}</span>
          {compareAtPrice && (
            <span className="text-slate-400 text-sm font-semibold line-through block">{compareAtPrice}</span>
          )}
        </div>
        
        <Button 
          variant="primary" 
          fullWidth 
          leftIcon={<ShoppingBag size={18} />}
          className="mt-auto"
        >
          Add to Cart
        </Button>
      </div>
    </div>
  );
};

export default ProductCard;
