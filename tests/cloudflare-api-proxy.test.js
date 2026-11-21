import test from "node:test";
import assert from "node:assert/strict";
import {onRequest} from "../functions/api/v1/[[path]].js";

const origin="https://lojinha-da-katia-api.onrender.com";
const make=(url,options={},vars={})=>({
 request:new Request("https://lojinha.pages.dev"+url,options),
 env:{PUBLIC_API_ORIGIN:origin,...vars},
 fetchImpl:async()=>{throw new Error("Unexpected network call");}
});
test("public list preserves query, strips cookies and never caches",async()=>{
 const calls=[];
 const context=make("/api/v1/products?page=2&size=12",{headers:{Cookie:"JSESSIONID=bad",Authorization:"secret"}});
 context.fetchImpl=async(url,options)=>{
  calls.push({url,options});
  return new Response('{"content":[]}',{headers:{"Content-Type":"application/json","Set-Cookie":"unsafe=x"}});
 };
 const response=await onRequest(context);
 assert.equal(response.status,200);
 assert.equal(calls[0].url,origin+"/api/v1/products?page=2&size=12");
 assert.equal(calls[0].options.method,"GET");
 assert.equal(calls[0].options.headers.get("cookie"),null);
 assert.equal(calls[0].options.headers.get("authorization"),null);
 assert.equal(response.headers.get("set-cookie"),null);
 assert.equal(response.headers.get("cache-control"),"no-store");
});
test("public API never exposes admin or auth routes",async()=>{
 for(const path of ["/api/v1/admin/products","/api/v1/auth/login","/api/v1/actuator/health",
  "/api/v1/products/1/../../admin/products","/api/v1/products/1/delete"]){
  const result=await onRequest(make(path));
  assert.equal(result.status,404,path);
 }
});
test("only expected POST actions with JSON are forwarded",async()=>{
 const context=make("/api/v1/whatsapp/confirm",{
  method:"POST",headers:{"Content-Type":"application/json","Cookie":"session=private"},
  body:JSON.stringify({type:"PRODUCT",id:1,expectedPrice:99.9,customizations:{}})
 });
 context.fetchImpl=async(url,options)=>{
  assert.equal(url,origin+"/api/v1/whatsapp/confirm");
  assert.equal(options.method,"POST");
  assert.equal(options.headers.get("cookie"),null);
  assert.match(options.body,/"PRODUCT"/);
  return new Response('{"message":"ok"}',{headers:{"Content-Type":"application/json"}});
 };
 assert.equal((await onRequest(context)).status,200);
 assert.equal((await onRequest(make("/api/v1/products",{method:"POST",headers:{"Content-Type":"application/json"},body:"{}"}))).status,404);
 assert.equal((await onRequest(make("/api/v1/experiences/1/evaluate",{method:"POST",body:"{}"}))).status,415);
});
test("rejects misconfigured upstream and non-JSON or redirect responses",async()=>{
 assert.equal((await onRequest(make("/api/v1/store",{}, {PUBLIC_API_ORIGIN:"http://internal.test"}))).status,503);
 const html=make("/api/v1/store");
 html.fetchImpl=async()=>new Response("<h1>err</h1>",{headers:{"Content-Type":"text/html"}});
 assert.equal((await onRequest(html)).status,502);
 const redirect=make("/api/v1/store");
 redirect.fetchImpl=async()=>new Response(null,{status:302,headers:{"Location":"https://example.com"}});
 assert.equal((await onRequest(redirect)).status,502);
});
test("rejects excessively large POST payload",async()=>{
 const request=make("/api/v1/experiences/123/evaluate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({answers:"x".repeat(12200)})});
 assert.equal((await onRequest(request)).status,413);
});

test("slow public upstream is bounded and produces a retryable 504 without leaking data",async()=>{
 const context=make("/api/v1/products?page=0");
 context.fetchImpl=async(url,options)=>{
  assert.ok(options.signal instanceof AbortSignal);
  assert.equal(options.signal.aborted,false);
  assert.equal(options.method,"GET");
  throw Object.assign(new Error("upstream deadline"),{name:"TimeoutError"});
 };
 const response=await onRequest(context);
 assert.equal(response.status,504);
 assert.equal(response.headers.get("cache-control"),"no-store");
 assert.equal(response.headers.get("set-cookie"),null);
 assert.match((await response.json()).title,/demorou a responder/);
});
