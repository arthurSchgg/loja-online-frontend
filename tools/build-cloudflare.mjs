/** Cloudflare Pages: only publish the LIVE public storefront, never administration. */
import {existsSync, readFileSync, writeFileSync} from "node:fs";
import {resolve, join} from "node:path";
import {fileURLToPath} from "node:url";
import {validatePublicApiBaseUrl} from "./cloudflare-api-url.mjs";

const apiBaseUrl = validatePublicApiBaseUrl(process.env.API_BASE_URL);
process.env.API_BASE_URL = apiBaseUrl;
process.env.ALLOW_EXTERNAL_PUBLIC_API = "true";
process.env.SITE_MODE = "live";
await import("./build-release.mjs");

const dir = resolve(fileURLToPath(new URL("../dist", import.meta.url)));
const config = readFileSync(join(dir, "assets/js/config.js"), "utf8");
if (!config.includes("mode:\"live\"") ||
    !config.includes("allowExternalPublicApi:true") ||
    !config.includes("apiBaseUrl:" + JSON.stringify(apiBaseUrl))) {
  throw new Error("Build Cloudflare inválido: configuração live/API não aplicada.");
}
for (const forbidden of ["admin.html", "admin-experiences.html", "admin",
                         "reset-password.html", "confirm-email.html"]) {
  if (existsSync(join(dir, forbidden))) throw new Error("Admin não pode entrar no bundle público.");
}
// Cloudflare Pages serves these static security headers. CSP is set in each HTML page
// by build.mjs, including the explicit HTTPS API origin in connect-src.
writeFileSync(join(dir, "_headers"),
  "/*\n" +
  "  X-Content-Type-Options: nosniff\n" +
  "  Referrer-Policy: strict-origin-when-cross-origin\n" +
  "  X-Frame-Options: DENY\n" +
  "  Permissions-Policy: camera=(), microphone=(), geolocation=()\n" +
  "  Strict-Transport-Security: max-age=31536000\n");
console.log("Cloudflare Pages PASS: vitrine live pública; painel administrativo fora do artefato.");
