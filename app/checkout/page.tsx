import CheckoutClient from "@/components/checkout/CheckoutClient";
import { getMockCheckoutLines } from "@/lib/mock-data";

export const metadata = {
  title: "Checkout | Beepaws",
  description: "Complete your order at Beepaws.",
};

export default function CheckoutPage() {
  const lines = getMockCheckoutLines();

  return <CheckoutClient lines={lines} />;
}
