import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync,statSync} from "node:fs";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const asset=name=>new URL("../assets/images/editorial/transparent/"+name+".webp",import.meta.url);
const pages=["index.html","conheca-a-loja.html","viva-sua-experiencia.html","contato.html","espaco-das-velas.html"];

test("editorial photos are local optimized WebP images with actual transparency",()=>{
 for(const name of ["lily","egeo","malbec","floratta","vela"]){
  const url=asset(name);
  assert.ok(existsSync(url),name+" missing");
  const bytes=readFileSync(url);
  assert.equal(bytes.toString("ascii",0,4),"RIFF");
  assert.equal(bytes.toString("ascii",8,12),"WEBP");
  assert.equal(bytes.toString("ascii",12,16),"VP8X");
  assert.ok((bytes[20]&0x10)!==0,name+" is not alpha-enabled");
  assert.ok(statSync(url).size<175_000,name+" needs optimization");
 }
});

test("editorial finishing uses transparency directly without SVG clipping masks",()=>{
 const css=read("assets/css/editorial-cutouts.css");
 assert.match(css,/editorial-product-photo--alpha/);
 assert.match(css,/-webkit-mask:none!important/);
 assert.match(css,/mix-blend-mode:normal!important/);
 assert.match(css,/filter:drop-shadow/);
 assert.doesNotMatch(css,/url\(["']?\.\.\/images\/editorial\/masks\//);
 assert.doesNotMatch(css,/mix-blend-mode:multiply!important/);
});

test("each editorial page links its transparency stylesheet last",()=>{
 for(const page of pages){
  const html=read(page);
  assert.match(html,/href="assets\/css\/editorial-cutouts\.css"/);
  assert.ok(html.lastIndexOf("editorial-cutouts.css")>html.indexOf("premium-storefront.css"));
  assert.match(html,/data-editorial-photo/);
  assert.match(html,/editorial-product-photo--alpha/);
 }
});

test("transparent editorials do not replace published backend SKU images",()=>{
 const html=read("index.html");
 const live=read("assets/js/live.js");
 assert.match(html,/hero-live-poster\.webp/);
 assert.match(html,/hero-live-motion\.mp4/);
 assert.match(live,/currentProducts\.slice\(0,8\)\.map\(liveProductCard\)/);
 assert.match(live,/available=!!p\.available/);
 assert.match(read("assets/css/editorial-cutouts.css"),/prefers-reduced-motion:reduce/);
 assert.doesNotMatch(read("catalogo.html"),/editorial-cutouts\.css/);
 assert.doesNotMatch(read("admin.html"),/editorial-cutouts\.css/);
});
