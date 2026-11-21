import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {catalogAddressAfterClear} from "../assets/js/catalog-toolbar.js";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("removing only search leaves a category deep link and other URL data intact",()=>{
 const result=catalogAddressAfterClear(
  "https://shop.example/catalogo.html?q=perfume&familia=Floral&origem=instagram#lista",
  {key:"query",q:"",family:"Floral",categoryReady:true});
 assert.equal(result,"/catalogo.html?familia=Floral&origem=instagram#lista");
});
test("removing category preserves the current search, not an outdated URL search",()=>{
 const result=catalogAddressAfterClear(
  "https://shop.example/catalogo.html?q=antigo&familia=Floral",
  {key:"family",q:"novo perfume",categoryReady:true});
 assert.equal(result,"/catalogo.html?q=novo+perfume");
});
test("a category deep link survives clearing a query before categories have loaded",()=>{
 const result=catalogAddressAfterClear(
  "https://shop.example/catalogo.html?q=kit&familia=Amadeirado",
  {key:"query",q:"",family:"",categoryReady:false});
 assert.equal(result,"/catalogo.html?familia=Amadeirado");
});
test("clearing all filters does not remove unrelated campaign parameters",()=>{
 const result=catalogAddressAfterClear(
  "https://shop.example/catalogo.html?q=kit&familia=Floral&utm_source=site",
  {key:"all",q:"kit",family:"Floral",categoryReady:true});
 assert.equal(result,"/catalogo.html?utm_source=site");
});
test("editing search and removing price also keeps the selected named category",()=>{
 const result=catalogAddressAfterClear(
  "https://shop.example/catalogo.html?q=antigo",
  {key:"max",q:"lily",family:"Floral",categoryReady:true});
 assert.equal(result,"/catalogo.html?q=lily&familia=Floral");
});
test("real perfume packshots use a soft matte with no image replacement",()=>{
 const pages=["index.html","conheca-a-loja.html","contato.html","viva-sua-experiencia.html"];
 for(const page of pages){
  const html=read(page);
  assert.match(html,/data-editorial-photo/);
 }
 const institutional=read("assets/css/institutional.css");
 const home=read("assets/css/pages.css");
 assert.match(institutional,/Editorial product packshots · soft-matte v3/);
 assert.match(institutional,/\.editorial-product-photo:not\(\.editorial-product-photo--scene\)/);
 assert.match(institutional,/\.chapter-hero__art \.editorial-cutout-shell\{\s*mix-blend-mode:normal/);
 assert.match(institutional,/\.chapter-hero__art--candle \.editorial-product-photo--scene\{\s*mix-blend-mode:normal/);
 assert.match(institutional,/-webkit-mask-image:radial-gradient/);
 assert.match(home,/\.collection-tile img\.editorial-product-photo:not\(\.editorial-product-photo--scene\)/);
 assert.match(home,/mix-blend-mode:multiply/);
 assert.match(home,/mask-image:radial-gradient/);
 // Do not convert third-party still lifes into fake transparent product images.
 assert.match(read("espaco-das-velas.html"),/editorial-product-photo--scene/);
 assert.match(read("index.html"),/hero-live-poster\.webp/);
});
