import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const release=readFileSync(new URL("../tools/build-release.mjs",import.meta.url),"utf8");
const heroTest=readFileSync(new URL("./home-premium-local-hero.test.js",import.meta.url),"utf8");

test("Cloudflare release runs the same syntax and unit gates even when GitHub runners cannot start",()=>{
 assert.match(release,/qualityGate\("check"\)/);
 assert.match(release,/qualityGate\("test"\)/);
 assert.match(release,/spawnSync\(/);
 assert.match(release,/execution\.status!==0/);
 const check=release.indexOf('qualityGate("check")');
 const tests=release.indexOf('qualityGate("test")');
 const output=release.indexOf('await import("./build.mjs")');
 assert.ok(check>0&&tests>check&&output>tests,"release must validate before building");
 assert.doesNotMatch(release,/SKIP_RELEASE_QUALITY_GATE|continueOnError/);
});

test("retired hero SVG cannot pass as the published Live Photo in CI",()=>{
 assert.match(heroTest,/hero-live-poster\\\.webp/);
 assert.match(heroTest,/hero-live-motion\\\.mp4/);
 assert.doesNotMatch(heroTest,/hero-perfumaria-editorial\\\.svg"\//);
});
