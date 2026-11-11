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
 if(typeof path!=="string"||!path.startsWith("/")||path.includes(".."))throw new ApiError("Caminho de API inválido.");
 return new URL(path.slice(1),baseUrl()).toString();
}
export async function publicRequest(path,{method="GET",payload,signal,fetchImpl=globalThis.fetch}={}){
 const url=apiUrl(path);const options={method,signal,credentials:"omit",cache:"no-store",headers:{Accept:"application/json"}};
 if(payload!==undefined){options.headers["Content-Type"]="application/json";options.body=JSON.stringify(payload);}
 let response;try{response=await fetchImpl(url,options);}catch(e){if(e?.name==="AbortError")throw e;throw new ApiError("Não foi possível conectar ao servidor.");}
 if(!response.ok)throw new ApiError(response.status===404?"Conteúdo não encontrado.":response.status===409?"Informações alteradas; atualize os dados.":"Não foi possível concluir a solicitação.",response.status);
 if(response.status===204)return null;
 try{return await response.json();}catch{throw new ApiError("Resposta inválida do servidor.",response.status);}
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
 const category=filters?.categoryId;
 if(category!==null&&category!==undefined&&category!==""){
  const id=Number(category);
  if(!Number.isSafeInteger(id)||id<1)throw new ApiError("Categoria inválida.");
  query.set("categoryId",String(id));
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
export async function fetchStore(signal){return publicRequest("/store",{signal});}
export async function fetchContentSections(signal){
 const sections=await publicRequest("/content-sections",{signal});
 if(!Array.isArray(sections))throw new ApiError("Conteúdo institucional indisponível.");
 return sections.filter(section=>section&&section.published===true&&
  typeof section.slug==="string"&&typeof section.title==="string");
}
export async function fetchOfferings(signal){return publicRequest("/offerings",{signal});}
export async function fetchExperiences(signal){return publicRequest("/experiences",{signal});}
export async function fetchExperience(id,signal){return publicRequest("/experiences/"+Number(id),{signal});}
export async function evaluateExperience(id,answers){
 return publicRequest("/experiences/"+Number(id)+"/evaluate",{method:"POST",payload:{answers}});
}
export function currentPrice(dto){const raw=dto?.effectivePrice??dto?.price;if(raw===null||raw===undefined)return null;const val=Number(raw);return Number.isFinite(val)&&val>=0?val:null;}
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
 const payload={type,id:Number(id),expectedPrice:expectedPrice===null?null:expectedPrice,customizations};
 const result=await publicRequest("/whatsapp/confirm",{method:"POST",payload});
 return {url:validateWhatsAppUrl(result?.url),message:String(result.message||"")};
}
