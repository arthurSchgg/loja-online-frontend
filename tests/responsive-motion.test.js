import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {imageScrollOffset} from "../assets/js/animations.js";

const root=resolve(fileURLToPath(new URL("..",import.meta.url)));
const read=relative=>readFileSync(resolve(root,relative),"utf8");

test("scroll-linked product images move only within a small, predictable limit",()=>{
 assert.equal(imageScrollOffset(400,800),0);
 assert.equal(imageScrollOffset(0,800),14);
 assert.equal(imageScrollOffset(800,800),-14);
 assert.equal(imageScrollOffset(-2000,800),14);
 assert.equal(imageScrollOffset(3000,800),-14);
 assert.equal(imageScrollOffset(100,0),0);
 assert.equal(imageScrollOffset(NaN,800),0);
});
test("mobile menu closes accessibly without trapping users",()=>{
 const src=read("src/components/Shell.tsx");
 assert.match(src,/event.key === "Escape"/);
 assert.match(src,/menuButton\.current\?\.focus\(\)/);
 assert.match(src,/aria-expanded=\{open\}/);
 assert.match(src,/mobileMenu\.current\?\.contains\(event.target\)/);
 assert.match(src,/if \(event.matches\) setOpen\(false\)/);
});
test("scroll image enhancements use rAF, visibility and avoid motion for reduced-motion users",()=>{
 const src=read("assets/js/animations.js");
 assert.match(src,/new win.IntersectionObserver/);
 assert.match(src,/visibleImages/);
 assert.match(src,/requestAnimationFrame/);
 assert.match(src,/preference\?\.matches/);
 assert.match(src,/saveData/);
 assert.doesNotMatch(src,/addEventListener\("wheel"/);
});
test("mobile layout avoids two cramped product columns and keeps image dimensions stable",()=>{
 const styles=read("assets/css/components.css")+read("assets/css/pages.css")+read("assets/css/base.css");
 assert.match(styles,/@media\(max-width:560px\)/);
 assert.match(styles,/\.product-grid\{grid-template-columns:1fr/);
 assert.match(styles,/\.filter-bar\{grid-template-columns:1fr/);
 assert.match(styles,/--motion-shift:0px!important/);
 assert.match(styles,/scroll-padding-top:100px/);
});
