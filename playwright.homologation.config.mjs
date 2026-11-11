import {defineConfig} from "@playwright/test";
const base=process.env.HML_BASE_URL??"https://localhost:8443";
if(!/^https:\/\/localhost:(8443|18443)$/.test(base))
 throw Error("Homologação Playwright só aceita HTTPS localhost:8443/18443.");
export default defineConfig({
 testDir:"./homologation-tests",
 testMatch:"**/*.spec.mjs",
 timeout:45000,
 expect:{timeout:15000},
 workers:1,
 retries:0,
 reporter:[["list"]],
 use:{
  baseURL:base,
  browserName:"chromium",
  ignoreHTTPSErrors:false,
  screenshot:"off",
  trace:"off",
  video:"off"
 }
});
