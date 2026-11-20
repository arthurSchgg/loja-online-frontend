import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const pages=[
 ["index.html",3],
 ["conheca-a-loja.html",2],
 ["viva-sua-experiencia.html",1],
 ["contato.html",1],
 ["espaco-das-velas.html",1]
];
const sources=[
 "res.cloudinary.com/beleza-na-web/",
 "shopsupermercadobrazil.com/cdn/shop/files/",
 "tiendacdn.farmashop.com.uy/media/catalog/product/",
 "down-br.img.susercontent.com/file/",
 "images.pexels.com/photos/7219339/"
];

test("public editorial pages use real photographs rather than vector cutout illustrations",()=>{
 for(const [path,count] of pages){
  const html=read(path);
  assert.equal((html.match(/data-editorial-photo/g)||[]).length,count);
  assert.doesNotMatch(html,/src="assets\/images\/editorial\/[^"]+\.svg"/);
  assert.doesNotMatch(html,/src="assets\/images\/brand\/logo-katia\.svg"/);
  assert.match(html,/src="assets\/js\/editorial-photos\.js"/);
  assert.match(html,/loading="(?:eager|lazy)"/);
 }
 for(const host of sources){
  const combined=pages.map(([path])=>read(path)).join("\n");
  assert.ok(combined.includes(host),host);
 }
});

test("hero Live Photo and actual backend inventory remain untouched",()=>{
 const html=read("index.html");
 const live=read("assets/js/live.js");
 assert.match(html,/data-hero-bottle src="assets\/images\/brand\/hero-live-poster\.webp"/);
 assert.match(html,/data-hero-video/);
 assert.match(live,/available=!!p\.available/);
 assert.match(live,/data-confirm-product/);
 assert.doesNotMatch(live,/stock_quantity\s*=/);
});

test("real photos are identified as editorial, with remote-failure fallback",()=>{
 const home=read("index.html");
 const js=read("assets/js/editorial-photos.js");
 const css=read("assets/css/pages.css");
 const institutional=read("assets/css/institutional.css");
 assert.match(home,/Fotografias de referência/);
 assert.match(home,/data-editorial-photo/);
 assert.match(js,/addEventListener\("error"/);
 assert.match(js,/Fotografia temporariamente indisponível/);
 assert.match(js,/replaceWith\(note\)/);
 assert.match(css,/\.editorial-photo-placeholder/);
 assert.match(css,/mix-blend-mode:multiply/);
 assert.match(institutional,/mix-blend-mode:multiply/);
 for(const styles of [css,institutional]){
  assert.match(styles,/@media\(max-width:560px\)/);
  assert.match(styles,/prefers-reduced-motion:reduce/);
 }
});

test("candle content remains relevant and does not suggest an official Boticário candle",()=>{
 const candles=read("espaco-das-velas.html");
 assert.match(candles,/images\.pexels\.com\/photos\/7219339/);
 assert.match(candles,/Fotografia editorial · não representa produto à venda/);
});
