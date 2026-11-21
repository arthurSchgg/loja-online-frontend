import {defineConfig} from "@playwright/test";

export default defineConfig({
 testDir: "./browser-tests",
 testMatch: "**/*.spec.mjs",
 timeout: 30_000,
 expect: {timeout: 12_000},
 retries: process.env.CI ? 1 : 0,
 workers: process.env.CI ? 2 : undefined,
 reporter: [["list"]],
 use: {
  baseURL: "http://127.0.0.1:5500",
  browserName: "chromium",
  launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
   ? {executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{},
  screenshot: "only-on-failure",
  trace: "retain-on-failure",
  actionTimeout: 10_000,
 },
 webServer: {
  command: "python3 -m http.server 5500 --directory dist --bind 127.0.0.1",
  url: "http://127.0.0.1:5500/index.html",
  reuseExistingServer: false,
  timeout: 30_000,
 },
});
