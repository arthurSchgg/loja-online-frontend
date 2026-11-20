import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {heroMotionAllowed} from "../assets/js/hero-live-photo.js";

const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const css=readFileSync(new URL("../assets/css/pages.css",import.meta.url),"utf8");
const poster=new URL("../assets/images/brand/hero-live-poster.webp",import.meta.url);
const video=new URL("../assets/images/brand/hero-live-motion.mp4",import.meta.url);

test("home uses the approved real local Live Photo, not the retired vector illustration",()=>{
 const hero=html.match(/<img\s+data-hero-bottle\b[^>]*>/);
 assert.ok(hero,"home hero photograph missing");
 assert.match(hero[0],/src="assets\/images\/brand\/hero-live-poster\.webp"/);
 assert.match(hero[0],/fetchpriority="high"/);
 assert.match(hero[0],/width="900" height="1125"/);
 assert.match(hero[0],/alt="[^"]+"/);
 assert.doesNotMatch(hero[0],/unsplash|logo-katia|hero-perfumaria-editorial\.svg/);
 assert.match(html,/data-hero-video data-src="assets\/images\/brand\/hero-live-motion\.mp4"/);
 assert.ok(existsSync(poster),"local photographic poster missing");
 assert.ok(existsSync(video),"local motion video missing");
});

test("the photo frame covers without stretching and respects reduced motion",()=>{
 assert.match(css,/\.hero-live-frame\{/);
 assert.match(css,/object-fit:cover/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.equal(heroMotionAllowed({reducedMotion:true}),false);
 assert.equal(heroMotionAllowed({saveData:true}),false);
});

test("API data alone determines whether a real product can be requested",()=>{
 const live=readFileSync(new URL("../assets/js/live.js",import.meta.url),"utf8");
 assert.match(live,/available=!!p\.available/);
 assert.match(live,/Indisponível/);
 assert.doesNotMatch(live,/stock_quantity\s*=/);
});
