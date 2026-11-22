import test from "node:test";
import assert from "node:assert/strict";
import {managedPhoto,photoReference,photoPreview,parsePhotoLines,serializePhotos} from "../admin/photo-editor.js";
import {validateTemplate,exampleMessage} from "../admin/owner-tools.js";
import {validateProductImages} from "../admin/product-validation.js";
import {AdminApi} from "../admin/api.js";
import {fetchFeatured} from "../assets/js/api.js";
import {visibleBanners,internalBannerLink} from "../assets/js/campaign-banners.js";
import {onRequest} from "../functions/api/v1/[[path]].js";

const path="/api/v1/media/e0ac23e2-f496-4f7d-b570-ef66b45db10d";
test("photo references are canonical; authenticated preview is same-origin",()=>{
 assert.equal(managedPhoto(path),true);
 assert.equal(photoPreview(path,"https://store.example"),path.replace("/media/","/admin/media/"));
 assert.equal(photoPreview("assets/images/catalogo/skelt/example.webp","https://store.example/"),"https://store.example/assets/images/catalogo/skelt/example.webp");
 assert.equal(photoReference("https://example.invalid/photo.jpg"),true);
 for(const url of [path+"?anything",path+"/other","http://example.invalid/image.jpg","https://name@example.invalid/a","https://example.invalid/a#fragment"])
  assert.equal(photoReference(url),false);
});
test("photo lines preserve order and alt text, and reject duplicate photos",()=>{
 const a=[{url:path,altText:"Frasco | azul"},{url:"https://example.invalid/cover.jpg",altText:"Outra foto"}];
 const parsed=parsePhotoLines(serializePhotos(a));
 assert.deepEqual(parsed,a.map((x,position)=>({...x,position})));
 assert.doesNotThrow(()=>validateProductImages(parsed,true));
 assert.throws(()=>validateProductImages([parsed[0],parsed[0]],true));
});
test("multipart uses standard browser boundary, admin CSRF, and same-origin session",async()=>{
 const requests=[];
 const api=new AdminApi(async(url,options)=>{
  requests.push({url,options});
  const data=url.endsWith("/csrf")?{headerName:"X-CSRF-TOKEN",token:"test-only"}:{url:path};
  return new Response(JSON.stringify(data),{headers:{"Content-Type":"application/json"}});
 });
 await api.uploadPhoto(new Blob(["synthetic"],{type:"image/jpeg"}));
 const {url,options}=requests.at(-1);
 assert.equal(url,"/api/v1/admin/media");
 assert.equal(options.headers["X-CSRF-TOKEN"],"test-only");
 assert.equal(options.headers["Content-Type"],undefined);
 assert.equal(options.credentials,"same-origin");
 assert.ok(options.body instanceof FormData);
});
test("owner templates retain required values and display example rather than commercial data",()=>{
 const template="Quero {{nome}} por {{preco}}.{{personalizacao}}";
 assert.equal(validateTemplate(template,["nome","preco","personalizacao"]),template);
 assert.match(exampleMessage(template,"CANDLE"),/Vela de exemplo.*Valor sob consulta.*Personalização/);
 assert.throws(()=>validateTemplate("Olá {{nome}}",["nome","preco"]));
 assert.throws(()=>validateTemplate("{{nome}} {{preco}} {{outro}}",["nome","preco"]));
});
test("featured order is exactly selected; old backend gracefully falls back to published catalog",async()=>{
 const original=globalThis.fetch;
 try{
  globalThis.fetch=async()=>new Response(JSON.stringify({customized:true,products:[{id:2,published:true},{id:1,published:true},{id:3,published:false}]}));
  assert.deepEqual((await fetchFeatured()).items.map(x=>x.id),[2,1]);
  globalThis.fetch=async url=>url.includes("storefront/featured")?new Response(null,{status:404}):new Response(JSON.stringify({content:[{id:1}],last:true}));
  assert.equal((await fetchFeatured()).items[0].id,1);
 }finally{globalThis.fetch=original;}
});
test("banners obey publication, time, order and only link to internal known destinations",()=>{
 const rows=visibleBanners([
  {title:"Second",published:true,imageUrl:path,linkUrl:"https://example.invalid/",position:2},
  {title:"First",published:true,imageUrl:path,linkUrl:"/catalogo.html?categoryId=12",position:1},
  {title:"Future",published:true,imageUrl:path,startsAt:"2100-01-01T00:00:00Z"},
  {title:"Draft",published:false,imageUrl:path}
 ],"https://store.example",Date.parse("2026-01-01"));
 assert.deepEqual(rows.map(x=>x.title),["First","Second"]);
 assert.equal(rows[0].href,"/catalogo.html?categoryId=12");assert.equal(rows[1].href,null);
 assert.equal(internalBannerLink("/produto.html?productId=12"),"/produto.html?productId=12");
});
test("public proxy forwards only published raster responses and conditional ETag; strips cookies",async()=>{
 const body=new Uint8Array([1,2,3,4]),tag='"'+"a".repeat(64)+'"';
 const ctx={request:new Request("https://store.example"+path,{headers:{Cookie:"test-session","If-None-Match":tag}}),
  env:{PUBLIC_API_ORIGIN:"https://lojinha-da-katia-api.onrender.com"},
  fetchImpl:async(url,opts)=>{
   assert.equal(opts.headers.get("cookie"),null);assert.equal(opts.headers.get("if-none-match"),tag);
   assert.equal(new URL(url).pathname,path);
   return new Response(body,{headers:{"Content-Type":"image/jpeg","Content-Length":"4","ETag":tag,"Set-Cookie":"private=1"}});
  }};
 const result=await onRequest(ctx);
 assert.equal(result.status,200);assert.equal(result.headers.get("set-cookie"),null);
 assert.equal(result.headers.get("content-type"),"image/jpeg");assert.equal(result.headers.get("etag"),tag);
 assert.match(result.headers.get("cache-control"),/max-age=3600/);
 assert.deepEqual(new Uint8Array(await result.arrayBuffer()),body);
 ctx.fetchImpl=async()=>new Response(null,{status:304,headers:{ETag:tag}});
 assert.equal((await onRequest(ctx)).status,304);
 ctx.fetchImpl=async()=>new Response("not found",{status:404});
 assert.equal((await onRequest(ctx)).status,404);
 ctx.fetchImpl=async()=>new Response("<svg/>",{headers:{"Content-Type":"image/svg+xml","Content-Length":"6"}});
 assert.equal((await onRequest(ctx)).status,502);
 ctx.request=new Request("https://store.example"+path.replace("/media/","/admin/media/"));
 assert.equal((await onRequest(ctx)).status,404);
});
