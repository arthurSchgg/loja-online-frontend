import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";

const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const css=readFileSync(new URL("../assets/css/pages.css",import.meta.url),"utf8");
const source=new URL("../assets/images/brand/hero-perfumaria-editorial.svg",import.meta.url);

test("home displays a self-hosted perfume composition instead of external artwork",()=>{
 const hero=html.match(/<img\s+data-hero-bottle\b[^>]*>/);
 assert.ok(hero,"missing hero illustration");
 assert.match(hero[0],/src="assets\/images\/brand\/hero-perfumaria-editorial\.svg"/);
 assert.match(hero[0],/fetchpriority="high"/);
 assert.match(hero[0],/width="720" height="820"/);
 assert.match(hero[0],/alt="[^"]+"/);
 assert.doesNotMatch(hero[0],/unsplash|logo-katia/);
 assert.ok(existsSync(source),"local hero asset not found");
});

test("editorial vector remains sharp at every viewport and honors reduced motion",()=>{
 const svg=readFileSync(source,"utf8");
 assert.match(svg,/<svg[^>]+viewBox="0 0 720 820"/);
 assert.match(svg,/<title/);
 assert.match(css,/\.hero-image img\[data-hero-bottle\]/);
 assert.match(css,/object-fit:cover/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});

test("live API alone determines product availability",()=>{
 const live=readFileSync(new URL("../assets/js/live.js",import.meta.url),"utf8");
 assert.match(live,/available=!!p\.available/);
 assert.match(live,/Indisponível/);
});
