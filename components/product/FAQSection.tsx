import { Shield } from "lucide-react";
import { contentIcon } from "@/lib/content-icons";
import { FAQAccordion, type FAQRow } from "@/components/product/FAQAccordion";
import type { FaqItem } from "@/types/metafields";

// Lorem ipsum placeholders — set beepaws.faq_items to override. Icons stay
// distinct so each row reads as a different question visually.
const DEFAULT_FAQ_ITEMS: FaqItem[] = [
  {
    icon: "Shield",
    q: "Lorem ipsum dolor sit amet?",
    a: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  },
  {
    icon: "PawPrint",
    q: "Ut enim ad minim veniam?",
    a: "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
  },
  {
    icon: "Volume2",
    q: "Duis aute irure dolor?",
    a: "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
  },
  {
    icon: "Package",
    q: "Excepteur sint occaecat cupidatat?",
    a: "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
  },
  {
    icon: "RefreshCw",
    q: "Sed ut perspiciatis unde omnis?",
    a: "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam.",
  },
];

interface Props {
  items?: FaqItem[] | null;
  eyebrow?: string;
  heading?: string;
}

export function FAQSection({
  items,
  heading = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
}: Props) {
  const data = items && items.length > 0 ? items : DEFAULT_FAQ_ITEMS;

  // Icons resolve HERE, on the server, and travel to the client half as rendered
  // nodes — that keeps the ~1700-icon catalog out of the browser bundle.
  const rows: FAQRow[] = data.map((faq) => {
    const Icon = contentIcon(faq.icon, Shield);
    return { q: faq.q, a: faq.a, icon: <Icon className="h-5 w-5" /> };
  });

  // Warm Honey: honey-tint section per reference. White question cards
  // with hairline border, cocoa question text, gold-deep "+" rotating on
  // open, brown answer text. Copy from device reference template.
  return (
    <section className="ds-reveal-in bg-sand py-14 md:py-20">
      <div className="container mx-auto max-w-3xl px-4 md:px-6">

        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl md:text-[33px] font-semibold tracking-tight text-cocoa leading-tight">
            {heading}
          </h2>
        </div>

        <FAQAccordion rows={rows} />
      </div>
    </section>
  );
}
