import test from "node:test";
import assert from "node:assert/strict";
import {isUnfilteredFirstPage,transientCatalogError,loadCatalogPage} from "../assets/js/public-catalog-load.js";

test("initial catalog page does not require a search or availability filter",()=>{
 assert.equal(isUnfilteredFirstPage(0,{}),true);
 assert.equal(isUnfilteredFirstPage(0,{q:"",categoryId:null,maxPrice:null,sort:"recent"}),true);
 assert.equal(isUnfilteredFirstPage(0,{q:"lily"}),false);
 assert.equal(isUnfilteredFirstPage(0,{categoryId:3}),false);
 assert.equal(isUnfilteredFirstPage(1,{}),false);
});
test("retry only temporary connection and server outages",()=>{
 assert.equal(transientCatalogError({status:503}),true);
 assert.equal(transientCatalogError({status:0}),true);
 assert.equal(transientCatalogError({status:400}),false);
 assert.equal(transientCatalogError({status:404}),false);
});
test("first unfiltered page recovers automatically from a temporary failure",async()=>{
 let calls=0;const waits=[];
 const page=await loadCatalogPage(async()=>{
  calls++;
  if(calls===1)throw {status:503};
  return {items:[{id:1,published:true,available:false}],hasNext:false};
 },0,{},async delay=>{waits.push(delay);});
 assert.equal(calls,2);
 assert.deepEqual(waits,[1400]);
 assert.equal(page.items[0].available,false);
});
test("a filtered search fails immediately without retrying obsolete results",async()=>{
 let calls=0;
 await assert.rejects(()=>loadCatalogPage(async()=>{calls++;throw {status:503}},0,{q:"kit"},async()=>{}));
 assert.equal(calls,1);
});
test("first page gives a useful failure after bounded retries",async()=>{
 let calls=0;
 await assert.rejects(()=>loadCatalogPage(async()=>{calls++;throw {status:503}},0,{},async()=>{}));
 assert.equal(calls,4);
});
