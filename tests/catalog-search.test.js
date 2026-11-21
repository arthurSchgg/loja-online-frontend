import test from "node:test";
import assert from "node:assert/strict";
import {createCatalogSearch} from "../assets/js/catalog-search.js";

test("server-side filters persist through pagination and reset to page zero",async()=>{
 const received=[];
 const catalog=createCatalogSearch(async(page,filters)=>{
  received.push({page,...filters});
  return {items:[{id:page+1,name:"Item"}],hasNext:page===0};
 });
 catalog.setFilters({q:"  vela floral  ",categoryId:"7"});
 assert.deepEqual((await catalog.next()).items.map(p=>p.id),[1]);
 assert.equal((await catalog.next()).hasNext,false);
 assert.deepEqual(received,[
  {page:0,q:"vela floral",categoryId:7,sort:"recent",maxPrice:null},
  {page:1,q:"vela floral",categoryId:7,sort:"recent",maxPrice:null}
 ]);
 catalog.setFilters({q:"natura",categoryId:null});
 assert.equal(catalog.state.page,0);
 assert.deepEqual(catalog.state.items,[]);
 await catalog.next();
 assert.deepEqual(received[2],{page:0,q:"natura",categoryId:null,sort:"recent",maxPrice:null});
});

test("late responses from old search must not appear in a newer filter",async()=>{
 let release;
 const oldResponse=new Promise(resolve=>{release=resolve;});
 const received=[];
 const catalog=createCatalogSearch(async(page,filters)=>{
  received.push(filters.q);
  return filters.q==="old"?oldResponse:{items:[{id:2,name:"new"}],hasNext:false};
 });
 catalog.setFilters({q:"old"});
 const old=catalog.next();
 catalog.setFilters({q:"new"});
 const fresh=await catalog.next();
 release({items:[{id:1,name:"old"}],hasNext:true});
 const outdated=await old;
 assert.equal(outdated.stale,true);
 assert.deepEqual(fresh.items.map(p=>p.name),["new"]);
 assert.deepEqual(catalog.state.items.map(p=>p.name),["new"]);
 assert.deepEqual(received,["old","new"]);
});

test("request errors preserve page for retry without skipping it",async()=>{
 let attempts=0;
 const catalog=createCatalogSearch(async(page)=>{
  assert.equal(page,0);
  if(++attempts===1)throw new Error("offline");
  return {items:[{id:7}],hasNext:false};
 });
 await assert.rejects(()=>catalog.next(),/offline/);
 assert.equal(catalog.state.page,0);
 assert.deepEqual((await catalog.next()).items.map(p=>p.id),[7]);
 assert.equal(attempts,2);
});

test("a duplicate click shares one request and duplicate items are deduplicated",async()=>{
 let requests=0;
 const catalog=createCatalogSearch(async(page)=>{
  requests++;
  await Promise.resolve();
  return {items:page===0?[{id:4},{id:4}]:[{id:4},{id:5}],hasNext:page===0};
 });
 const [a,b]=await Promise.all([catalog.next(),catalog.next()]);
 assert.equal(requests,1);
 assert.deepEqual(a.items.map(p=>p.id),[4]);
 assert.deepEqual(b.items.map(p=>p.id),[4]);
 assert.deepEqual((await catalog.next()).items.map(p=>p.id),[4,5]);
 assert.equal(catalog.state.hasNext,false);
});

test("invalid categories and malformed pages are rejected",async()=>{
 const catalog=createCatalogSearch(async()=>({content:[]}));
 assert.throws(()=>catalog.setFilters({categoryId:"oops"}),/Categoria inválida/);
 catalog.setFilters({categoryId:null});
 await assert.rejects(()=>catalog.next(),/Página inválida/);
 assert.equal(catalog.state.page,0);
});

test("changing price ceiling or global order restarts server pagination",async()=>{
 const received=[];
 const catalog=createCatalogSearch(async(page,filters)=>{
  received.push({page,...filters});
  return {items:[{id:page+2}],hasNext:page===0};
 });
 catalog.setFilters({sort:"price-asc",maxPrice:"39.90"});
 await catalog.next();
 await catalog.next();
 catalog.setFilters({sort:"price-desc",maxPrice:"100"});
 assert.equal(catalog.state.page,0);
 assert.equal(catalog.state.items.length,0);
 await catalog.next();
 assert.deepEqual(received,[
  {page:0,q:"",categoryId:null,sort:"price-asc",maxPrice:39.9},
  {page:1,q:"",categoryId:null,sort:"price-asc",maxPrice:39.9},
  {page:0,q:"",categoryId:null,sort:"price-desc",maxPrice:100}
 ]);
 assert.throws(()=>catalog.setFilters({sort:"unknown"}),/Ordenação inválida/);
 assert.throws(()=>catalog.setFilters({maxPrice:-1}),/Preço máximo inválido/);
});

test("changing filters aborts the previous in-flight request immediately",async()=>{
 let firstSignal;
 let observeAbort;
 const aborted=new Promise(resolve=>{observeAbort=resolve;});
 const catalog=createCatalogSearch((page,filters,signal)=>{
  if(filters.q==="old"){
   firstSignal=signal;
   signal.addEventListener("abort",observeAbort,{once:true});
   return new Promise((resolve,reject)=>{
    signal.addEventListener("abort",()=>reject(Object.assign(new Error("aborted"),{name:"AbortError"})),{once:true});
   });
  }
  return Promise.resolve({items:[{id:7,name:"new"}],hasNext:false});
 });
 catalog.setFilters({q:"old"});
 const oldPromise=catalog.next();
 catalog.setFilters({q:"new"});
 await aborted;
 assert.equal(firstSignal.aborted,true);
 const latest=await catalog.next();
 const outdated=await oldPromise;
 assert.equal(outdated.stale,true);
 assert.deepEqual(latest.items.map(p=>p.name),["new"]);
});

test("a live pagination failure cannot append outdated snapshot rows",async()=>{
 let temporary=true;
 const catalog=createCatalogSearch(async(page)=>{
  if(page===0)return {items:[{id:1}],hasNext:true,source:"live"};
  if(temporary)return {items:[{id:3}],hasNext:false,source:"snapshot"};
  return {items:[{id:2}],hasNext:false,source:"live"};
 });
 await catalog.next();
 await assert.rejects(()=>catalog.next(),/origem/i);
 assert.equal(catalog.state.page,1);
 assert.deepEqual(catalog.state.items.map(p=>p.id),[1]);
 temporary=false;
 assert.deepEqual((await catalog.next()).items.map(p=>p.id),[1,2]);
});

test("returning to the page revalidates loaded pages atomically",async()=>{
 let broken=false;
 const catalog=createCatalogSearch(async(page,filters,signal,context)=>{
  if(context.refresh&&page===1&&broken)throw new Error("offline");
  return {items:[{id:page+1,price:context.refresh?45:20}],hasNext:page===0,source:"live"};
 });
 await catalog.next();await catalog.next();
 broken=true;
 await assert.rejects(()=>catalog.refreshLoaded(),/offline/);
 assert.deepEqual(catalog.state.items.map(p=>p.price),[20,20]);
 broken=false;
 const state=await catalog.refreshLoaded();
 assert.equal(state.page,2);
 assert.deepEqual(state.items.map(p=>p.price),[45,45]);
});
