const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

export const BRAND_DOMAINS = Object.freeze({
  zomato: "zomato.com",
  swiggy: "swiggy.com",
  instamart: "swiggy.com",
  uber: "uber.com",
  ola: "olacabs.com",
  rapido: "rapido.bike",
  amazonpay: "pay.amazon.com",
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

const UNAVATAR_GOOGLE_ENDPOINT = "https://unavatar.io/google";

function logo(source, options = {}) {
  return Object.freeze({
    source,
    resizeMode: options.resizeMode || "cover",
    scale: options.scale || 1,
    backgroundColor: options.backgroundColor || "#FFFFFF",
  });
}

/**
 * Literal local assets are the reliable first layer. Metro includes every
 * require at build time; the optional online logo never replaces this fallback.
 */
export const MERCHANT_LOGO_ASSETS = Object.freeze({
  zomato: logo(require("../../assets/merchant-logos/zomato.png")),
  swiggy: logo(require("../../assets/merchant-logos/swiggy.png")),
  instamart: logo(require("../../assets/merchant-logos/swiggy.png")),
  uber: logo(require("../../assets/merchant-logos/uber.png")),
  ola: logo(require("../../assets/merchant-logos/ola.png")),
  rapido: logo(require("../../assets/merchant-logos/rapido.png")),
  amazonpay: logo(
    require("../../assets/merchant-logos/amazonpay.png"),
    { resizeMode: "contain", scale: 0.9 },
  ),
  amazon: logo(require("../../assets/merchant-logos/amazon.png")),
  flipkart: logo(require("../../assets/merchant-logos/flipkart.png")),
  myntra: logo(require("../../assets/merchant-logos/myntra.png")),
  ajio: logo(require("../../assets/merchant-logos/ajio.png")),
  nykaa: logo(require("../../assets/merchant-logos/nykaa.png")),
  tatacliq: logo(require("../../assets/merchant-logos/tatacliq.png")),
  netflix: logo(require("../../assets/merchant-logos/netflix.png")),
  spotify: logo(require("../../assets/merchant-logos/spotify.png")),
  hotstar: logo(require("../../assets/merchant-logos/hotstar.png")),
  primevideo: logo(require("../../assets/merchant-logos/primevideo.png")),
  bookmyshow: logo(require("../../assets/merchant-logos/bookmyshow.png")),
  pvr: logo(require("../../assets/merchant-logos/pvr.png")),
  blinkit: logo(require("../../assets/merchant-logos/blinkit.png")),
  zepto: logo(require("../../assets/merchant-logos/zepto.png")),
  bigbasket: logo(require("../../assets/merchant-logos/bigbasket.jpg")),
  jiomart: logo(require("../../assets/merchant-logos/jiomart.png")),
  dmart: logo(require("../../assets/merchant-logos/dmart.jpg")),
  relianceretail: logo(
    require("../../assets/merchant-logos/relianceretail.png"),
    { resizeMode: "contain", scale: 0.82 },
  ),
  apollopharmacy: logo(require("../../assets/merchant-logos/apollopharmacy.png")),
  starbucks: logo(require("../../assets/merchant-logos/starbucks.png")),
  mcdonalds: logo(require("../../assets/merchant-logos/mcdonalds.png")),
  kfc: logo(require("../../assets/merchant-logos/kfc.png")),
  dominos: logo(require("../../assets/merchant-logos/dominos.png")),
  irctc: logo(require("../../assets/merchant-logos/irctc.png")),
  makemytrip: logo(require("../../assets/merchant-logos/makemytrip.png")),
  goibibo: logo(require("../../assets/merchant-logos/goibibo.png")),
  cleartrip: logo(require("../../assets/merchant-logos/cleartrip.png")),
  jio: logo(require("../../assets/merchant-logos/jio.png")),
  airtel: logo(require("../../assets/merchant-logos/airtel.png")),
  cred: logo(require("../../assets/merchant-logos/cred.png")),
  paytm: logo(require("../../assets/merchant-logos/paytm.png")),
  googlepay: logo(require("../../assets/merchant-logos/googlepay.png")),
  phonepe: logo(require("../../assets/merchant-logos/phonepe.png")),
  google: logo(require("../../assets/merchant-logos/google.png")),
  apple: logo(
    require("../../assets/merchant-logos/apple.png"),
    { resizeMode: "contain", scale: 0.76 },
  ),
});

export function merchantLogoAssetForKey(merchantKey) {
  return typeof merchantKey === "string"
    && hasOwn(MERCHANT_LOGO_ASSETS, merchantKey)
    ? MERCHANT_LOGO_ASSETS[merchantKey]
    : null;
}

export function merchantLogoUrlForKey(merchantKey) {
  if (typeof merchantKey !== "string" || !hasOwn(BRAND_DOMAINS, merchantKey)) {
    return null;
  }

  const domain = BRAND_DOMAINS[merchantKey];
  return `${UNAVATAR_GOOGLE_ENDPOINT}/${encodeURIComponent(domain)}?fallback=false`;
}
