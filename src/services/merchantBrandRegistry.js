function createBrand(
  displayName,
  mark,
  backgroundColor,
  foregroundColor = "#FFFFFF",
  aliases = [],
) {
  return Object.freeze({
    displayName,
    aliases: Object.freeze(aliases),
    visual: Object.freeze({ mark, backgroundColor, foregroundColor }),
  });
}

const BRAND_CONFIG = Object.freeze({
  zomato: createBrand("Zomato", "Z", "#E23744"),
  swiggy: createBrand("Swiggy", "S", "#FC8019"),
  instamart: createBrand("Instamart", "IM", "#F06C21", "#FFFFFF", ["Swiggy Instamart"]),
  uber: createBrand("Uber", "U", "#111111", "#FFFFFF", ["Uber India"]),
  ola: createBrand("Ola", "OLA", "#111111", "#D6FF33", ["Ola Cabs", "OlaCabs"]),
  rapido: createBrand("Rapido", "R", "#FFD52F", "#171717"),
  amazonpay: createBrand("Amazon Pay", "AP", "#1769AA", "#FFFFFF", ["AmazonPay"]),
  amazon: createBrand("Amazon", "A", "#131A22", "#FFB000", ["Amazon India"]),
  flipkart: createBrand("Flipkart", "F", "#2874F0", "#FFE500"),
  myntra: createBrand("Myntra", "M", "#FF3F6C"),
  ajio: createBrand("AJIO", "AJ", "#171717"),
  nykaa: createBrand("Nykaa", "N", "#E80071"),
  tatacliq: createBrand("Tata CLiQ", "TC", "#8B1C62", "#FFFFFF", ["Tata Cliq"]),
  netflix: createBrand("Netflix", "N", "#141414", "#E50914"),
  spotify: createBrand("Spotify", "S", "#1ED760", "#111111"),
  hotstar: createBrand("Disney+ Hotstar", "H", "#082A5E", "#FFFFFF", ["Hotstar", "Disney Hotstar", "Disney Plus Hotstar"]),
  primevideo: createBrand("Prime Video", "PV", "#1399D6", "#FFFFFF", ["PrimeVideo", "Amazon Prime Video"]),
  bookmyshow: createBrand("BookMyShow", "B", "#F84464", "#FFFFFF", ["Book My Show"]),
  pvr: createBrand("PVR", "P", "#D6AA55", "#171717", ["PVR Cinemas"]),
  blinkit: createBrand("Blinkit", "B", "#F8D91C", "#123B23"),
  zepto: createBrand("Zepto", "Z", "#7B2CBF"),
  bigbasket: createBrand("BigBasket", "BB", "#5E9400", "#FFFFFF", ["Big Basket"]),
  jiomart: createBrand("JioMart", "JM", "#0F3CC9", "#FFFFFF", ["Jio Mart"]),
  dmart: createBrand("DMart", "D", "#2C8D3C", "#FFFFFF", ["D Mart"]),
  relianceretail: createBrand("Reliance Retail", "RR", "#153D8A", "#FFFFFF", ["RelianceRetail"]),
  apollopharmacy: createBrand("Apollo Pharmacy", "AP", "#007C91", "#FFFFFF", ["ApolloPharmacy"]),
  starbucks: createBrand("Starbucks", "S", "#00754A"),
  mcdonalds: createBrand("McDonald's", "M", "#DA291C", "#FFC72C", ["McDonalds", "Mc Donalds"]),
  kfc: createBrand("KFC", "K", "#E4002B"),
  dominos: createBrand("Domino's", "D", "#006491", "#FFFFFF", ["Dominos", "Domino s"]),
  irctc: createBrand("IRCTC", "IR", "#1B4E91"),
  makemytrip: createBrand("MakeMyTrip", "MMT", "#E53935", "#FFFFFF", ["Make My Trip"]),
  goibibo: createBrand("Goibibo", "GI", "#E64A3B", "#FFFFFF", ["Go Ibibo"]),
  cleartrip: createBrand("Cleartrip", "C", "#F58220"),
  jio: createBrand("Jio", "J", "#0F3CC9"),
  airtel: createBrand("Airtel", "A", "#ED1C24"),
  cred: createBrand("CRED", "C", "#171717"),
  paytm: createBrand("Paytm", "P", "#00B9F1", "#123B72"),
  googlepay: createBrand("Google Pay", "GP", "#FFFFFF", "#1A73E8", ["GooglePay", "GPay"]),
  phonepe: createBrand("PhonePe", "P", "#5F259F", "#FFFFFF", ["Phone Pe"]),
  google: createBrand("Google", "G", "#FFFFFF", "#4285F4"),
  apple: createBrand("Apple", "A", "#111111"),
});

