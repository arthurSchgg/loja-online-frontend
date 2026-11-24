import test from "node:test";
import assert from "node:assert/strict";
import {makePreview,validPreview,rememberPreview,readPreview,PREVIEW_TTL,foregroundRecovery} from "../assets/js/catalog-preview.js";
import {onRequest} from "../functions/api/v1/[[path]].js";
import {readFileSync} from "node:fs";
const product={id:1,published:true,name:"Produto teste",price:99,available:true,stockQuantity:8,effectivePrice:70,
 brand:{id:2,name:"Marca"},categories:[{id:3,name:"Categoria"}],images:[{url:"/api/v1/media/11111111-1111-1111-1111-111111111111",position:0}]};
test("previews contain only published metadata and expire",()=>{
 const preview=makePreview([product,{...product,id:2,published:false}],true,1000);
 const data=validPreview(preview,1001);
 assert.equal(data.items.length,1);
 assert.equal(data.items[0].offlineSnapshot,true);
 for(const key of ["price","effectivePrice","available","stockQuantity","published"])assert.equal(data.items[0][key],undefined);
 assert.equal(validPreview(preview,1001+PREVIEW_TTL),null);
 const records=new Map(),storage={setItem:(k,v)=>records.set(k,v),getItem:k=>records.get(k)};
 rememberPreview("catalog",[product],false,1000,storage);
 assert.equal(readPreview("catalog",1500,storage).items[0].name,product.name);
 assert.equal(readPreview("catalog",1001+PREVIEW_TTL,storage),null);
});
test("edge preview is separate from live commercial response and does not contact upstream on cache miss",async()=>{
 const records=new Map(),cache={match:async r=>records.get(r.url)?.clone(),put:async(r,v)=>records.set(r.url,v.clone())};
 const ctx={previewCache:cache,env:{PUBLIC_API_ORIGIN:"https://lojinha-da-katia-api-rjvx.onrender.com"}};
 let upstream=0;
 async function request(path){
  return onRequest({...ctx,request:new Request("https://store.example/api/v1"+path),fetchImpl:async()=>{
   upstream++;return new Response(JSON.stringify({content:[product],last:false}),{headers:{"Content-Type":"application/json"}});
  }});
 }
 assert.equal((await request("/catalog-preview?kind=catalog")).status,404);
 assert.equal(upstream,0);
 const live=await request("/products?page=0&size=12&sort=recent");
 assert.equal(live.headers.get("cache-control"),"no-store");
 assert.equal((await live.json()).content[0].price,99);
 const preview=await request("/catalog-preview?kind=catalog");
 assert.equal((await preview.json()).items[0].price,undefined);
 assert.equal(upstream,1);
});
test("foreground retry stops after bounded attempts and does not run in hidden tabs",async()=>{
 let visible=true,calls=0;const tasks=[];
 const r=foregroundRecovery(async()=>{calls++;},{delays:[1,2],visible:()=>visible,set:(fn)=>{tasks.push(fn);return tasks.length;},clear:()=>{}});
 r.start();visible=false;await tasks.shift()();assert.equal(calls,0);
 visible=true;r.resume();await tasks.shift()();await tasks.shift()();assert.equal(calls,2);
 assert.equal(tasks.length,0);r.stop();
});
test("desktop hides the menu and the public build does not advertise the private administrative entry",()=>{
 const css=readFileSync(new URL("../assets/css/base.css",import.meta.url),"utf8");
 const build=readFileSync(new URL("../tools/build.mjs",import.meta.url),"utf8");
 assert.match(css,/@media\(min-width:1025px\)\{\s*\.mobile-links,\.header-actions \.mobile-toggle\{display:none!important\}/);
 assert.doesNotMatch(build,/\/gestao-da-loja https:\/\//);
});
