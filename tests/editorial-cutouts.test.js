import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const pages=[["index.html",3],["conheca-a-loja.html",2],
 ["viva-sua-experiencia.html",1],["contato.html",1],["espaco-das-velas.html",1]];
const urlPrefix="assets/images/editorial/transparent/";

test("public editorial pages use the approved transparent compositions, not distant JPG hosts",()=>{
 for(const [path,count] of pages){
  const html=read(path);
  assert.equal((html.match(/data-editorial-photo/g)||[]).length,count);
  assert.equal((html.match(/editorial-product-photo--alpha/g)||[]).length,count);
  assert.doesNotMatch(html,/src="assets\/images\/editorial\/[^"]+\.svg"/);
  assert.doesNotMatch(html,/src="https:\/\/(?:res\.cloudinary|tiendacdn|down-br\.img|images\.pexels|shopsupermercadobrazil)/);
  assert.match(html,/src="assets\/images\/editorial\/transparent\//);
  assert.match(html,/src="assets\/js\/editorial-photos\.js"/);
  assert.match(html,/loading="(?:eager|lazy)"/);
 }
 const all=pages.map(([path])=>read(path)).join("\n");
 for(const name of ["lily","malbec","egeo","floratta","vela"]){
  assert.ok(all.includes(urlPrefix+name+".webp"),name);
 }
});

test("real API products stay on the homepage and unfiltered catalog",()=>{
 const home=read("index.html");
 const live=read("assets/js/live.js");
 assert.ok(home.indexOf('id="mais-amados"')<home.indexOf('id="colecoes"'));
 assert.match(home,/id="featured-grid"/);
 assert.match(home,/href="catalogo\.html\?familia=Perfumaria"/);
 assert.match(home,/href="catalogo\.html\?familia=Kits%20para%20presente"/);
 assert.match(live,/collectionSection\.hidden=false/);
 assert.match(live,/loadCatalogPage\(\(index\)=>fetchProducts\(index\),0\)/);
 assert.match(live,/currentProducts\.slice\(0,8\)\.map\(liveProductCard\)/);
 assert.match(live,/available=!!p\.available/);
 assert.doesNotMatch(live,/stock_quantity\s*=/);
});

test("generated editorial visuals are identified as illustrative, not official SKU photographs",()=>{
 const home=read("index.html");
 const candle=read("espaco-das-velas.html");
 assert.match(home,/Composições editoriais ilustrativas/);
 assert.match(candle,/Composição editorial ilustrativa/);
 assert.match(candle,/editorial\/transparent\/vela\.webp/);
 assert.match(read("assets/js/editorial-photos.js"),/addEventListener\("error"/);
 assert.match(read("assets/css/editorial-cutouts.css"),/mix-blend-mode:normal!important/);
});
