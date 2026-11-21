import test from "node:test";
import assert from "node:assert/strict";
import {validateStagingOrigin,runPublicSmoke} from "../scripts/public-api-smoke.mjs";

test("staging origin only allows HTTPS or local HTTP, without credentials",()=>{
 assert.equal(validateStagingOrigin("https://staging.example.com/"),"https://staging.example.com");
 assert.equal(validateStagingOrigin("http://localhost:8080"),"http://localhost:8080");
 assert.throws(()=>validateStagingOrigin("http://example.com"),/HTTPS/);
 assert.throws(()=>validateStagingOrigin("https://user:pass@staging.example.com"),/credenciais/);
 assert.throws(()=>validateStagingOrigin("https://staging.example.com/api"),/origem/);
});

test("public API smoke validates ascending effective prices across two pages without auth",async()=>{
 const routes=[];
 const response=async(url,opts)=>{
  const u=new URL(url);routes.push(u.pathname);
  assert.equal(opts.method,"GET");
  assert.equal(opts.credentials,"omit");
  const result={
   "/api/v1/categories":[{id:1,name:"Velas"}],
   "/api/v1/store":{displayName:"Loja",whatsapp:null},
   "/api/v1/offerings":[],
   "/api/v1/experiences":[]
  };
  const value=u.pathname==="/api/v1/products"?
   (u.searchParams.get("page")==="0"?
    {content:[{id:2,effectivePrice:10}],last:false}:
    {content:[{id:1,effectivePrice:15}],last:true}):result[u.pathname];
  return {ok:true,status:200,json:async()=>value};
 };
 const result=await runPublicSmoke("https://staging.example.com",response);
 assert.equal(result.productsChecked,2);
 assert.equal(result.categoriesChecked,1);
 assert.ok(routes.includes("/api/v1/products"));
 assert.ok(routes.includes("/api/v1/store"));
});

test("smoke rejects incorrect global ordering and exposed answer keys",async()=>{
 const badSort=async(url)=>({ok:true,status:200,json:async()=>{
  const u=new URL(url);if(u.pathname==="/api/v1/products")
   return u.searchParams.get("page")==="0"?
    {content:[{id:1,effectivePrice:60}],last:false}:
    {content:[{id:2,effectivePrice:20}],last:true};
  return [];
 }});
 await assert.rejects(()=>runPublicSmoke("https://staging.example.com",badSort),/ordenou globalmente/);
 const mock=async(url)=>{
  const path=new URL(url).pathname;
  const output=path==="/api/v1/products"?{content:[],last:true}:
   path==="/api/v1/categories"||path==="/api/v1/offerings"?[]:
   path==="/api/v1/experiences"?[{id:1}]:
   path==="/api/v1/store"?{}:{questions:[{options:[{id:1,resultKey:"secret"}]}]};
  return {ok:true,status:200,json:async()=>output};
 };
 await assert.rejects(()=>runPublicSmoke("https://staging.example.com",mock),/exposta/);
});

test("native consultation prices are explicitly null, unavailable, and ordered last",async()=>{
 const pending={id:9,price:null,effectivePrice:null,priceStatus:"ON_REQUEST",available:false};
 const mock=products=>async(url)=>{
  const path=new URL(url).pathname;
  return {ok:true,status:200,json:async()=>path==="/api/v1/products"?
   {content:products,last:true}:path==="/api/v1/store"?{}:[]};
 };
 assert.equal((await runPublicSmoke("https://staging.example.com",mock([{id:1,price:30},pending]))).productsChecked,2);
 await assert.rejects(()=>runPublicSmoke("https://staging.example.com",mock([pending,{id:1,price:30}])),/confirmados/);
 await assert.rejects(()=>runPublicSmoke("https://staging.example.com",mock([{id:1,price:0}])),/Preço efetivo/);
});
