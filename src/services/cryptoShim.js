/**
 * Lightweight, Hermes-safe crypto shim for React Native / Hermes.
 *
 * Sourced directly from browser-safe modules to avoid circular dependencies
 * with Metro's 'crypto' alias:
 *   - create-hash/browser
 *   - create-hmac/browser
 *   - browserify-cipher/browser
 *   - pbkdf2/browser
 *
 * Supports both CommonJS require('crypto') and ES module import.
 */

const { Buffer } = require("buffer");
if (typeof global.Buffer === "undefined") {
  global.Buffer = Buffer;
}
if (typeof globalThis.Buffer === "undefined") {
  globalThis.Buffer = Buffer;
}
if (typeof process !== "undefined") {
  if (!process.version) process.version = "v18.0.0";
  if (typeof process.browser === "undefined") process.browser = true;
}

const createHash = require("create-hash/browser");
const createHmac = require("create-hmac/browser");
const browserifyCipher = require("browserify-cipher/browser");
const pbkdf2 = require("pbkdf2/browser");

const createCipher = browserifyCipher.createCipher;
const createDecipher = browserifyCipher.createDecipher;
const createCipheriv = browserifyCipher.createCipheriv;
const createDecipheriv = browserifyCipher.createDecipheriv;
const getCiphers = browserifyCipher.getCiphers || browserifyCipher.listCiphers;

function randomBytes(size, cb) {
  const bytes = Buffer.alloc(size);
  if (
    typeof globalThis !== "undefined" &&
    globalThis.crypto &&
    typeof globalThis.crypto.getRandomValues === "function"
  ) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < size; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  if (typeof cb === "function") {
    setTimeout(() => cb(null, bytes), 0);
  }
  return bytes;
}

function getHashes() {
  return ["sha1", "sha256", "sha384", "sha512", "md5", "rmd160"];
}

const cryptoShim = {
  createHash,
  createHmac,
  createCipher,
  createDecipher,
  createCipheriv,
  createDecipheriv,
  randomBytes,
  getHashes,
  pbkdf2Sync: pbkdf2.pbkdf2Sync,
  pbkdf2: pbkdf2.pbkdf2,
  getCiphers,
};

module.exports = cryptoShim;
module.exports.default = cryptoShim;
Object.assign(module.exports, cryptoShim);

