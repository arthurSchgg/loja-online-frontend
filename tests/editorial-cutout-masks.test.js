import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("studio photos use local, scalable alpha silhouettes rather than square mattes",()=>{
 const css=read("assets/css/editorial-cutouts.css");
 for(const name of ["lily","egeo","malbec","floratta"]){
  const path="assets/images/editorial/masks/"+name+".svg";
  assert.ok(existsSync(new URL("../"+path,import.meta.url)),path);
  const svg=read(path);
  assert.match(svg,/viewBox="0 0 100 100"/);
  assert.match(svg,/<polygon points="[^"]+"/);
  assert.doesNotMatch(svg,/<image\b/);
  assert.match(css,new RegExp("masks/"+name+"\\.svg"));
 }
 assert.match(css,/mix-blend-mode:multiply!important/);
 assert.match(css,/-webkit-mask-image:url/);
 assert.match(css,/mask-size:100% 100%!important/);
});

test("all institutional photo pages load their finishing stylesheet last",()=>{
 for(const page of ["index.html","conheca-a-loja.html","viva-sua-experiencia.html","contato.html","espaco-das-velas.html"]){
  const html=read(page);
  assert.ok(html.includes('href="assets/css/editorial-cutouts.css"'),page);
  assert.ok(html.lastIndexOf("editorial-cutouts.css")>html.indexOf("premium-storefront.css"));
  assert.match(html,/data-editorial-photo/);
 }
});

test("photo finishing preserves cinematic home image, API catalog and reduced motion",()=>{
 const home=read("index.html");
 const css=read("assets/css/editorial-cutouts.css");
 assert.match(home,/hero-live-poster\.webp/);
 assert.match(home,/hero-live-motion\.mp4/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/editorial-product-photo--scene/);
 assert.doesNotMatch(read("catalogo.html"),/editorial-cutouts\.css/);
 assert.doesNotMatch(read("admin.html"),/editorial-cutouts\.css/);
});
