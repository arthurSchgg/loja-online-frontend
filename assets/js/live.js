/** Public API storefront: never replace an API failure with fictitious offers.
 * All prices/availability in live mode originate from the backend.
 */
import {isLive} from "./config.js";
import {fetchProducts,fetchProduct,fetchOfferings,fetchStore,fetchExperiences,fetchExperience,evaluateExperience,confirmWhatsApp,currentPrice,fetchCategories,ApiError} from "./api.js";
import {money} from "./data.js";
import {createCatalogSearch} from "./catalog-search.js";
import {escapeHtml} from "./layout.js";
import {officialStoreLinks} from "./official-contact.js";
import {safeNumericId as numberId} from "./render-safety.js";
import {createConfirmationGate} from "./confirmation-gate.js";
const safe=value=>escapeHtml(value??"");

const productTitle=p=>safe(p.name||"Produto sem nome");
function imageFromProduct(p){
 const raw=p?.images?.[0]?.url;
 if(typeof raw!=="string"||!raw.trim())return "assets/images/brand/logo-katia.svg";
 try{
  const url=new URL(raw,location.href);
  if(url.protocol==="https:"||(url.origin===location.origin&&["http:","https:"].includes(url.protocol)))return url.href;
 }catch{}
 return "assets/images/brand/logo-katia.svg";
}
const imageFromOffering=o=>{
 if(typeof o.imageUrl!=="string"||!o.imageUrl.trim())return "assets/images/brand/logo-katia.svg";
 try{const u=new URL(o.imageUrl,location.href);if(u.protocol==="https:"||u.origin===location.origin)return u.href;}catch{}
 return "assets/images/brand/logo-katia.svg";
};
function status(target,message,error=false){
 if(!target)return;let region=target.querySelector("[data-api-status]");
 if(!region){region=document.createElement("p");region.setAttribute("role","status");region.dataset.apiStatus="";region.style.marginBlock="24px";target.prepend(region);}
 region.textContent=message;region.style.color=error?"#a13023":"#6d625b";
}
function liveProductCard(p){
 const id=numberId(p?.id);
 if(id===null)return ""; // API data must never become unescaped HTML attributes.
 const img=safe(imageFromProduct(p)),price=currentPrice(p),available=!!p.available;
 const label=price===null?"Valor sob consulta":money(price);
 const action=available?'<button class="btn btn--secondary" type="button" data-confirm-product="'+id+'">Consultar no WhatsApp</button>':'<span class="badge" aria-label="Indisponível">Indisponível</span>';
 return '<article class="product-card"><a href="produto.html?productId='+id+'"><div class="product-visual" style="--card-theme:#efe0d8"><img src="'+img+'" loading="lazy" alt="'+safe(p.images?.[0]?.altText||p.name)+'" width="320" height="420"></div></a><div class="product-card__meta"><small>'+safe(p.brand?.name||"Catálogo da loja")+'</small><h3><a href="produto.html?productId='+id+'">'+productTitle(p)+'</a></h3><p>'+safe(p.description||"")+'</p><div class="product-card__bottom"><strong>'+label+'</strong>'+action+'</div></div></article>';
}
const confirmationGate=createConfirmationGate();
let requestConfirmation=null;
function ensureDialog(){
 let dlg=document.getElementById("whatsapp-confirm-dialog");
 if(dlg)return dlg;
 dlg=document.createElement("dialog");dlg.id="whatsapp-confirm-dialog";dlg.className="drawer";dlg.setAttribute("aria-labelledby","confirm-heading");
 dlg.innerHTML='<div class="drawer-inner"><div class="drawer-head"><h2 id="confirm-heading">Confirme sua consulta</h2><button type="button" class="icon-button" id="close-confirm" aria-label="Fechar">✕</button></div><div class="drawer-items"><p id="confirm-details"></p><div id="confirm-options"></div><p id="confirm-feedback" role="status" aria-live="polite"></p></div><div class="drawer-footer"><button type="button" class="btn btn--primary btn--full" id="send-confirm">Validar preço e disponibilidade</button><p id="confirmed-link"></p><small>O backend confirma a informação atual. A mensagem só é aberta quando você clicar no link validado.</small></div></div>';
 document.body.append(dlg);dlg.querySelector("#close-confirm").addEventListener("click",()=>dlg.close());
 dlg.addEventListener("click",e=>{if(e.target===dlg)dlg.close();});
 dlg.addEventListener("close",()=>{confirmationGate.invalidate();requestConfirmation=null;});
 dlg.querySelector("#confirm-options").addEventListener("change",()=>{
  // A link confirmed for previous options is no longer valid for the current selection.
  confirmationGate.invalidate();
  dlg.querySelector("#confirmed-link").replaceChildren();
  dlg.querySelector("#send-confirm").disabled=false;
  dlg.querySelector("#confirm-feedback").textContent="Opções alteradas. Confirme novamente antes de abrir o WhatsApp.";
 });
 dlg.querySelector("#send-confirm").addEventListener("click",async()=>{
  if(!requestConfirmation)return;
  const btn=dlg.querySelector("#send-confirm"),feedback=dlg.querySelector("#confirm-feedback"),link=dlg.querySelector("#confirmed-link");
  const revision=confirmationGate.begin();
  const selection={...requestConfirmation};
  btn.disabled=true;feedback.textContent="Validando com a loja...";link.replaceChildren();
  try{
   const customizations={};
   for(const el of dlg.querySelectorAll("[data-option-kind]")){if(el.value)customizations[el.dataset.optionKind]=el.value;}
   const response=await confirmWhatsApp({...selection,customizations});
   if(!confirmationGate.isCurrent(revision)||!dlg.open)return;
   const a=document.createElement("a");a.href=response.url;a.target="_blank";a.rel="noopener noreferrer";a.className="btn btn--secondary btn--full";a.textContent="Abrir WhatsApp com informações confirmadas ↗";link.append(a);
   feedback.textContent="Informações atualizadas confirmadas. Revise o resumo no WhatsApp antes de enviar.";
  }catch(err){
   if(confirmationGate.isCurrent(revision)&&dlg.open)
    feedback.textContent=err instanceof ApiError?err.message:"Não foi possível validar. Tente novamente.";
  }finally{
   if(confirmationGate.isCurrent(revision))btn.disabled=false;
  }
 });
 return dlg;
}
function showConfirmation({type,item}){
 if(!item||!item.available)return;
 const dlg=ensureDialog(),price=currentPrice(item),name=item.name||item.title;
 confirmationGate.invalidate();
 dlg.querySelector("#send-confirm").disabled=false;
 requestConfirmation={type,id:Number(item.id),expectedPrice:price};
 dlg.querySelector("#confirm-details").textContent="Você deseja consultar "+name+"? "+(price===null?"Valor sob consulta.":"Preço vigente exibido: "+money(price)+".")+" Confirme antes de abrir uma conversa.";
 dlg.querySelector("#confirm-feedback").textContent="";
 dlg.querySelector("#confirmed-link").replaceChildren();
 const options=dlg.querySelector("#confirm-options");options.replaceChildren();
 if(type==="OFFERING"){
  const grouped=(item.options||[]).filter(o=>o.active).reduce((acc,o)=>{(acc[o.kind]??=[]).push(o);return acc;},{});
  for(const [kind,values] of Object.entries(grouped)){
   const label=document.createElement("label");label.className="field";label.textContent=kind==="AROMA"?"Aroma":kind==="COLOR"?"Cor":"Embalagem";
   const select=document.createElement("select");select.dataset.optionKind=kind;
   const empty=document.createElement("option");empty.value="";empty.textContent="Sem seleção";select.append(empty);
   for(const o of values){const opt=document.createElement("option");opt.value=o.label;opt.textContent=o.label;select.append(opt);}
   label.append(select);options.append(label);
  }
 }
 dlg.showModal();
}
let currentProducts=[],currentOfferings=[];
/** Enable the existing WhatsApp confirmation dialog on dedicated public service pages. */
export function registerPublicOfferings(items){
 currentOfferings=Array.isArray(items)?items.filter(x=>numberId(x?.id)!==null):[];
}
document.addEventListener("click",e=>{
 const item=e.target.closest("[data-confirm-product]");
 if(item){const p=currentProducts.find(x=>x.id===Number(item.dataset.confirmProduct));if(p)showConfirmation({type:"PRODUCT",item:p});}
 const offer=e.target.closest("[data-confirm-offering]");
 if(offer){const o=currentOfferings.find(x=>x.id===Number(offer.dataset.confirmOffering));if(o)showConfirmation({type:"OFFERING",item:o});}
});
async function initContact(){
 const section=document.getElementById("contato"),container=section?.querySelector(".container");
 if(!container)return;
 // No email is collected in live mode: the newsletter remains demo-only.
 container.querySelector("#newsletter-form")?.remove();
 const description=container.querySelector("p:not(.muted)");
 if(description)description.textContent="Fale com a loja pelos canais oficiais informados pela administração.";
 const disclaimer=container.querySelector("p.muted");
 if(disclaimer)disclaimer.textContent="Valores, estoque e disponibilidade são confirmados antes de qualquer solicitação sobre produtos.";
 const links=document.createElement("nav");links.className="contact-links";
 links.setAttribute("aria-label","Canais oficiais da loja");container.append(links);
 status(links,"Carregando contatos oficiais...");
 try{
  const store=await fetchStore();
  const channels=officialStoreLinks(store);
  links.replaceChildren();
  if(!channels.length){status(links,"A loja ainda não publicou canais de contato.");return;}
  for(const channel of channels){
   const a=document.createElement("a");a.className="btn btn--secondary";
   a.href=channel.href;a.textContent=channel.label;
   if(channel.external){a.target="_blank";a.rel="noopener noreferrer";}
   links.append(a);
  }
 }catch(error){
  links.replaceChildren();
  status(links,"Não foi possível consultar os contatos oficiais. Tente novamente mais tarde.",true);
 }
}
async function initLiveCategoryHighlights(){
 const section=document.getElementById("familias"),grid=section?.querySelector(".families-grid");
 if(!grid)return;
 const title=section.querySelector("h2"),lead=section.querySelector("p.lead");
 if(title)title.textContent="Explore as categorias da loja.";
 if(lead)lead.textContent="Encontre produtos nas categorias realmente disponíveis no catálogo.";
 grid.replaceChildren();status(grid,"Carregando categorias publicadas...");
 try{
  const categories=await fetchCategories();
  grid.replaceChildren();
  if(!categories.length){status(grid,"Nenhuma categoria publicada no momento.");return;}
  const palette=["#edced6","#e7e7c4","#dfd0c1","#ebcfc6"];
  for(const [index,category] of categories.slice(0,8).entries()){
   const link=document.createElement("a");
   link.className="family-tile";
   link.href="catalogo.html?familia="+encodeURIComponent(category.name);
   link.style.setProperty("--tile-color",palette[index%palette.length]);
   const order=document.createElement("span");order.textContent=String(index+1).padStart(2,"0")+" / "+String(categories.length).padStart(2,"0");
   const symbol=document.createElement("i");symbol.textContent="✿";symbol.setAttribute("aria-hidden","true");
   const heading=document.createElement("strong");heading.textContent=category.name;
   const detail=document.createElement("span");detail.textContent="Ver produtos da categoria ↗";
   link.append(order,symbol,heading,detail);grid.append(link);
  }
 }catch(error){
  grid.replaceChildren();status(grid,"Categorias indisponíveis. Use a busca do catálogo.",true);
 }
}
async function initHome(){
 // Concept-only collection tiles must never imply fictitious products are on sale.
 const demoCollections=document.getElementById("colecoes");
 if(demoCollections)demoCollections.hidden=true;
 const showcase=document.getElementById("mais-amados");
 if(showcase){
  const eyebrow=showcase.querySelector(".eyebrow"),heading=showcase.querySelector("h2");
  if(eyebrow)eyebrow.textContent="CATÁLOGO PUBLICADO";
  if(heading)heading.textContent="Produtos para descobrir.";
 }
 const quizLead=document.querySelector("#quiz p.lead");
 if(quizLead)quizLead.textContent="Responda às experiências da loja sem armazenar suas respostas.";
 const editorialImage=document.querySelector("#experiencias img[data-parallax]");
 // The editorial uses the licensed photograph already declared in HTML. Do not replace it with a logo.
 void initLiveCategoryHighlights();
 void initContact();
 const grid=document.getElementById("featured-grid");
 if(grid){
  grid.replaceChildren();status(grid,"Carregando produtos publicados...");
  try{const page=await fetchProducts();currentProducts=page.items;grid.innerHTML=currentProducts.length?currentProducts.slice(0,4).map(liveProductCard).join(""):"<p>Nenhum produto publicado no momento.</p>";}
  catch(err){grid.replaceChildren();status(grid,err.message,true);}
 }
 // Replace local demonstration quiz with the actual backend question contract.
 const quiz=document.getElementById("quiz-form");
 if(quiz){
  quiz.replaceChildren();status(quiz,"Buscando experiências da loja...");
  try{
   const experiences=await fetchExperiences(),e=experiences?.[0];
   if(!e){quiz.replaceChildren();status(quiz,"Nenhuma experiência publicada no momento.");}
   else{
    const full=await fetchExperience(e.id);quiz.replaceChildren();
    for(const question of full.questions||[]){
     const fieldset=document.createElement("fieldset");fieldset.className="fieldset";const legend=document.createElement("legend");legend.textContent=question.title;fieldset.append(legend);
     for(const option of question.options||[]){
      const label=document.createElement("label");label.className="quiz-choice";const input=document.createElement("input");input.type="radio";input.name="q-"+question.id;input.value=option.id;input.required=true;label.append(input,document.createTextNode(" "+option.label));fieldset.append(label);
     }
     quiz.append(fieldset);
    }
    const button=document.createElement("button");button.type="submit";button.className="btn btn--primary";button.textContent="Descobrir resultado";quiz.append(button);
    const out=document.createElement("div");out.setAttribute("role","status");out.setAttribute("aria-live","polite");quiz.append(out);
    quiz.addEventListener("submit",async event=>{
     event.preventDefault();button.disabled=true;out.textContent="Avaliando respostas...";
     const form=new FormData(quiz);const answers=(full.questions||[]).map(q=>({questionId:Number(q.id),optionId:Number(form.get("q-"+q.id))}));
     try{const result=await evaluateExperience(full.id,answers);out.textContent="Seu perfil: "+String(result.title||result.key||"").slice(0,120);if(result.recommendations?.length)out.textContent+=" — "+result.recommendations.map(p=>p.name).join(", ");}catch(err){out.textContent=err.message;}finally{button.disabled=false;}
    });
   }
  }catch(err){quiz.replaceChildren();status(quiz,"Experiência indisponível: "+err.message,true);}
 }
 const sec=document.querySelector("#experiencias .editorial-copy");
 if(sec){
  const box=document.createElement("div");box.style.marginTop="22px";sec.append(box);status(box,"Carregando velas e serviços...");
  try{
   currentOfferings=await fetchOfferings();box.replaceChildren();
   for(const o of currentOfferings.slice(0,6)){
    const card=document.createElement("div");card.style.cssText="padding:14px 0;border-bottom:1px solid #ab978a";
    card.innerHTML='<strong>'+safe(o.title)+'</strong> · '+safe(o.type)+'<br><span>'+safe(o.price===null?"Valor sob consulta":money(o.price))+'</span> ';
    if(o.available){const btn=document.createElement("button");btn.className="btn btn--ghost";btn.textContent="Consultar";btn.dataset.confirmOffering=o.id;card.append(btn);}
    else{const badge=document.createElement("span");badge.className="badge";badge.textContent="Indisponível";card.append(badge);}
    box.append(card);
   }
   if(!currentOfferings.length)status(box,"Nenhum serviço publicado.");
  }catch(err){box.replaceChildren();status(box,"Serviços indisponíveis: "+err.message,true);}
 }
}
async function initCatalog(){
 const grid=document.getElementById("catalog-grid"),form=document.getElementById("filters"),count=document.getElementById("result-count");
 if(!grid||!form)return;
 // Attributes not exposed by ProductResponse cannot be used as live filters.
 for(const field of ["gender","size"]){const input=form.elements[field];if(input)input.closest(".field").hidden=true;}
 const heading=document.querySelector(".catalog-hero .lead");
 if(heading)heading.textContent="Busque produtos publicados e confira preços e disponibilidade atuais antes de consultar no WhatsApp.";
 const queryField=form.elements.query,family=form.elements.family;
 form.querySelector('label[for="search"]').textContent="Buscar nome ou descrição";
 form.querySelector('label[for="family"]').textContent="Categoria";
 form.querySelector('label[for="max"]').textContent="Preço máximo (catálogo completo)";
 const noLimit=form.elements.max?.querySelector('option[value="1000"]');
 if(noLimit)noLimit.value=""; // Demo uses 1000 as a placeholder; live must mean no price cap.
 const featured=form.elements.sort?.querySelector('option[value="featured"]');
 if(featured){featured.value="recent";featured.textContent="Mais recentes";}
 form.elements.sort?.querySelector('option[value="new"]')?.remove();
 const search=createCatalogSearch((page,filters)=>fetchProducts(page,undefined,filters));
 const loadMore=document.createElement("button");loadMore.type="button";loadMore.className="btn btn--secondary";
 loadMore.textContent="Carregar mais produtos";grid.after(loadMore);
 let version=0,searchTimer=null,categoryWarning="";
 const params=new URLSearchParams(location.search),familyName=params.get("familia");
 try{
  const categories=await fetchCategories();
  family.replaceChildren();
  const any=document.createElement("option");any.value="";any.textContent="Todas as categorias";family.append(any);
  for(const category of categories){
   const option=document.createElement("option");
   option.value=String(category.id);option.textContent=category.name;family.append(option);
  }
  if(familyName){
   const match=categories.find(c=>c.name.toLocaleLowerCase("pt-BR")===familyName.toLocaleLowerCase("pt-BR"));
   if(match)family.value=String(match.id);
   else categoryWarning="A categoria indicada no link não consta do catálogo real. ";
  }
 }catch(error){
  family.closest(".field").hidden=true;
  categoryWarning="Não foi possível consultar as categorias; a busca por nome continua disponível. ";
 }
 if(params.has("q"))queryField.value=params.get("q").slice(0,180);
 function render(){
  const state=search.state;
  grid.innerHTML=state.items.map(liveProductCard).join("")||'<p>Nenhum produto encontrado com estes filtros.</p>';
  count.textContent=categoryWarning+state.items.length+" produtos carregados"+
    (state.hasNext?" · mais páginas disponíveis":" · fim dos resultados");
  loadMore.hidden=!state.hasNext;
  loadMore.textContent="Carregar mais produtos";
 }
 async function next(expectedVersion=version){
  if(expectedVersion!==version)return;
  loadMore.disabled=true;status(grid,"Carregando produtos publicados...");
  try{
   const state=await search.next();
   if(expectedVersion!==version||state.stale)return;
   currentProducts=state.items;render();
  }catch(error){
   if(expectedVersion!==version)return;
   if(!search.state.items.length)grid.replaceChildren();
   status(grid,"Não foi possível carregar esta página: "+(error?.message||"Tente novamente."),true);
   loadMore.textContent="Tentar novamente";loadMore.hidden=false;
  }finally{if(expectedVersion===version)loadMore.disabled=false;}
 }
 function applyServerFilters(){
  window.clearTimeout(searchTimer);
  search.setFilters({q:queryField.value,categoryId:family.closest(".field").hidden?null:family.value,
   sort:form.elements.sort?.value||"recent",maxPrice:form.elements.max?.value||null});
  version++;
  currentProducts=[];grid.replaceChildren();
  count.textContent="Buscando produtos no catálogo...";
  loadMore.hidden=true;
  void next(version);
 }
 queryField.addEventListener("input",()=>{
  window.clearTimeout(searchTimer);
  searchTimer=window.setTimeout(applyServerFilters,300);
 });
 family.addEventListener("change",applyServerFilters);
 for(const field of ["sort","max"])form.elements[field]?.addEventListener("change",applyServerFilters);
 loadMore.addEventListener("click",()=>void next());
 applyServerFilters();
}
async function initProduct(){
 const host=document.getElementById("product-content");if(!host)return;
 const query=new URLSearchParams(location.search),id=numberId(query.get("productId"));
 if(!id){status(host,"Selecione um produto do catálogo real.");return;}
 status(host,"Carregando produto...");
 try{
  const p=await fetchProduct(id);currentProducts=[p];
  const price=currentPrice(p),image=safe(imageFromProduct(p));
  host.innerHTML='<section class="container product-view"><div class="product-main-art"><img src="'+image+'" width="400" height="530" alt="'+safe(p.images?.[0]?.altText||p.name)+'"></div><div class="product-detail"><span class="eyebrow">Catálogo real da loja</span><h1>'+productTitle(p)+'</h1><p class="lead">'+safe(p.description||"")+'</p><p>'+safe((p.categories||[]).map(c=>c.name).join(" · "))+'</p><p><strong>'+(price===null?"Valor sob consulta":money(price))+'</strong></p><p class="muted">Volumes e pirâmide olfativa não constam no contrato de produtos desta API; não serão inventados.</p>'+(p.available?'<button class="btn btn--primary" data-confirm-product="'+id+'">Confirmar e consultar no WhatsApp</button>':'<span class="badge">Indisponível</span>')+'</div></section>';
  document.title=(p.name||"Produto")+" | Lojinha da Kátia";
 }catch(err){host.replaceChildren();status(host,"Não foi possível carregar: "+err.message,true);}
}
if(isLive){
 // The hero uses a licensed editorial photograph, not a fictitious SKU or the logo.
 // Do not override its accessible alt text, fetch priority or src in live mode.
 const heroDisclaimer=document.querySelector(".hero-copy > p.muted");
 if(heroDisclaimer)heroDisclaimer.textContent="Consulte valores e disponibilidade atualizados no catálogo.";
 if(document.getElementById("catalog-grid"))initCatalog();
 else if(document.getElementById("product-content"))initProduct();
 else if(document.getElementById("featured-grid"))initHome();
}
