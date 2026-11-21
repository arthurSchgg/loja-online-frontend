import {CONFIG} from "./config.js";
export class ApiError extends Error{
 constructor(message,status=0){super(message);this.name="ApiError";this.status=status;}
}
function baseUrl(){
 const origin=globalThis.location?.origin||"https://example.invalid";
 const base=new URL(CONFIG.apiBaseUrl.replace(/\/?$/,"/"),origin);
 const remote=base.origin!==origin;
 if(!["https:","http:"].includes(base.protocol))throw new ApiError("Protocolo de API não permitido.");
 if(base.protocol==="http:"&&!["localhost","127.0.0.1"].includes(base.hostname))throw new ApiError("A API precisa de HTTPS.");
 if(remote&&!CONFIG.allowExternalPublicApi)throw new ApiError("API externa não autorizada; configure mesma origem.");
 return base;
}
export function apiUrl(path){
 if(typeof path!=="string"||!path.startsWith("/")||path.startsWith("//")||path.includes("#"))throw new ApiError("Caminho de API inválido.");
 const pathname=path.split("?")[0];
 if(pathname.includes("..")||pathname.includes("\\")||/%(?:2e|2f|5c)/i.test(pathname))throw new ApiError("Caminho de API inválido.");
 const base=baseUrl(),url=new URL(path.slice(1),base);
 if(url.origin!==base.origin||!url.pathname.startsWith(base.pathname))throw new ApiError("Caminho de API inválido.");
 return url.toString();
}
const SHORT_CACHE=new Set(["/brands","/categories","/store","/content-sections"]);
export function publicCacheMode(path,method="GET"){
 return method==="GET"&&SHORT_CACHE.has(path)?"default":"no-store";
}
export async function publicRequest(path,{method="GET",payload,signal,timeoutMs=20000,fetchImpl=globalThis.fetch.bind(globalThis)}={}){
 const url=apiUrl(path),controller=new AbortController();
 const abort=()=>controller.abort(signal?.reason);
 if(signal?.aborted)throw new DOMException("Consulta cancelada.","AbortError");
 signal?.addEventListener("abort",abort,{once:true});
 let expired=false;
 const timer=setTimeout(()=>{expired=true;controller.abort();},timeoutMs);
 const options={method,signal:controller.signal,credentials:"omit",cache:publicCacheMode(path,method),
  redirect:"error",referrerPolicy:"same-origin",headers:{Accept:"application/json"}};
 if(payload!==undefined){options.headers["Content-Type"]="application/json";options.body=JSON.stringify(payload);}
 try{
  const response=await fetchImpl(url,options);
  if(signal?.aborted)throw new DOMException("Consulta cancelada.","AbortError");
  if(expired)throw new ApiError("A loja demorou a responder. Tente novamente.",504);
  if(!response.ok)throw new ApiError(response.status===404?"Conteúdo não encontrado.":response.status===409?"Informações alteradas; atualize os dados.":response.status===504?"A loja demorou a responder. Tente novamente.":"Não foi possível concluir a solicitação.",response.status);
  if(response.status===204)return null;
  try{
   const data=await response.json();
   if(signal?.aborted)throw new DOMException("Consulta cancelada.","AbortError");
   if(expired)throw new ApiError("A loja demorou a responder. Tente novamente.",504);
   return data;
  }catch(error){
   if(signal?.aborted||expired||error?.name==="AbortError")throw error;
   throw new ApiError("Resposta inválida do servidor.",response.status);
  }
 }catch(error){
  if(signal?.aborted)throw new DOMException("Consulta cancelada.","AbortError");
  if(expired||error?.name==="TimeoutError")throw new ApiError("A loja demorou a responder. Tente novamente.",504);
  if(error instanceof ApiError||error?.name==="AbortError")throw error;
  throw new ApiError("Não foi possível conectar ao servidor.");
 }finally{
  clearTimeout(timer);
  signal?.removeEventListener("abort",abort);
 }
}
export function normalizePage(data){
 if(Array.isArray(data))return {items:data,hasNext:false};
 if(!data||!Array.isArray(data.content))throw new ApiError("Formato de catálogo inesperado.");
 return {items:data.content,hasNext:typeof data.last==="boolean"?!data.last:false};
}
export function productSearchPath(page=0,filters={}){
 const number=Number(page);
 if(!Number.isSafeInteger(number)||number<0)throw new ApiError("Página inválida.");
 const query=new URLSearchParams({page:String(number),size:"12"});
 const q=String(filters?.q??"").trim();
 if(q)query.set("q",q);
 for(const [field,label] of [["categoryId","Categoria"],["brandId","Marca"]]){
  const selected=filters?.[field];
  if(selected!==null&&selected!==undefined&&selected!==""){
   const id=Number(selected);
   if(!Number.isSafeInteger(id)||id<1)throw new ApiError(label+" inválida.");
   query.set(field,String(id));
  }
 }
 const sort=String(filters?.sort??"recent");
 if(!["recent","name","price-asc","price-desc"].includes(sort))throw new ApiError("Ordenação inválida.");
 query.set("sort",sort);
 const rawMax=filters?.maxPrice;
 if(rawMax!==null&&rawMax!==undefined&&rawMax!==""){
  const max=Number(rawMax);
  if(!Number.isFinite(max)||max<0)throw new ApiError("Preço máximo inválido.");
  query.set("maxPrice",String(rawMax));
 }
 return "/products?"+query.toString();
}
export async function fetchProducts(page=0,signal,filters={}){
 return normalizePage(await publicRequest(productSearchPath(page,filters),{signal}));
}
export async function fetchCategories(signal){
 const categories=await publicRequest("/categories",{signal});
 if(!Array.isArray(categories))throw new ApiError("Categorias indisponíveis.");
 return categories.filter(c=>Number.isSafeInteger(Number(c?.id))&&Number(c.id)>0&&typeof c.name==="string");
}
export async function fetchProduct(id,signal){
 if(!Number.isSafeInteger(Number(id))||Number(id)<=0)throw new ApiError("ID de produto inválido.");
 return publicRequest("/products/"+Number(id),{signal});
}
export async function fetchRelatedProducts(id,signal){
 if(!Number.isSafeInteger(Number(id))||Number(id)<=0)throw new ApiError("ID de produto inválido.");
 const result=await publicRequest("/products/"+Number(id)+"/related?limit=4",{signal});
 if(!Array.isArray(result))throw new ApiError("Produtos relacionados indisponíveis.");
 return result.filter(item=>item?.published===true);
}
export async function fetchStore(signal){return publicRequest("/store",{signal});}
export async function fetchContentSections(signal){
 const sections=await publicRequest("/content-sections",{signal});
 if(!Array.isArray(sections))throw new ApiError("Conteúdo institucional indisponível.");
 return sections.filter(section=>section&&section.published===true&&
  typeof section.slug==="string"&&typeof section.title==="string");
}
export async function fetchOfferings(signal){return publicRequest("/offerings",{signal});}
export async function fetchOffering(id,signal){
 if(!Number.isSafeInteger(Number(id))||Number(id)<=0)throw new ApiError("ID de serviço inválido.");
 return publicRequest("/offerings/"+Number(id),{signal});
}
export async function fetchExperiences(signal){return publicRequest("/experiences",{signal});}
export async function fetchExperience(id,signal){return publicRequest("/experiences/"+Number(id),{signal});}
export async function evaluateExperience(id,answers){
 return publicRequest("/experiences/"+Number(id)+"/evaluate",{method:"POST",payload:{answers}});
}
export function currentPrice(dto){if(dto?.priceStatus==="ON_REQUEST")return null;const raw=dto?.effectivePrice??dto?.price;if(raw===null||raw===undefined||raw==="")return null;const val=Number(raw);return Number.isFinite(val)&&val>=0?val:null;}
/** Accept only WhatsApp's documented click-to-chat destinations.
 * Never open links with credentials, alternate ports or a malformed phone.
 */
