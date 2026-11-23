import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const live=readFileSync(new URL("../assets/js/live.js",import.meta.url),"utf8");
const api=readFileSync(new URL("../assets/js/api.js",import.meta.url),"utf8");
const fallbackNames=[
 "maquiagem-corporal-bronzeado-instantaneo.webp",
 "kit-miniaturas-sellers-set.webp",
 "kit-miniaturas-exotic-set.webp",
 "kit-miniaturas-trends-set.webp",
 "mousse-autobronzeador-dark.webp",
 "luva-aplicadora-autobronzeador.webp",
 "autobronzeador-bifasico.webp",
 "maquiagem-corporal-iluminador.webp"
];

test("eight known Skelt products keep local fallback photos for intermittent official CDN failures",()=>{
 for(const name of fallbackNames)assert.ok(live.includes(name),name);
 assert.match(live,/SKELT_IMAGE_FALLBACK=Object\.freeze/);
 assert.match(live,/imageFallback\(p\)/);
 assert.match(live,/data-image-fallback/);
 assert.match(live,/image\.dataset\.imageFallback/);
 assert.match(live,/delete image\.dataset\.imageFallback/);
 assert.match(live,/if\(!\/\^assets/);
});

test("public catalog still renders only backend products; never assumes inventory",()=>{
 assert.match(live,/currentProducts=page\.items/);
 assert.match(live,/state\.items\.map\(liveProductCard\)/);
 assert.match(live,/available=!!p\.available/);
 assert.match(live,/data-confirm-product/);
 assert.match(live,/>Indisponível<\/span>/);
 assert.match(live,/function imageFromProduct\(p\)/);
 assert.match(api,/credentials:"omit"/);
 assert.doesNotMatch(live,/stock_quantity\s*=/);
});

test("live hero and product detail describe actual products without invented perfume variants",()=>{
 assert.match(live,/cta\.firstChild\.textContent="Explorar produtos "/);
 assert.doesNotMatch(live,/Volumes e pirâmide olfativa não constam/);
 assert.match(live,/Imagens ilustram o produto cadastrado/);
});
