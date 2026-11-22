import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const source=read("assets/js/live.js");
const api=read("assets/js/api.js");
const home=read("index.html");
const catalog=read("catalogo.html");
const visual=read("assets/css/institutional.css");

test("home shows public photos immediately and refreshes from live API",()=>{
 assert.match(source,/grid\.innerHTML=preview\.items\.slice\(0,8\)\.map\(liveProductCard\)/);
 assert.match(source,/loadCatalogPage\(\(_index,_filters,signal\)=>fetchFeatured\(signal\),0\)/);
 assert.match(source,/currentProducts\.slice\(0,8\)\.map\(liveProductCard\)/);
 assert.match(home,/id="featured-grid"/);
 assert.match(home,/VITRINE DA LOJA/);
 assert.doesNotMatch(source,/stock_quantity\s*=/);
});
test("first catalog page renders a read-only preview before product API, independently of categories",()=>{
 const start=source.indexOf("async function initCatalog()");
 const end=source.indexOf("async function initProduct()",start);
 const init=source.slice(start,end);
 assert.match(init,/const search=createCatalogSearch/);
 assert.match(init,/const initialCategories=snapshotCategories\(\)/);
 assert.match(init,/paintCategories\(initialCategories\)/);
 assert.match(init,/applyServerFilters\(\);\s*void loadCategories\(\)/);
 assert.doesNotMatch(init,/categoryField\.hidden=true/);
 assert.match(init,/grid\.innerHTML=state\.items\.map\(liveProductCard\)/);
 assert.match(api,/new URLSearchParams\(\{page:String\(number\),size:"12"\}\)/);
 assert.match(api,/if\(q\)query\.set\("q",q\)/);
 assert.match(source,/available=!!p\.available/);
});
test("photography and reduced-motion protections are preserved",()=>{
 assert.match(visual,/\.chapter-hero__art\{isolation:auto\}/);
 assert.match(visual,/\.chapter-hero__art \.editorial-cutout-shell\{\s*width:min\(69%,350px\);/);
 assert.match(visual,/mix-blend-mode:multiply/);
 assert.match(visual,/prefers-reduced-motion:reduce/);
 assert.match(catalog,/Catálogo de Produtos/);
});
