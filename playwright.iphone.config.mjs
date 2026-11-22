import {defineConfig,devices} from "@playwright/test";

export default defineConfig({
 testDir:"./iphone-browser-tests",
 testMatch:"**/*.spec.mjs",
 timeout:30_000,
 expect:{timeout:12_000},
 workers:1,
 retries:0,
 reporter:[["list"]],
 use:{
  ...devices["iPhone 15"],
  browserName:"webkit",
  baseURL:"http://127.0.0.1:5501",
  screenshot:"only-on-failure",
  trace:"retain-on-failure",
 },
 webServer:{
  command:"python3 -m http.server 5501 --directory dist --bind 127.0.0.1",
  url:"http://127.0.0.1:5501/index.html",
  reuseExistingServer:false,
  timeout:30_000,
 },
});
