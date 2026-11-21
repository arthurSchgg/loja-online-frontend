import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {activeCatalogFilters} from "../assets/js/catalog-toolbar.js";
import {safeProductPhotoUrl,productGalleryImages} from "../assets/js/product-gallery.js";
import {relatedCatalogProducts} from "../assets/js/related-products.js";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("active catalog chips are derived only from actual applied filters",()=>{
 assert.deepEqual(activeCatalogFilters(),[]);
 assert.deepEqual(activeCatalogFilters({q:"  lily  "}),[{key:"query",label:"Busca: lily"}]);
 assert.deepEqual(activeCatalogFilters({categoryId:3,categoryName:"Corporal",maxPrice:200,maxPriceLabel:"R$ 200"}),[
  {key:"family",label:"Categoria: Corporal"},
  {key:"max",label:"Até R$ 200"}
 ]);
 assert.deepEqual(activeCatalogFilters({maxPrice:""}),[]);
 const toolbar=read("assets/js/catalog-toolbar.js");
 assert.match(toolbar,/textContent=label/);
 assert.doesNotMatch(toolbar,/\.innerHTML=/);
 assert.match(toolbar,/form\.elements\.query\.value=""/);
 assert.match(toolbar,/form\.elements\.family\.value=""/);
 assert.match(toolbar,/form\.elements\.max\.value=""/);
 assert.match(toolbar,/onChange\(\)/);
});

test("product image URLs allow HTTPS or same-origin HTTP only; never scripts",()=>{
 const origin="https://loja.example";
 assert.equal(safeProductPhotoUrl("https://cdn.example/bottle.webp",{origin}),"https://cdn.example/bottle.webp");
 assert.equal(safeProductPhotoUrl("/images/a.webp",{origin}),"https://loja.example/images/a.webp");
 for(const url of ["javascript:alert(1)","data:image/svg+xml,<svg>","http://cdn.example/a.webp","ftp://cdn.example/a.jpg",""]){
  assert.equal(safeProductPhotoUrl(url,{origin}),null,url);
 }
 assert.equal(safeProductPhotoUrl("http://localhost:5500/a.webp",{origin:"http://localhost:5500"}),"http://localhost:5500/a.webp");
});

test("gallery is ordered, deduplicated, safe and falls back to a local image",()=>{
 const origin="https://loja.example";
 const actual=productGalleryImages({name:"Kit",images:[
  {url:"https://cdn.example/b.webp",altText:"Foto B",position:2},
  {url:"javascript:bad()",position:0},
  {url:"/media/a.webp",altText:"Foto A",position:1},
  {url:"https://cdn.example/b.webp",position:3}
 ]},{origin});
 assert.deepEqual(actual,[
  {url:"https://loja.example/media/a.webp",alt:"Foto A"},
  {url:"https://cdn.example/b.webp",alt:"Foto B"}
 ]);
 const fallback=productGalleryImages({name:"Sem foto",images:[]},{origin});
 assert.deepEqual(fallback,[{url:"https://loja.example/assets/images/brand/product-photo-pending.svg",alt:"Sem foto"}]);
 const many=productGalleryImages({images:Array.from({length:30},(_,i)=>({url:"https://cdn.example/"+i+".webp",position:i}))},{origin});
 assert.equal(many.length,12);
});

test("related catalog selection only shows real published products from matching brand/categories",()=>{
 const product={id:1,brand:{id:5},categories:[{id:2}]};
 const selected=relatedCatalogProducts(product,[
  {id:1,published:true,brand:{id:5},categories:[{id:2}]},
  {id:2,published:false,brand:{id:5},categories:[{id:2}]},
  {id:3,published:true,brand:{id:5},categories:[]},
  {id:4,published:true,brand:{id:8},categories:[{id:2}]},
  {id:5,published:true,brand:{id:8},categories:[]},
  {id:6,published:true,brand:{id:5},categories:[{id:2}]}
 ],4);
 assert.deepEqual(selected.map(p=>p.id),[6,3,4]);
 assert.deepEqual(relatedCatalogProducts(product,[{id:7,brand:{id:10},categories:[]}]),[]);
});

test("all public pages get the same design system while the private admin stays separate",()=>{
 for(const page of [
  "index.html","catalogo.html","produto.html","conheca-a-loja.html",
  "contato.html","espaco-das-velas.html","viva-sua-experiencia.html","privacidade.html"
 ]){
  const html=read(page);
  assert.match(html,/assets\/css\/premium-storefront\.css/);
  assert.ok(html.indexOf("premium-storefront.css")>html.indexOf("assets/css/base.css"));
 }
 assert.doesNotMatch(read("admin.html"),/premium-storefront\.css/);
 const css=read("assets/css/premium-storefront.css");
 assert.match(css,/\.product-gallery__thumb/);
 assert.match(css,/\.catalog-chip/);
 assert.match(css,/\.product-skeleton/);
 assert.match(css,/prefers-reduced-motion:reduce/);
});

test("real product UI retains backend-only prices and WhatsApp gate",()=>{
 const live=read("assets/js/live.js");
 assert.match(live,/const id=numberId\(p\?\.id\)/);
 assert.match(live,/available=!!p\.available/);
 assert.match(live,/if\(!item\|\|!item\.available\)return/);
 assert.match(live,/productGalleryImages\(p,/);
 assert.match(live,/relatedCatalogProducts\(p,/);
 assert.match(live,/setupCatalogToolbar\(\{form,count,onChange:applyServerFilters\}\)/);
 assert.match(live,/catalogLoadingMarkup\(6\)/);
 assert.match(live,/Imagens ilustram o produto cadastrado/);
 assert.doesNotMatch(live,/stock_quantity\s*=/);
});