export function validateWhatsAppUrl(raw){
 let url;
 try{
  if(typeof raw!=="string"||raw.length>12000)throw new Error("Invalid URL");
  url=new URL(raw);
 }catch{throw new ApiError("Link de WhatsApp não autorizado.");}
 if(url.protocol!=="https:"||url.username||url.password||url.port||url.hash)
  throw new ApiError("Link de WhatsApp não autorizado.");
 const phonePattern=/^[0-9]{10,15}$/;
 if(url.hostname==="wa.me"){
  if(!phonePattern.test(url.pathname.slice(1))||url.pathname.split("/").length!==2)
   throw new ApiError("Link de WhatsApp não autorizado.");
 }else if(url.hostname==="api.whatsapp.com"){
  if(url.pathname!=="/send"||!phonePattern.test(url.searchParams.get("phone")||""))
   throw new ApiError("Link de WhatsApp não autorizado.");
 }else throw new ApiError("Link de WhatsApp não autorizado.");
 return url.href;
}
export async function confirmWhatsApp({type,id,expectedPrice,customizations={}}){
 if(!["PRODUCT","OFFERING"].includes(type)||!Number.isSafeInteger(Number(id))||Number(id)<=0)throw new ApiError("Seleção inválida.");
 if(type==="PRODUCT"&&(!Number.isFinite(Number(expectedPrice))||Number(expectedPrice)<=0))
  throw new ApiError("O preço deste produto ainda não foi confirmado.");
 const payload={type,id:Number(id),expectedPrice:expectedPrice===null?null:expectedPrice,customizations};
 const result=await publicRequest("/whatsapp/confirm",{method:"POST",payload});
 return {url:validateWhatsAppUrl(result?.url),message:String(result.message||"")};
}
