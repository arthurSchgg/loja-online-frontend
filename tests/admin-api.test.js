import test from "node:test";import assert from "node:assert/strict";
import {AdminApi,AdminApiError,adminOriginAllowed,validateAdminPath} from "../admin/api.js";
test("admin denied on non-HTTPS outside localhost",()=>{
 assert.equal(adminOriginAllowed({protocol:"http:",hostname:"example.org"}),false);
 assert.equal(adminOriginAllowed({protocol:"https:",hostname:"shop.example"}),true);
 assert.equal(adminOriginAllowed({protocol:"http:",hostname:"localhost"}),true);
});
test("admin client gets CSRF and keeps same-origin credentials",async()=>{
 const seen=[];
 const api=new AdminApi(async(path,opts)=>{
  seen.push({path,opts});
  if(path.endsWith("/auth/csrf"))return {ok:true,status:200,json:async()=>({headerName:"X-CSRF-TOKEN",token:"test-token"})};
  return {ok:true,status:200,json:async()=>({ok:true})};
 });
 await api.write("POST","/admin/brands",{name:"Marca teste"});
 assert.equal(seen[0].path,"/api/v1/auth/csrf");
 assert.equal(seen[1].opts.credentials,"same-origin");
 assert.equal(seen[1].opts.headers["X-CSRF-TOKEN"],"test-token");
});
test("admin client rejects non-admin writes and sanitizes failures",async()=>{
 const api=new AdminApi(async()=>({ok:false,status:403,json:async()=>({secret:"token"})}));
 await assert.rejects(()=>api.write("POST","/products",{}),AdminApiError);
 await assert.rejects(()=>api.get("/admin/brands"),err=>err.status===403&&!err.message.includes("secret"));
});
test("login uses form encoding, never persists tokens",async()=>{
 let count=0;
 const client=new AdminApi(async(path,opts)=>{count++;
  if(path.endsWith("/csrf"))return {ok:true,status:200,json:async()=>({headerName:"X-CSRF-TOKEN",token:"x"})};
  if(path.endsWith("/login")){assert.equal(opts.body.get("username"),"admin");assert.equal(opts.body.get("password"),"secret");}
  return {ok:true,status:200,json:async()=>({authenticated:true,username:"admin"})};
 });
 const me=await client.login("admin","secret");assert.equal(me.username,"admin");assert.ok(count>=4);
});


test("administrative API blocks path traversal and disguised external paths",()=>{
 for(const raw of [
  "//evil.example", "/admin//users", "/admin/../auth/me",
  "/admin/%2e%2e/auth/me", "/admin/%2f%2fevil", "/admin/brands#hidden",
  "/admin/brands\\evil", "/admin/brands\nInjected", "https://evil.example/admin", ""
 ])assert.throws(()=>validateAdminPath(raw),AdminApiError);
 assert.equal(validateAdminPath("/admin/products/17/stock/movements?page=0&size=10"),
  "/admin/products/17/stock/movements?page=0&size=10");
 assert.equal(validateAdminPath("/auth/csrf"),"/auth/csrf");
 assert.equal(validateAdminPath("/store"),"/store");
});

test("admin requests do not follow redirects or leak referrer across origins",async()=>{
 const api=new AdminApi(async(path,options)=>{
  assert.equal(options.redirect,"error");
  assert.equal(options.referrerPolicy,"same-origin");
  assert.equal(options.credentials,"same-origin");
  assert.equal(options.cache,"no-store");
  return {ok:true,status:200,json:async()=>({authenticated:true})};
 });
 assert.equal((await api.me()).authenticated,true);
});

test("unexpected CSRF header names and empty tokens are rejected",async()=>{
 for(const data of [{headerName:"X-Injection",token:"abc"},
  {headerName:"X-CSRF-TOKEN",token:""}]){
  const api=new AdminApi(async()=>({ok:true,status:200,json:async()=>data}));
  await assert.rejects(()=>api.refreshCsrf(),/CSRF/);
 }
});
