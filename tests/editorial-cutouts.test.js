import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";

const load = path => readFileSync(new URL("../"+path,import.meta.url),"utf8");
const pages = [
 ["conheca-a-loja.html","floral-perfume-cutout.svg"],
 ["viva-sua-experiencia.html","discovery-perfume-cutout.svg"],
 ["contato.html","amber-perfume-cutout.svg"],
 ["espaco-das-velas.html","candle-floral-cutout.svg"]
];
const artwork=[
 "floral-perfume-cutout.svg",
 "amber-perfume-cutout.svg",
 "discovery-perfume-cutout.svg",
 "candle-floral-cutout.svg"
];
test("all editorial SVGs are self-hosted, transparent and brand-agnostic",()=>{
 for(const file of artwork){
  const path="assets/images/editorial/"+file;
  assert.equal(existsSync(new URL("../"+path,import.meta.url)),true);
  const svg=load(path);
  assert.match(svg,/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.match(svg,/viewBox="0 0 640 700"/);
  assert.match(svg,/<title id="title">/);
  assert.doesNotMatch(svg,/<rect\s+width="640"\s+height="700"/);
  assert.doesNotMatch(svg,/<image\s+href=/);
  assert.ok(!svg.includes("logo-katia.svg"));
 }
});
test("institutional pages do not enlarge logo in hero illustrations",()=>{
 for(const [path,file] of pages){
  const html=load(path);
  assert.match(html,new RegExp("src=\"assets/images/editorial/"+file.replaceAll(".","\\.")+"\""));
  assert.doesNotMatch(html,/src="assets\/images\/brand\/logo-katia\.svg"/);
  assert.match(html,/class="editorial-cutout-shell"/);
  assert.match(html,/data-parallax/);
 }
 assert.match(load("conheca-a-loja.html"),/class="chapter-story__visual"/);
});
test("home keeps cinematic hero and replaces squared editorial imagery with transparent assets",()=>{
 const home=load("index.html");
 assert.match(home,/src="assets\/images\/brand\/hero-live-poster\.webp"/);
 assert.match(home,/data-hero-video/);
 assert.match(home,/editorial-visual__float/);
 assert.match(home,/src="assets\/images\/editorial\/candle-floral-cutout\.svg"/);
 assert.doesNotMatch(home,/images\.unsplash\.com/);
 assert.doesNotMatch(home,/src="assets\/images\/perfumes\/(aurora-de-petalas|madeira-do-sol)\.svg"/);
});
test("mobile layout uses isolated shell motion and disables parallax for reduced-motion settings",()=>{
 const institutional=load("assets/css/institutional.css");
 const home=load("assets/css/pages.css");
 for(const css of [institutional,home]){
  assert.match(css,/prefers-reduced-motion:reduce/);
  assert.match(css,/html\[data-motion="off"\]/);
  assert.match(css,/@media\(max-width:560px\)/);
 }
 assert.match(institutional,/\.editorial-cutout-shell/);
 assert.match(institutional,/@keyframes cutout-breathe/);
 assert.match(home,/@keyframes editorial-lift/);
 assert.match(home,/\.editorial-visual img\[data-parallax\]/);
 assert.doesNotMatch(load("assets/images/brand/product-photo-pending.svg"),/<rect\s+width="600"\s+height="720"/);
});
