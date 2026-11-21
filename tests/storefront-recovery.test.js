import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const code=readFileSync(new URL("../assets/js/live.js",import.meta.url),"utf8");

test("home retains a manual retry without fabricated or buyable products",()=>{
 const home=code.slice(code.indexOf("async function initHome()"),code.indexOf("async function initCatalog()"));
 assert.match(home,/const loadFeatured=async\(\)=>/);
 assert.match(home,/loadCatalogPage\(\(index\)=>fetchProducts\(index\),0\)/);
 assert.match(home,/retry\.textContent="Tentar novamente"/);
 assert.match(home,/retry\.addEventListener\("click",\(\)=>void loadFeatured\(\),\{once:true\}\)/);
 assert.match(home,/grid\.removeAttribute\("aria-busy"\)/);
 assert.match(home,/showSnapshotNotice\(grid/);
 assert.doesNotMatch(home,/PERFUMES\s*\./);
});
test("slow category requests do not hide public categories or restore discarded filters",()=>{
 const catalog=code.slice(code.indexOf("async function initCatalog()"),code.indexOf("async function initProduct()"));
 assert.match(catalog,/const initialCategories=snapshotCategories\(\)/);
 assert.match(catalog,/paintCategories\(initialCategories\)/);
 assert.match(catalog,/if\(familyName&&new URLSearchParams\(location\.search\)\.has\("familia"\)\)/);
 assert.match(catalog,/if\(before!==family.value\)applyServerFilters\(\)/);
 assert.match(catalog,/toolbar\.render\(\)/);
});
