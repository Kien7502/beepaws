import { Icon } from "@iconify/react";
import type { PaymentMethods } from "@/lib/shopify/queries";

// Per-icon imports from @iconify-icons/logos — tree-shaken so only these
// ship in the bundle, and pre-bundled so no runtime API fetch / first-render
// flash. Iconify's `logos` set uses CC0-licensed official-quality SVGs.
import visaIcon from "@iconify-icons/logos/visa";
import mastercardIcon from "@iconify-icons/logos/mastercard";
import amexIcon from "@iconify-icons/logos/amex";
import discoverIcon from "@iconify-icons/logos/discover";
import dinersIcon from "@iconify-icons/logos/dinersclub";
import jcbIcon from "@iconify-icons/logos/jcb";
import applePayIcon from "@iconify-icons/logos/apple-pay";
import googlePayIcon from "@iconify-icons/logos/google-pay";
import paypalIcon from "@iconify-icons/logos/paypal";

// Driven by Shopify shop.paymentSettings. Brand visuals come from Iconify's
// `logos` set. Note: SHOP_PAY / SHOPIFY_PAY are intentionally NOT rendered
// here — Shop Pay has its own dedicated button (see <ShopPayButton/>).
// Unknown values silently skip — keeps the UI clean if Shopify adds a new
// enum we haven't mapped.

type Props = {
  methods: PaymentMethods;
};

type Renderer = () => React.ReactNode;

// Custom Amazon Pay — not in Iconify logos set. Wordmark + orange smile arc.
function AmazonPayLogo() {
  return (
    <svg viewBox="0 0 60 22" width="40" height="20" role="img" aria-label="Amazon Pay">
      <text
        x="30"
        y="13"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontWeight="800"
        fontSize="10"
        fill="#131A22"
      >
        amazon
      </text>
      <path
        d="M14 16 Q30 19 46 16"
        stroke="#FF9900"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      <text
        x="30"
        y="20.5"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontWeight="600"
        fontSize="5"
        fill="#131A22"
      >
        pay
      </text>
    </svg>
  );
}

const CARD_RENDERERS: Record<string, Renderer> = {
  VISA: () => <Icon icon={visaIcon} width="32" height="20" />,
  MASTERCARD: () => <Icon icon={mastercardIcon} width="32" height="20" />,
  AMERICAN_EXPRESS: () => <Icon icon={amexIcon} width="32" height="20" />,
  DISCOVER: () => <Icon icon={discoverIcon} width="32" height="20" />,
  DINERS_CLUB: () => <Icon icon={dinersIcon} width="32" height="20" />,
  JCB: () => <Icon icon={jcbIcon} width="32" height="20" />,
};

const WALLET_RENDERERS: Record<string, Renderer> = {
  APPLE_PAY: () => <Icon icon={applePayIcon} width="32" height="20" />,
  GOOGLE_PAY: () => <Icon icon={googlePayIcon} width="32" height="20" />,
  // Older Shopify enum name for Google Pay
  ANDROID_PAY: () => <Icon icon={googlePayIcon} width="32" height="20" />,
  PAYPAL: () => <Icon icon={paypalIcon} width="32" height="20" />,
  AMAZON_PAY: () => <AmazonPayLogo />,
};

// Compact badge: small, square-ish corners, white bg with subtle border —
// matches the CHUG-style payment row layout.
function Badge({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-7 min-w-[44px] items-center justify-center rounded-sm border border-slate-200 bg-white px-1.5">
      {children}
    </div>
  );
}

export function PaymentMethodsRow({ methods }: Props) {
  const cardBadges = methods.cards
    .filter((c) => CARD_RENDERERS[c])
    .map((c) => <Badge key={`card-${c}`}>{CARD_RENDERERS[c]()}</Badge>);

  const walletBadges = methods.wallets
    .filter((w) => WALLET_RENDERERS[w])
    .map((w) => <Badge key={`wallet-${w}`}>{WALLET_RENDERERS[w]()}</Badge>);

  if (cardBadges.length === 0 && walletBadges.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
      {cardBadges}
      {walletBadges}
    </div>
  );
}
