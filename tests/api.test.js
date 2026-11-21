import test from "node:test";import assert from "node:assert/strict";
import {ApiError,apiUrl,publicRequest,normalizePage,confirmWhatsApp,currentPrice,productSearchPath,validateWhatsAppUrl,publicCacheMode} from "../assets/js/api.js";
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
 assert.equal(currentPrice({price:0,priceStatus:"ON_REQUEST"}),null);
});

test("only non-commercial metadata may use the browser's short HTTP cache",()=>{
 for(const path of ["/categories","/brands","/store","/content-sections"])
  assert.equal(publicCacheMode(path),"default");
 for(const path of ["/products","/products/1","/offerings","/campaigns","/whatsapp/confirm"])
  assert.equal(publicCacheMode(path),"no-store");
 assert.equal(publicCacheMode("/store","POST"),"no-store");
});

test("public client distinguishes user cancellation from a bounded server timeout",async()=>{
 const fetchImpl=(url,options)=>new Promise((resolve,reject)=>{
  options.signal.addEventListener("abort",()=>reject(new DOMException("aborted","AbortError")),{once:true});
 });
 await assert.rejects(()=>publicRequest("/products",{timeoutMs:10,fetchImpl}),error=>error instanceof ApiError&&error.status===504);
 const controller=new AbortController();
 const pending=publicRequest("/products",{signal:controller.signal,fetchImpl});
 controller.abort();
 await assert.rejects(()=>pending,error=>error.name==="AbortError");
});

test("search text is independent of the path safety checks",()=>{
 assert.match(apiUrl(productSearchPath(0,{q:"Aroma... floral",brandId:7})),/q=Aroma\.\.\./);
});

test("unconfirmed product values cannot be sent to the confirmation endpoint",async()=>{
 await assert.rejects(()=>confirmWhatsApp({type:"PRODUCT",id:1,expectedPrice:null}),/preço/);
 await assert.rejects(()=>confirmWhatsApp({type:"PRODUCT",id:1,expectedPrice:0}),/preço/);
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

test("server sorts on effective price and validates max price",()=>{
 const path=productSearchPath(1,{q:"Vela",categoryId:7,sort:"price-asc",maxPrice:"99.90"});
 const params=new URLSearchParams(path.split("?")[1]);
 assert.equal(params.get("page"),"1");
 assert.equal(params.get("sort"),"price-asc");
 assert.equal(params.get("maxPrice"),"99.90");
 assert.equal(params.get("categoryId"),"7");
 assert.equal(new URLSearchParams(productSearchPath().split("?")[1]).get("sort"),"recent");
 assert.equal(new URLSearchParams(productSearchPath(0,{maxPrice:null}).split("?")[1]).has("maxPrice"),false);
 assert.throws(()=>productSearchPath(0,{sort:"id,desc"}),/Ordenação inválida/);
 assert.throws(()=>productSearchPath(0,{maxPrice:"-1"}),/Preço máximo inválido/);
 assert.throws(()=>productSearchPath(0,{maxPrice:"not a number"}),/Preço máximo inválido/);
});


test("WhatsApp link validation accepts only authorized phone-specific URLs",()=>{
 const valid="https://wa.me/5547999999999?text=Ol%C3%A1%20loja";
 assert.equal(validateWhatsAppUrl(valid),valid);
 assert.equal(validateWhatsAppUrl("https://api.whatsapp.com/send?phone=5547999999999&text=Ola"),
  "https://api.whatsapp.com/send?phone=5547999999999&text=Ola");
 for(const unsafe of [
  "https://attacker.example/?next=wa.me",
  "https://wa.me.evil.example/5547999999999",
  "http://wa.me/5547999999999",
  "https://user:password@wa.me/5547999999999",
  "https://wa.me:443/invalid",
  "https://wa.me/5547999999999/extra",
  "https://wa.me/not-a-number",
  "https://wa.me/5547999999999#irrelevant",
  "https://api.whatsapp.com/send?phone=bad",
  "https://api.whatsapp.com/other?phone=5547999999999",
  "javascript:alert(1)"
 ])assert.throws(()=>validateWhatsAppUrl(unsafe),ApiError);
 assert.throws(()=>validateWhatsAppUrl(null),ApiError);
});
