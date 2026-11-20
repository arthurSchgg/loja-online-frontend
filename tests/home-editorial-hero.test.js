import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,statSync} from "node:fs";
import {heroMotionAllowed} from "../assets/js/hero-live-photo.js";

const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const live=readFileSync(new URL("../assets/js/live.js",import.meta.url),"utf8");
const css=readFileSync(new URL("../assets/css/pages.css",import.meta.url),"utf8");
const heroJs=readFileSync(new URL("../assets/js/hero-live-photo.js",import.meta.url),"utf8");
const poster=new URL("../assets/images/brand/hero-live-poster.webp",import.meta.url);
const video=new URL("../assets/images/brand/hero-live-motion.mp4",import.meta.url);

test("home hero has an original self-hosted photograph with optional cinematic video",()=>{
 const hero=html.match(/<img\s+data-hero-bottle\s+[^>]+>/);
 assert.ok(hero,"home poster exists");
 assert.match(hero[0],/src="assets\/images\/brand\/hero-live-poster\.webp"/);
 assert.match(hero[0],/fetchpriority="high"/);
 assert.match(hero[0],/loading="eager"/);
 assert.match(hero[0],/alt="[^"]+"/);
 assert.doesNotMatch(hero[0],/logo-katia|aurora-de-petalas/);
 assert.match(html,/<video[^>]*data-hero-video[^>]*data-src="assets\/images\/brand\/hero-live-motion\.mp4"/);
 assert.match(html,/<video[^>]*muted playsinline loop preload="none"/);
 assert.match(html,/data-hero-toggle[^>]*aria-label="Pausar animação da fotografia"/);
 assert.doesNotMatch(live,/heroBottle\.src\s*=\s*["']assets\/images\/brand\/logo-katia\.svg/);
});
test("photo and short muted loop are real, reasonably sized media files",()=>{
 const image=readFileSync(poster),movie=readFileSync(video);
 assert.equal(image.toString("ascii",0,4),"RIFF");
 assert.equal(image.toString("ascii",8,12),"WEBP");
 assert.equal(movie.toString("ascii",4,8),"ftyp");
 assert.ok(statSync(poster).size<200_000,"poster below 200 KB");
 assert.ok(statSync(video).size<500_000,"video below 500 KB");
});
test("ambient motion honors accessibility and slow-network preferences",()=>{
 assert.equal(heroMotionAllowed(),true);
 assert.equal(heroMotionAllowed({reducedMotion:true}),false);
 assert.equal(heroMotionAllowed({saveData:true}),false);
 assert.equal(heroMotionAllowed({connectionType:"slow-2g"}),false);
 assert.equal(heroMotionAllowed({connectionType:"2g"}),false);
 assert.equal(heroMotionAllowed({motionOff:true}),false);
 assert.match(heroJs,/visibilitychange/);
 assert.match(heroJs,/IntersectionObserver/);
 assert.match(heroJs,/video\.pause\(\)/);
 assert.match(heroJs,/preference\?\.addEventListener/);
 assert.match(css,/\.hero-live-frame\[data-live-active="true"\]/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});
test("editorial image remains independent of the shop logo in live mode",()=>{
 assert.match(html,/class="editorial-visual"><img\s+data-parallax\s+src="https:\/\/images\.unsplash\.com/);
 assert.doesNotMatch(live,/editorialImage\.src\s*=\s*["']assets\/images\/brand\/logo-katia\.svg/);
});
test("mobile and desktop share the same photo frame without distortion",()=>{
 assert.match(css,/\.hero-live-frame\{/);
 assert.match(css,/object-fit:cover/);
 assert.match(css,/@media\(max-width:768px\)/);
});
