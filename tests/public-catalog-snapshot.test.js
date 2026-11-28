import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
 publicCatalogSnapshot,SNAPSHOT_GENERATED_ON,SNAPSHOT_NOTICE,snapshotCatalogPage,
 snapshotCategories,snapshotProduct,canShowPublicSnapshot
} from "../assets/js/public-catalog-snapshot.js";
const source=readFileSync(new URL("../assets/js/live.js",import.meta.url),"utf8");

test("snapshot has the 65 published photo entries without stock, availability or prices",()=>{
 assert.equal(publicCatalogSnapshot.length,65);
 assert.equal(SNAPSHOT_GENERATED_ON,"2026-11-21");
 assert.ok(SNAPSHOT_NOTICE.includes("Preços e disponibilidade"));
 const ids=new Set();
 for(const p of publicCatalogSnapshot){
  assert.ok(Number.isSafeInteger(p.id)&&p.id>0);
  assert.ok(!ids.has(p.id));ids.add(p.id);
  assert.ok(p.name&&p.brand?.name);
  assert.ok(p.images.length>0&&p.images.every(i=>i.url.startsWith("https://")));
  for(const key of ["price","effectivePrice","stockQuantity","stock_quantity","available","phone","whatsapp"]){
   assert.equal(Object.hasOwn(p,key),false,"must not ship outdated commerce: "+key);
  }
 }
});
test("offline catalog paginates all 65 public products without running a search",()=>{
 const all=[];
 for(let page=0;page<6;page++){
  const result=snapshotCatalogPage(page,{});
  all.push(...result.items);
  assert.equal(result.hasNext,page<5);
  assert.equal(result.offlineSnapshot,true);
 }
 assert.equal(all.length,65);
 assert.equal(new Set(all.map(p=>p.id)).size,65);
 assert.ok(all.every(p=>p.offlineSnapshot===true));
 assert.deepEqual(snapshotCatalogPage(6).items,[]);
});
test("offline category and text filters only use saved public fields",()=>{
 const first=publicCatalogSnapshot[0];
 const q=first.name.split(" ").at(0).toLocaleLowerCase("pt-BR");
 const matches=snapshotCatalogPage(0,{q}).items;
 assert.ok(matches.some(p=>p.id===first.id));
 const category=first.categories[0];
 assert.ok(category);
 const categories=snapshotCategories();
 assert.ok(categories.some(c=>c.id===category.id));
 assert.ok(snapshotCatalogPage(0,{categoryId:category.id}).items.every(
  p=>p.categories.some(c=>c.id===category.id)
 ));
 const sorted=snapshotCatalogPage(0,{sort:"name"}).items.map(p=>p.name);
 assert.deepEqual(sorted,[...sorted].sort((a,b)=>a.localeCompare(b,"pt-BR")));
});
test("price filters cannot assert stale data, and an offline product has no sale properties",()=>{
 const result=snapshotCatalogPage(0,{sort:"price-asc",maxPrice:150});
 assert.equal(result.priceFilterUnavailable,true);
 const item=snapshotProduct(result.items[0].id);
 assert.equal(item.offlineSnapshot,true);
 assert.equal(item.available,undefined);
 assert.equal(item.price,undefined);
 assert.equal(snapshotProduct(-1),null);
});
test("only appropriate public API outages show fallback, never aborted/authenticated actions",()=>{
 for(const status of [400,404,408,429,500,502,503,504])
  assert.equal(canShowPublicSnapshot({status}),true);
 assert.equal(canShowPublicSnapshot({name:"ApiError",status:0}),true);
 assert.equal(canShowPublicSnapshot(new TypeError("bug")),false);
 for(const status of [401,403,409,422])
  assert.equal(canShowPublicSnapshot({status}),false);
 assert.equal(canShowPublicSnapshot({name:"AbortError",status:0}),false);
});
test("frontend blocks offline WhatsApp actions and continues to update from real API",()=>{
 assert.match(source,/const preview=p\?\.offlineSnapshot===true/);
 assert.match(source,/const state=preview\?"snapshot"/);
 assert.match(source,/if\(snapshotActive\)/);
 assert.match(source,/snapshotCatalogPage\(page,filters\)/);
 assert.match(source,/state:p\.offlineSnapshot\?"snapshot"/);
 assert.match(readFileSync(new URL("../src/components/ProductDetail.tsx",import.meta.url),"utf8"),/product.state === "snapshot" \? <span className="badge">Aguardando conexão/);
 assert.match(source,/snapshotProduct\(id\)/);
 assert.match(source,/const page=await loadCatalogPage\(\(_index,_filters,signal\)=>fetchFeatured\(signal\),0\)/);
});
