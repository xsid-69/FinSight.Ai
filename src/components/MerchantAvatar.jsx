import React, { memo, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  Car,
  CreditCard,
  Film,
  ShoppingBag,
  Utensils,
  Zap,
} from "@tamagui/lucide-icons";

import {
  BRAND_VISUALS,
  normalizeMerchantWords,
  resolveMerchantBrandVisual,
  sanitizeMerchantName,
} from "../services/merchantBrandRegistry";

export {
  BRAND_VISUALS,
  resolveMerchantBrandVisual,
  sanitizeMerchantName,
};

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

function merchantInitials(merchantName) {
  const words = normalizeMerchantWords(merchantName)
    .split(" ")
    .filter(Boolean);
  if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase();
  if (words[0]?.length >= 2) return words[0].slice(0, 2).toUpperCase();
  return null;
}

function brandMarkSize(mark, avatarSize) {
  if (mark.length <= 1) return Math.max(14, Math.round(avatarSize * 0.46));
  if (mark.length === 2) return Math.max(11, Math.round(avatarSize * 0.32));
  return Math.max(9, Math.round(avatarSize * 0.23));
}

/**
 * Circular local merchant mark with a stable category fallback.
 * The avatar is decorative because its transaction row announces the merchant.
 *
 * @param {{
 *   merchantName?: string | null;
 *   merchantKey?: string | null;
 *   category?: string | null;
 *   size?: number;
 * }} props
 */
function MerchantAvatarComponent({ merchantName, merchantKey, category, size = 44 }) {
  const avatarSize = Number.isFinite(size) ? Math.max(28, Math.round(size)) : 44;
  const brandVisual = useMemo(
    () => resolveMerchantBrandVisual(merchantName, merchantKey),
    [merchantKey, merchantName],
  );
  const initials = useMemo(() => merchantInitials(merchantName), [merchantName]);
  const fallback = CATEGORY_FALLBACKS[String(category ?? "").toUpperCase()]
    ?? DEFAULT_FALLBACK;
  const radius = avatarSize / 2;
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

      {brandVisual ? (
        <View
          style={[
            styles.brandSurface,
            { backgroundColor: brandVisual.backgroundColor },
          ]}
        >
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={[
              styles.brandMark,
              {
                color: brandVisual.foregroundColor,
                fontSize: brandMarkSize(brandVisual.mark, avatarSize),
                lineHeight: Math.round(avatarSize * 0.58),
              },
            ]}
          >
            {brandVisual.mark}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export const MerchantAvatar = memo(
  MerchantAvatarComponent,
  (previous, next) => previous.merchantName === next.merchantName
    && previous.merchantKey === next.merchantKey
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
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#D9DDE5",
  },
  initials: {
    fontWeight: "800",
    letterSpacing: 0.45,
    textAlign: "center",
  },
  brandSurface: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  brandMark: {
    width: "84%",
    fontWeight: "900",
    letterSpacing: -0.3,
    textAlign: "center",
  },
});
