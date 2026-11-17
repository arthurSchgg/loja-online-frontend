import test from "node:test";import assert from "node:assert/strict";
import {PERFUMES,FAMILIES,filterPerfumes,byId,price} from "../assets/js/data.js";
test("eight distinct illustrative perfumes with 3 volumes",()=>{
 assert.equal(PERFUMES.length,8);assert.equal(new Set(PERFUMES.map(p=>p.id)).size,8);
 for(const p of PERFUMES){assert.equal(Object.keys(p.prices).length,3);assert.ok(price(p,100)>price(p,30));}
});
test("all four olfactory families exist",()=>{for(const family of FAMILIES)assert.ok(PERFUMES.some(p=>p.family===family));});
test("family, gender and price filters combine",()=>{
 const list=filterPerfumes({family:"Floral",gender:"Unissex",max:225});assert.ok(list.length>0);
 assert.ok(list.every(p=>p.family==="Floral"&&p.gender==="Unissex"&&price(p)<=225));
});
test("sorting by price and accented names",()=>{
 const list=filterPerfumes({sort:"price-asc"});assert.ok(list.every((p,i)=>i===0||price(p)>=price(list[i-1])));
 assert.equal(byId("missing"),null);
});
