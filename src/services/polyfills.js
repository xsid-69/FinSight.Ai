/**
 * FinSight Runtime Polyfills
 *
 * Must be executed before any other module imports to ensure that standard
 * Node / Browser globals expected by cryptographic, stream, and buffer libraries
 * exist in Hermes.
 */

const { Buffer } = require("buffer");

if (typeof global.Buffer === "undefined") {
  global.Buffer = Buffer;
}
if (typeof globalThis.Buffer === "undefined") {
  globalThis.Buffer = Buffer;
}

if (typeof global.process === "undefined") {
  global.process = { env: {}, version: "v18.0.0", versions: { node: "18.0.0" }, browser: true };
} else {
  if (!global.process.version) {
    global.process.version = "v18.0.0";
  }
  if (typeof global.process.browser === "undefined") {
    global.process.browser = true;
  }
  if (!global.process.versions) {
    global.process.versions = {};
  }
  if (!global.process.versions.node) {
    global.process.versions.node = "18.0.0";
  }
}

if (typeof Uint8Array !== "undefined" && !Uint8Array.prototype.slice) {
  Uint8Array.prototype.slice = function (start, end) {
    return new Uint8Array(this.subarray(start, end));
  };
}
