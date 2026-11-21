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
test("alpha editorials replace the outdated studio-background workaround",()=>{
 const pages=["index.html","conheca-a-loja.html","contato.html","viva-sua-experiencia.html","espaco-das-velas.html"];
 for(const page of pages){
  const html=read(page);
  assert.match(html,/editorial-product-photo--alpha/);
  assert.match(html,/assets\/images\/editorial\/transparent\//);
 }
 const finish=read("assets/css/editorial-cutouts.css");
 assert.match(finish,/mask:none!important/);
 assert.match(finish,/mix-blend-mode:normal!important/);
 assert.doesNotMatch(finish,/mask-image:url\(/);
 assert.match(read("index.html"),/hero-live-poster\.webp/);
});

test("homepage loads featured products, quiz and offerings independently",()=>{
 const script=read("assets/js/live.js");
 const home=script.slice(script.indexOf("async function initHome(){"),script.indexOf("async function initCatalog(){"));
 assert.match(script,/async function initHomeOfferings\(\)\{/);
 assert.match(script,/currentOfferings=await fetchOfferings\(\)/);
 assert.match(home,/void initHomeOfferings\(\);/);
 assert.match(home,/void loadFeatured\(\);/);
 assert.doesNotMatch(home,/await loadFeatured\(\);/);
 assert.match(home,/const experiences=await fetchExperiences\(\)/);
 assert.match(home,/grid\.removeAttribute\("aria-busy"\)/);
});
