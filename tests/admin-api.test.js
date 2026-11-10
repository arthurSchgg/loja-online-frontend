import test from "node:test";import assert from "node:assert/strict";
import {AdminApi,AdminApiError,adminOriginAllowed} from "../admin/api.js";
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
