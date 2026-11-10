#!/usr/bin/env node
/** Read-only, TLS-verified HTTP contract smoke for the real public backend.
 * No login, cookies, mutation, database writes or unapproved sample data.
 */
import assert from "node:assert/strict";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";

export function validateStagingOrigin(raw){
 const u=new URL(String(raw));
 const local=["localhost","127.0.0.1"].includes(u.hostname);
 if(!["https:"].includes(u.protocol)&&!(local&&u.protocol==="http:"))
  throw new Error("Staging deve usar HTTPS (HTTP permitido apenas em localhost).");
 if(u.username||u.password||u.search||u.hash||!["","/"].includes(u.pathname))
  throw new Error("Forneça somente a origem do staging, sem credenciais, caminho ou query.");
 return u.origin;
}

export async function runPublicSmoke(rawOrigin,fetchImpl=globalThis.fetch){
 const origin=validateStagingOrigin(rawOrigin);
 const checked=[];
 const get=async path=>{
  const url=new URL(path,origin);
  const response=await fetchImpl(url.href,{
   method:"GET",credentials:"omit",cache:"no-store",
   headers:{Accept:"application/json"}
  });
  if(!response.ok)throw new Error("Falha HTTP "+response.status+" no endpoint "+path.split("?")[0]);
  checked.push(path.split("?")[0]);
  return response.json();
 };
 const page0=await get("/api/v1/products?sort=price-asc&page=0&size=12");
 assert.ok(Array.isArray(page0?.content),"Resposta de produtos precisa ser paginada.");
 assert.equal(typeof page0.last,"boolean","Campo last da página ausente.");
 const products=[...page0.content];
 if(!page0.last){
  const page1=await get("/api/v1/products?sort=price-asc&page=1&size=12");
  assert.ok(Array.isArray(page1?.content),"Próxima página de produtos inválida.");
  products.push(...page1.content);
 }
 let previous=-Infinity,previousId=Infinity;
 for(const p of products){
  const amount=Number(p?.effectivePrice??p?.price);
  assert.ok(Number.isFinite(amount)&&amount>=0,"Preço efetivo ausente ou inválido.");
  const id=Number(p?.id);
  assert.ok(Number.isSafeInteger(id)&&id>0,"ID de produto inválido.");
  assert.ok(amount>=previous,"A API não ordenou globalmente por preço efetivo.");
  if(amount===previous)assert.ok(id<previousId,"Desempate da ordenação por preço deve usar ID decrescente.");
  previous=amount;previousId=id;
 }
 const categories=await get("/api/v1/categories");
 assert.ok(Array.isArray(categories),"Categorias públicas devem ser uma lista.");
 const store=await get("/api/v1/store");
 assert.ok(store&&typeof store==="object"&&!Array.isArray(store),"Informações da loja inválidas.");
 const offerings=await get("/api/v1/offerings");
 assert.ok(Array.isArray(offerings),"Serviços públicos devem ser uma lista.");
 const experiences=await get("/api/v1/experiences");
 assert.ok(Array.isArray(experiences),"Experiências públicas devem ser uma lista.");
 if(experiences.length){
  const id=Number(experiences[0]?.id);
  assert.ok(Number.isSafeInteger(id)&&id>0,"ID de experiência inválido.");
  const detail=await get("/api/v1/experiences/"+id);
  assert.ok(Array.isArray(detail?.questions),"Perguntas da experiência inválidas.");
  assert.equal(Object.hasOwn(detail,"results"),false,"O endpoint público não deve expor perfis internos.");
  for(const q of detail.questions)for(const option of q.options||[])
   assert.equal(Object.hasOwn(option,"resultKey"),false,"Chave de votação exposta na API pública.");
 }
 return {productsChecked:products.length,categoriesChecked:categories.length,
  offeringsChecked:offerings.length,experiencesChecked:experiences.length,endpointsChecked:checked.length};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const origin=process.argv[2];
 if(!origin){
  process.stderr.write("Uso: node scripts/public-api-smoke.mjs https://staging.exemplo.com\n");
  process.exitCode=2;
 }else{
  runPublicSmoke(origin).then(summary=>{
   console.log("PASS — contrato público sem mutações; contagens:",JSON.stringify(summary));
  }).catch(error=>{
   console.error("FAIL — contrato público:",error?.message||"Erro desconhecido.");
   process.exitCode=1;
  });
 }
}
