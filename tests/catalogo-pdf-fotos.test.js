import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,statSync,existsSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {join,dirname} from "node:path";

const project=dirname(fileURLToPath(new URL("../index.html",import.meta.url)));
const content=readFileSync(join(project,"docs/catalogo-fotos-2026-11-21.csv"),"utf8").replace(/^\uFEFF/,"");
const lines=content.trim().split(/\r?\n/);
const filenames=lines.slice(1).map(row=>row.split(";").at(-1).trim());

test("all 63 user-supplied catalog product photographs are real, local WebP files",()=>{
 assert.equal(filenames.length,63);
 assert.equal(new Set(filenames).size,63);
 for(const [i,name] of filenames.entries()){
  assert.match(name,new RegExp("^"+String(i+1).padStart(3,"0")+"-[a-z0-9-]+\\.webp$"));
  const file=join(project,"assets/images/catalogo/pdf-2026",name);
  assert.ok(existsSync(file),"Missing product photo "+name);
  assert.ok(statSync(file).size>1100,"Invalid or empty photo "+name);
 }
});

test("products without an official value never appear as free or as confirmed WhatsApp orders",()=>{
 const live=readFileSync(join(project,"assets/js/live.js"),"utf8");
 assert.match(live,/pricePending=price===null\|\|price===0/);
 assert.match(live,/pricePending\?"Valor sob consulta":money\(price\)/);
 assert.match(live,/pricePending\?'<span class="badge" aria-label="Preço ainda não confirmado">Preço a confirmar<\/span>'/);
 assert.match(live,/available=!!p\.available/);
 assert.doesNotMatch(live,/stock_quantity\s*=/);
});
