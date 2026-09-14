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

import {
  BRAND_DOMAINS,
  merchantLogoAssetForKey,
  merchantLogoUrlForKey,
} from "./merchantLogoAssets";
import {
  BRAND_VISUALS,
  normalizeMerchantWords,
  resolveMerchantBrandVisual,
  sanitizeMerchantName,
} from "../services/merchantBrandRegistry";

export {
  BRAND_DOMAINS,
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

export function resolveMerchantLogoUrl(merchantName, merchantKey) {
  const brandVisual = resolveMerchantBrandVisual(merchantName, merchantKey);
  return merchantLogoUrlForKey(brandVisual?.key);
}

/**
 * Circular company logo with progressive local and network fallbacks.
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
  const logoAsset = useMemo(
    () => merchantLogoAssetForKey(brandVisual?.key),
    [brandVisual?.key],
  );
  const remoteLogoUrl = useMemo(
    () => merchantLogoUrlForKey(brandVisual?.key),
    [brandVisual?.key],
  );
  const remoteLogoSource = useMemo(
    () => (remoteLogoUrl ? { uri: remoteLogoUrl } : null),
    [remoteLogoUrl],
  );
  const initials = useMemo(() => merchantInitials(merchantName), [merchantName]);
  const [loadedLogoUrl, setLoadedLogoUrl] = useState(null);
  const [failedLogoUrl, setFailedLogoUrl] = useState(null);
  const fallback = CATEGORY_FALLBACKS[String(category ?? "").toUpperCase()]
    ?? DEFAULT_FALLBACK;
  const radius = avatarSize / 2;
  const localImageSize = logoAsset
    ? Math.max(1, Math.round(avatarSize * logoAsset.scale))
    : 0;
  const remoteImageSize = Math.max(1, Math.round(avatarSize * 0.9));
  const remoteLogoLoaded = loadedLogoUrl === remoteLogoUrl;
  const remoteLogoFailed = failedLogoUrl === remoteLogoUrl;
  const FallbackIcon = fallback.Icon;
  const surfaceSize = {
    width: avatarSize,
    height: avatarSize,
    borderRadius: radius,
  };

  return (
    <View
      style={[
        styles.container,
        surfaceSize,
        { backgroundColor: fallback.backgroundColor },
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

      {logoAsset ? (
        <View
          pointerEvents="none"
          style={[
            styles.logoSurface,
            surfaceSize,
            { backgroundColor: logoAsset.backgroundColor },
          ]}
        >
          <Image
            source={logoAsset.source}
            style={{ width: localImageSize, height: localImageSize }}
            resizeMode={logoAsset.resizeMode}
            fadeDuration={0}
            accessible={false}
          />
        </View>
      ) : null}

      {remoteLogoSource && !remoteLogoFailed ? (
        <View
          pointerEvents="none"
          style={[
            styles.logoSurface,
            styles.remoteLogoSurface,
            surfaceSize,
            { opacity: remoteLogoLoaded ? 1 : 0 },
          ]}
        >
          <Image
            key={remoteLogoUrl}
            source={remoteLogoSource}
            style={{ width: remoteImageSize, height: remoteImageSize }}
            resizeMode="contain"
            fadeDuration={0}
            accessible={false}
            onLoad={() => {
              setFailedLogoUrl((currentUrl) => (
                currentUrl === remoteLogoUrl ? null : currentUrl
              ));
              setLoadedLogoUrl(remoteLogoUrl);
            }}
            onError={() => {
              setLoadedLogoUrl((currentUrl) => (
                currentUrl === remoteLogoUrl ? null : currentUrl
              ));
              setFailedLogoUrl(remoteLogoUrl);
            }}
          />
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
    position: "relative",
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  initials: {
    fontWeight: "800",
    letterSpacing: 0.45,
    textAlign: "center",
  },
  logoSurface: {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  remoteLogoSurface: {
    zIndex: 2,
    backgroundColor: "#FFFFFF",
  },
});
