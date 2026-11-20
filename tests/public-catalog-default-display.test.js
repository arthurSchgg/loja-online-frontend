import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const source=readFileSync(new URL("../assets/js/live.js",import.meta.url),"utf8");
const api=readFileSync(new URL("../assets/js/api.js",import.meta.url),"utf8");
const home=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const catalog=readFileSync(new URL("../catalogo.html",import.meta.url),"utf8");
const visual=readFileSync(new URL("../assets/css/institutional.css",import.meta.url),"utf8");

test("homepage shows up to eight real published products without requiring a search",()=>{
 assert.match(source,/loadCatalogPage\(\(index\)=>fetchProducts\(index\),0\)/);
 assert.match(source,/currentProducts\.slice\(0,8\)\.map\(liveProductCard\)/);
 assert.match(home,/id="featured-grid"/);
 assert.match(home,/VITRINE DA LOJA/);
 assert.doesNotMatch(source,/stock_quantity\s*=/);
});

test("first public catalog listing starts independently from category discovery",()=>{
 const load=source.indexOf("async function initCatalog()");
 assert.ok(load>=0);
 const catalogInit=source.slice(load,source.indexOf("async function initProduct()",load));
 assert.match(catalogInit,/const search=createCatalogSearch/);
 assert.match(catalogInit,/if\(!familyName\)count\.textContent/);
 // This branch must start the product fetch before the optional category request.
 assert.match(catalogInit,/else applyServerFilters\(\);\s*void loadCategories\(\);/);
 assert.match(catalogInit,/const categoryField=family\.closest/);
 assert.match(catalogInit,/categoryField\.hidden=true/);
 assert.match(catalogInit,/grid\.innerHTML=state\.items\.map\(liveProductCard\)/);
 assert.match(api,/new URLSearchParams\(\{page:String\(number\),size:"12"\}\)/);
 assert.match(api,/if\(q\)query\.set\("q",q\)/);
 assert.match(source,/available=!!p\.available/);
});

test("smaller photo blends into the editorial background while preserving animations",()=>{
 assert.match(visual,/\.chapter-hero__art\{isolation:auto\}/);
 assert.match(visual,/\.chapter-hero__art \.editorial-cutout-shell\{\s*width:min\(69%,350px\);/);
 assert.match(visual,/mix-blend-mode:multiply/);
 assert.match(visual,/\.chapter-hero__art \.editorial-product-photo:not\(\.editorial-product-photo--scene\)/);
 assert.match(visual,/@media\(max-width:560px\)/);
 assert.match(visual,/prefers-reduced-motion:reduce/);
 assert.match(catalog,/Catálogo de Produtos/);
});