export const MERCHANT_BRAND_KEYS = Object.freeze(Object.keys(BRAND_CONFIG));
const MERCHANT_BRAND_KEY_SET = new Set(MERCHANT_BRAND_KEYS);

export const BRAND_VISUALS = Object.freeze(
  Object.fromEntries(
    Object.entries(BRAND_CONFIG).map(([key, brand]) => [
      key,
      Object.freeze({ key, displayName: brand.displayName, ...brand.visual }),
    ]),
  ),
);

export function normalizeMerchantWords(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function sanitizeMerchantName(value) {
  return normalizeMerchantWords(value).replace(/\s+/g, "");
}

export function isMerchantBrandKey(value) {
  return typeof value === "string" && MERCHANT_BRAND_KEY_SET.has(value);
}

const ALIAS_MATCHERS = Object.freeze(
  Object.entries(BRAND_CONFIG)
    .flatMap(([key, brand]) => {
      const aliases = new Set([key, brand.displayName, ...brand.aliases]);
      return Array.from(aliases, (alias) => ({
        key,
        tokens: normalizeMerchantWords(alias).split(" ").filter(Boolean),
      }));
    })
    .filter(({ tokens }) => tokens.length > 0)
    .sort((left, right) => right.tokens.length - left.tokens.length),
);

function tokenSequenceMatches(tokens, candidate, start) {
  if (start + candidate.length > tokens.length) return false;
  return candidate.every((token, index) => tokens[start + index] === token);
}

/**
 * Resolves only reviewed brand aliases at complete token boundaries.
 * Overlapping short aliases are shadowed by their longer phrase (for example,
 * "Google Pay" wins over "Google"), while two independent brands are treated
 * as ambiguous and intentionally return no identity.
 */
export function resolveMerchantBrandKey(value) {
  const normalized = normalizeMerchantWords(value);
  if (!normalized) return null;

  const tokens = normalized.split(" ").filter(Boolean);
  const matches = [];

  ALIAS_MATCHERS.forEach(({ key, tokens: aliasTokens }) => {
    for (let start = 0; start <= tokens.length - aliasTokens.length; start += 1) {
      if (!tokenSequenceMatches(tokens, aliasTokens, start)) continue;
      matches.push({
        key,
        start,
        end: start + aliasTokens.length,
        length: aliasTokens.length,
      });
    }
  });

  const unshadowedMatches = matches.filter(
    (match) => !matches.some(
      (candidate) => candidate.length > match.length
        && candidate.start <= match.start
        && candidate.end >= match.end,
    ),
  );
  const matchedKeys = new Set(unshadowedMatches.map(({ key }) => key));
  return matchedKeys.size === 1 ? Array.from(matchedKeys)[0] : null;
}

export function merchantBrandDisplayName(merchantKey) {
  return isMerchantBrandKey(merchantKey)
    ? BRAND_CONFIG[merchantKey].displayName
    : null;
}

/**
 * Returns a bundled visual identity. No merchant name, key, or domain leaves
 * the device when a transaction avatar is rendered.
 */
export function resolveMerchantBrandVisual(merchantName, merchantKey = null) {
  const resolvedKey = isMerchantBrandKey(merchantKey)
    ? merchantKey
    : resolveMerchantBrandKey(merchantName);
  return resolvedKey ? BRAND_VISUALS[resolvedKey] : null;
}
