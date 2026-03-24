import Link from "next/link";
import Button from "@/components/ui/Button";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 md:px-6 py-20 md:py-28 flex flex-col items-center text-center max-w-lg">
      <p className="text-7xl md:text-8xl font-black text-[var(--color-primary)]/30 mb-2">
        404
      </p>
      <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--color-foreground)] mb-3">
        Page not found
      </h1>
      <p className="text-slate-600 dark:text-slate-400 mb-10 leading-relaxed">
        The page you are looking for does not exist or has been moved. Try the
        shop home or browse all products.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        <Link href="/" className="w-full sm:w-auto">
          <Button fullWidth className="sm:w-auto" leftIcon={<Home className="h-5 w-5" />}>
            Back to home
          </Button>
        </Link>
        <Link href="/collections/all" className="w-full sm:w-auto">
          <Button
            variant="outline"
            fullWidth
            className="sm:w-auto"
            leftIcon={<Search className="h-5 w-5" />}
          >
            Shop all products
          </Button>
        </Link>
      </div>
    </div>
  );
}
