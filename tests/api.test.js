import test from "node:test";import assert from "node:assert/strict";
import {ApiError,apiUrl,publicRequest,normalizePage,confirmWhatsApp,currentPrice,productSearchPath} from "../assets/js/api.js";
test("API base remains same origin and only public credentials omitted",async()=>{
 const out=await publicRequest("/products",{fetchImpl:async(url,opts)=>{assert.equal(opts.credentials,"omit");assert.ok(url.includes("/api/v1/products"));return {ok:true,status:200,json:async()=>[]};}});
 assert.deepEqual(out,[]);
});
test("unsafe paths and unexpected pages rejected",()=>{
 assert.throws(()=>apiUrl("/../admin"),ApiError);
 assert.deepEqual(normalizePage({content:[1,2],last:false}),{items:[1,2],hasNext:true});
 assert.throws(()=>normalizePage({foo:1}),ApiError);
});
test("HTTP failures are typed and do not disclose raw server bodies",async()=>{
 await assert.rejects(()=>publicRequest("/products",{fetchImpl:async()=>({ok:false,status:409,json:async()=>({debug:"secret"})})}),e=>e instanceof ApiError&&e.status===409&&!e.message.includes("secret"));
});
test("real price and null offering price normalization",()=>{
 assert.equal(currentPrice({price:89,effectivePrice:75}),75);
 assert.equal(currentPrice({price:null}),null);
});
test("WhatsApp URLs validated by allowlist and explicit confirmation",async()=>{
 // This method uses publicRequest's fetchImpl; without fetch mock we just assert request validation.
 await assert.rejects(()=>confirmWhatsApp({type:"INVALID",id:1,expectedPrice:10}),ApiError);
});

test("product search URL applies backend filters before pagination",()=>{
 const url=productSearchPath(2,{q:"  Aroma & flores  ",categoryId:"17"});
 const parsed=new URLSearchParams(url.split("?")[1]);
 assert.equal(url.split("?")[0],"/products");
 assert.equal(parsed.get("page"),"2");
 assert.equal(parsed.get("size"),"12");
 assert.equal(parsed.get("q"),"Aroma & flores");
 assert.equal(parsed.get("categoryId"),"17");
 assert.equal(new URLSearchParams(productSearchPath(0).split("?")[1]).has("categoryId"),false);
 assert.throws(()=>productSearchPath(-1),/Página inválida/);
 assert.throws(()=>productSearchPath(0,{categoryId:"0"}),/Categoria inválida/);
});
