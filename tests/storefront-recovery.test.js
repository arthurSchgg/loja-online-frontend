import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const code=readFileSync(new URL("../assets/js/live.js",import.meta.url),"utf8");

test("the published home has a safe manual retry without demo products",()=>{
 const home=code.slice(code.indexOf("async function initHome()"),code.indexOf("async function initCatalog()"));
 assert.match(home,/const loadFeatured=async\(\)=>/);
 assert.match(home,/loadCatalogPage\(\(index\)=>fetchProducts\(index\),0\)/);
 assert.match(home,/currentProducts\.slice\(0,8\)\.map\(liveProductCard\)/);
 assert.match(home,/retry\.textContent="Tentar novamente"/);
 assert.match(home,/retry\.addEventListener\("click",\(\)=>void loadFeatured\(\),\{once:true\}\)/);
 assert.match(home,/grid\.removeAttribute\("aria-busy"\)/);
 assert.doesNotMatch(home,/PERFUMES\s*\./);
});

test("clearing a category filter before the slow category request returns does not restore it",()=>{
 const catalog=code.slice(code.indexOf("async function initCatalog()"),code.indexOf("async function initProduct()"));
 assert.match(catalog,/if\(familyName&&new URLSearchParams\(location\.search\)\.has\("familia"\)\)\{/);
 assert.match(catalog,/if\(familyName&&new URLSearchParams\(location\.search\)\.has\("familia"\)\)applyServerFilters\(\)/);
 assert.match(catalog,/toolbar\.render\(\)/);
});
