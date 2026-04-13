import CheckoutClient from "@/components/checkout/CheckoutClient";

export const metadata = {
  title: "Cart | Beepaws",
  description: "Review your Beepaws cart before paying securely on Shopify.",
};

export default function CheckoutPage() {
  return <CheckoutClient />;
}
