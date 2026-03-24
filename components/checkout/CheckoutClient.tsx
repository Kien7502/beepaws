"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { MockCartLine } from "@/lib/mock-data";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { ArrowLeft, CheckCircle2, Lock, Package } from "lucide-react";

const SHIPPING_FLAT = 5.99;
const FREE_SHIPPING_THRESHOLD = 50;

function formatMoney(amount: number, currencyCode: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(amount);
}

type Props = {
  lines: MockCartLine[];
};

export default function CheckoutClient({ lines }: Props) {
  const [placed, setPlaced] = useState(false);

  const { subtotal, currencyCode, shipping, tax, total } = useMemo(() => {
    const code = lines[0]?.unitPrice.currencyCode ?? "USD";
    let sub = 0;
    for (const line of lines) {
      sub += parseFloat(line.unitPrice.amount) * line.quantity;
    }
    const ship = sub >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;
    const taxAmount = sub * 0.08;
    return {
      subtotal: sub,
      currencyCode: code,
      shipping: ship,
      tax: taxAmount,
      total: sub + ship + taxAmount,
    };
  }, [lines]);

  if (placed) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-16 md:py-24 max-w-lg text-center">
        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-10 md:p-12 shadow-lg">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-9 w-9" strokeWidth={2} />
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--color-foreground)] mb-3">
            Order placed (demo)
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
            This is a preview flow. When you connect Shopify Checkout or a real payment
            provider, orders will be processed there.
          </p>
          <Link href="/collections/all">
            <Button size="lg" fullWidth>
              Continue shopping
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-10 md:py-16">
      <Link
        href="/collections/all"
        className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)] hover:underline mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to shop
      </Link>

      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--color-foreground)] tracking-tight">
          Checkout
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Sample cart data so you can preview the checkout experience.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
        {/* Form */}
        <div className="lg:col-span-7 space-y-10">
          <section className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-sm">
            <h2 className="text-lg font-bold text-[var(--color-foreground)] mb-6 flex items-center gap-2">
              <Package className="h-5 w-5 text-[var(--color-primary)]" />
              Shipping details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Input label="Email" type="email" placeholder="you@example.com" autoComplete="email" />
              </div>
              <Input label="Full name" placeholder="Jane Doe" autoComplete="name" />
              <Input label="Phone" type="tel" placeholder="+1 (555) 000-0000" autoComplete="tel" />
              <div className="sm:col-span-2">
                <Input label="Address" placeholder="Street, apartment, suite…" autoComplete="street-address" />
              </div>
              <Input label="City" autoComplete="address-level2" />
              <Input label="ZIP / Postal code" autoComplete="postal-code" />
            </div>
          </section>

          <section className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-sm opacity-90">
            <h2 className="text-lg font-bold text-[var(--color-foreground)] mb-2 flex items-center gap-2">
              <Lock className="h-5 w-5 text-[var(--color-primary)]" />
              Payment
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Demo only — card details are not collected. Integrate Stripe or Shop Pay here later.
            </p>
            <div className="grid grid-cols-1 gap-4">
              <Input label="Name on card" placeholder="JANE DOE" disabled />
              <Input label="Card number" placeholder="4242 4242 4242 4242" disabled />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Expiry" placeholder="MM/YY" disabled />
                <Input label="CVC" placeholder="123" disabled />
              </div>
            </div>
          </section>
        </div>

        {/* Order summary */}
        <aside className="lg:col-span-5 lg:sticky lg:top-28">
          <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-sm">
            <h2 className="text-lg font-bold text-[var(--color-foreground)] mb-6">
              Order summary
            </h2>
            <ul className="space-y-5 mb-8">
              {lines.map((line) => (
                <li key={line.id} className="flex gap-4">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--background)]">
                    <Image
                      src={line.imageUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[var(--color-foreground)] leading-snug line-clamp-2">
                      {line.title}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                      {line.variantTitle} × {line.quantity}
                    </p>
                    <p className="text-sm font-bold text-[var(--color-foreground)] mt-1">
                      {formatMoney(
                        parseFloat(line.unitPrice.amount) * line.quantity,
                        line.unitPrice.currencyCode,
                      )}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <dl className="space-y-3 text-sm border-t border-[var(--color-border)] pt-6">
              <div className="flex justify-between">
                <dt className="text-slate-600 dark:text-slate-400">Subtotal</dt>
                <dd className="font-semibold text-[var(--color-foreground)]">
                  {formatMoney(subtotal, currencyCode)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600 dark:text-slate-400">Shipping</dt>
                <dd className="font-semibold text-[var(--color-foreground)]">
                  {shipping === 0
                    ? "Free"
                    : formatMoney(shipping, currencyCode)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600 dark:text-slate-400">Estimated tax (8%)</dt>
                <dd className="font-semibold text-[var(--color-foreground)]">
                  {formatMoney(tax, currencyCode)}
                </dd>
              </div>
              <div className="flex justify-between text-base pt-4 border-t border-[var(--color-border)]">
                <dt className="font-extrabold text-[var(--color-foreground)]">Total</dt>
                <dd className="font-extrabold text-[var(--color-primary)] text-xl">
                  {formatMoney(total, currencyCode)}
                </dd>
              </div>
            </dl>

            <Button
              type="button"
              size="lg"
              fullWidth
              className="mt-8"
              leftIcon={<Lock className="h-5 w-5" />}
              onClick={() => setPlaced(true)}
            >
              Place order (demo)
            </Button>
            <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-4">
              By placing an order, you agree to the terms of service (demo).
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
