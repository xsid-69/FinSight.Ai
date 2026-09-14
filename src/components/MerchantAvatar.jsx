import React, { memo, useMemo, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import {
  Car,
  CreditCard,
  Film,
  ShoppingBag,
  Utensils,
  Zap,
} from "@tamagui/lucide-icons";

export const BRAND_DOMAINS = Object.freeze({
  zomato: "zomato.com",
  swiggy: "swiggy.com",
  instamart: "swiggy.com",
  uber: "uber.com",
  ola: "olacabs.com",
  rapido: "rapido.bike",
  amazonpay: "amazon.in",
  amazon: "amazon.in",
  flipkart: "flipkart.com",
  myntra: "myntra.com",
  ajio: "ajio.com",
  nykaa: "nykaa.com",
  tatacliq: "tatacliq.com",
  netflix: "netflix.com",
  spotify: "spotify.com",
  hotstar: "hotstar.com",
  primevideo: "primevideo.com",
  bookmyshow: "bookmyshow.com",
  pvr: "pvrcinemas.com",
  blinkit: "blinkit.com",
  zepto: "zeptonow.com",
  bigbasket: "bigbasket.com",
  jiomart: "jiomart.com",
  dmart: "dmartindia.com",
  relianceretail: "relianceretail.com",
  apollopharmacy: "apollopharmacy.in",
  starbucks: "starbucks.in",
  mcdonalds: "mcdonaldsindia.com",
  kfc: "kfc.com",
  dominos: "dominos.co.in",
  irctc: "irctc.co.in",
  makemytrip: "makemytrip.com",
  goibibo: "goibibo.com",
  cleartrip: "cleartrip.com",
  jio: "jio.com",
  airtel: "airtel.in",
  cred: "cred.club",
  paytm: "paytm.com",
  googlepay: "pay.google.com",
  phonepe: "phonepe.com",
  google: "google.com",
  apple: "apple.com",
});

const MAX_REMOTE_LOGOS_PER_SESSION = 20;
const RESERVED_LOGO_URLS = new Set();
const GENERIC_MERCHANTS = new Set([
  "merchant",
  "transaction",
  "transfer",
  "unknown",
  "unknownmerchant",
  "privatehandle",
  "privatereference",
]);

const DEFAULT_FALLBACK = Object.freeze({
  Icon: CreditCard,
  backgroundColor: "#1E293B",
  foregroundColor: "#E2E8F0",
});

const CATEGORY_FALLBACKS = Object.freeze({
  FOOD: {
    Icon: Utensils,
    backgroundColor: "#4A2030",
    foregroundColor: "#FBCFE8",
  },
  TRANSPORTATION: {
    Icon: Car,
    backgroundColor: "#172554",
    foregroundColor: "#BFDBFE",
  },
  ENTERTAINMENT: {
    Icon: Film,
    backgroundColor: "#312E81",
    foregroundColor: "#DDD6FE",
  },
  SHOPPING: {
    Icon: ShoppingBag,
    backgroundColor: "#493016",
    foregroundColor: "#FDE68A",
  },
  UTILITIES: {
    Icon: Zap,
    backgroundColor: "#463609",
    foregroundColor: "#FEF08A",
  },
});

function normalizeMerchantWords(merchantName) {
  return String(merchantName ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function sanitizeMerchantName(merchantName) {
  return normalizeMerchantWords(merchantName).replace(/\s+/g, "");
}

function reserveLogoUrl(logoUrl) {
  if (!logoUrl) return false;
  if (RESERVED_LOGO_URLS.has(logoUrl)) return true;
  if (RESERVED_LOGO_URLS.size >= MAX_REMOTE_LOGOS_PER_SESSION) return false;
  RESERVED_LOGO_URLS.add(logoUrl);
  return true;
}

export function resolveMerchantLogoUrl(merchantName) {
  const sanitizedName = sanitizeMerchantName(merchantName);
  if (sanitizedName.length < 2 || GENERIC_MERCHANTS.has(sanitizedName)) return null;

  const domain = BRAND_DOMAINS[sanitizedName];
  if (!domain) return null;

  return `https://unavatar.io/google/${domain}?fallback=false`;
}

function merchantInitials(merchantName) {
  const words = normalizeMerchantWords(merchantName)
    .split(" ")
    .filter(Boolean);
  if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase();
  if (words[0]?.length >= 2) return words[0].slice(0, 2).toUpperCase();
  return null;
}

/**
 * Circular verified-brand logo with a stable local fallback.
 * The avatar is decorative because its transaction row announces the merchant.
 *
 * @param {{
 *   merchantName?: string | null;
 *   category?: string | null;
 *   size?: number;
 * }} props
 */
function MerchantAvatarComponent({ merchantName, category, size = 44 }) {
  const avatarSize = Number.isFinite(size) ? Math.max(28, Math.round(size)) : 44;
  const logoUrl = useMemo(
    () => resolveMerchantLogoUrl(merchantName),
    [merchantName],
  );
  const imageSource = useMemo(
    () => (reserveLogoUrl(logoUrl) ? { uri: logoUrl } : null),
    [logoUrl],
  );
  const initials = useMemo(() => merchantInitials(merchantName), [merchantName]);
  const [loadedUrl, setLoadedUrl] = useState(null);
  const [failedUrl, setFailedUrl] = useState(null);
  const fallback = CATEGORY_FALLBACKS[String(category ?? "").toUpperCase()]
    ?? DEFAULT_FALLBACK;
  const radius = avatarSize / 2;
  const plateInset = Math.max(1, Math.round(avatarSize * 0.048));
  const plateRadius = (avatarSize - plateInset * 2) / 2;
  const imageLoaded = loadedUrl === logoUrl;
  const imageFailed = failedUrl === logoUrl;
  const FallbackIcon = fallback.Icon;

  return (
    <View
      style={[
        styles.container,
        {
          width: avatarSize,
          height: avatarSize,
          borderRadius: radius,
          backgroundColor: fallback.backgroundColor,
        },
      ]}
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {initials ? (
        <Text
          style={[
            styles.initials,
            {
              color: fallback.foregroundColor,
              fontSize: Math.max(11, Math.round(avatarSize * 0.3)),
              lineHeight: Math.max(15, Math.round(avatarSize * 0.42)),
            },
          ]}
        >
          {initials}
        </Text>
      ) : (
        <FallbackIcon
          size={Math.max(15, Math.round(avatarSize * 0.4))}
          color={fallback.foregroundColor}
          strokeWidth={2}
        />
      )}

      {imageSource && !imageFailed ? (
        <View
          style={[
            styles.logoPlate,
            {
              top: plateInset,
              right: plateInset,
              bottom: plateInset,
              left: plateInset,
              borderRadius: plateRadius,
              opacity: imageLoaded ? 1 : 0,
            },
          ]}
        >
          <Image
            key={logoUrl}
            source={imageSource}
            style={styles.logo}
            resizeMode="contain"
            fadeDuration={0}
            accessible={false}
            onLoad={() => setLoadedUrl(logoUrl)}
            onError={() => setFailedUrl(logoUrl)}
          />
        </View>
      ) : null}
    </View>
  );
}

export const MerchantAvatar = memo(
  MerchantAvatarComponent,
  (previous, next) => previous.merchantName === next.merchantName
    && previous.category === next.category
    && previous.size === next.size,
);

export default MerchantAvatar;

const styles = StyleSheet.create({
  container: {
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(24,35,61,0.12)",
  },
  initials: {
    fontWeight: "800",
    letterSpacing: 0.45,
    textAlign: "center",
  },
  logoPlate: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  logo: {
    width: "90%",
    height: "90%",
  },
});
