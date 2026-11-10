import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {resolve,join} from "node:path";
import {motionAllowed,revealDelay,safeThemeColor} from "../assets/js/animations.js";
import {safeNumericId} from "../assets/js/render-safety.js";

const root=resolve(fileURLToPath(new URL("..",import.meta.url)));
const source=path=>readFileSync(join(root,path),"utf8");

test("animated enhancements respect reduced motion and save-data preferences",()=>{
 assert.equal(motionAllowed(false,false),true);
 assert.equal(motionAllowed(true,false),false);
 assert.equal(motionAllowed(false,true),false);
 assert.equal(revealDelay(-5),0);
 assert.equal(revealDelay(0),0);
 assert.equal(revealDelay(2),130);
 assert.equal(revealDelay(9),260);
});
test("theme transitions accept only explicit six-digit hex colors",()=>{
 assert.equal(safeThemeColor("#eedbd0"),"#eedbd0");
 for(const raw of ["red","url(https://evil.invalid)","#abcd","#fffffff","",null])
  assert.equal(safeThemeColor(raw),null);
});
test("API identifiers are safe integers before being inserted into the catalog DOM",()=>{
 assert.equal(safeNumericId(71),71);
 assert.equal(safeNumericId("71"),71);
 for(const raw of [0,-1,2.5,"0"," 15 ","1e2","71\" onmouseover=alert(1)","abc",true,null,NaN,Infinity,Number.MAX_SAFE_INTEGER+1])
  assert.equal(safeNumericId(raw),null);
});
test("every public and admin page restricts scripts and API origin via CSP",()=>{
 for(const page of ["index.html","catalogo.html","produto.html","privacidade.html",
  "admin.html","admin-experiences.html","reset-password.html","confirm-email.html"]){
  const html=source(page);
  assert.match(html,/http-equiv="Content-Security-Policy"/,page);
  assert.match(html,/script-src 'self'/,page);
  assert.match(html,/connect-src 'self'/,page);
  assert.match(html,/object-src 'none'/,page);
  assert.match(html,/base-uri 'self'/,page);
  assert.doesNotMatch(html,/<script[^>]+src="https?:\/\//i,page);
 }
});
test("live product cards require numeric IDs rather than raw attributes from API",()=>{
 const live=source("assets/js/live.js");
 assert.match(live,/const id=numberId\(p\?\.id\)/);
 assert.match(live,/if\(id===null\)return ""/);
 assert.doesNotMatch(live,/data-confirm-product=["']?\+p\.id/i);
});
