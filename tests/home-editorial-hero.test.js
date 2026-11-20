import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const live=readFileSync(new URL("../assets/js/live.js",import.meta.url),"utf8");
const styles=readFileSync(new URL("../assets/css/pages.css",import.meta.url),"utf8");
const artwork=readFileSync(new URL("../assets/images/brand/hero-perfumaria-editorial.svg",import.meta.url),"utf8");

test("home hero uses self-hosted editorial artwork, not the oversized brand logo",()=>{
 const hero=html.match(/<img\s+data-hero-bottle\s+[^>]+>/);
 assert.ok(hero,"home hero image exists");
 assert.match(hero[0],/src="assets\/images\/brand\/hero-perfumaria-editorial\.svg"/);
 assert.match(hero[0],/fetchpriority="high"/);
 assert.match(hero[0],/alt="[^"]+"/);
 assert.match(artwork,/<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
 assert.doesNotMatch(hero[0],/logo-katia|aurora-de-petalas/);
 assert.doesNotMatch(live,/heroBottle\.src\s*=\s*["']assets\/images\/brand\/logo-katia\.svg/);
});
test("editorial section image is not overwritten by the logo in live mode",()=>{
 assert.match(html,/class="editorial-visual"><img\s+data-parallax\s+src="https:\/\/images\.unsplash\.com/);
 assert.doesNotMatch(live,/editorialImage\.src\s*=\s*["']assets\/images\/brand\/logo-katia\.svg/);
});
test("responsive hero keeps editorial artwork sharp without distortion",()=>{
 assert.match(styles,/\.hero-image img\[data-hero-bottle\]/);
 assert.match(styles,/object-fit:cover/);
 assert.match(styles,/@media\(max-width:768px\)/);
});
