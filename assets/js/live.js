/** Public API storefront: never replace an API failure with fictitious offers.
 * All prices/availability in live mode originate from the backend.
 */
import {isLive} from "./config.js";
import {fetchProducts,fetchProduct,fetchOfferings,fetchExperiences,fetchExperience,evaluateExperience,confirmWhatsApp,currentPrice,ApiError} from "./api.js";
import {money} from "./data.js";
import {escapeHtml} from "./layout.js";
const safe=value=>escapeHtml(value??"");
const numberId=id=>Number.isSafeInteger(Number(id))&&Number(id)>0?Number(id):null;
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
 const img=safe(imageFromProduct(p)),price=currentPrice(p),available=!!p.available;
 const label=price===null?"Valor sob consulta":money(price);
 const action=available?'<button class="btn btn--secondary" type="button" data-confirm-product="'+p.id+'">Consultar no WhatsApp</button>':'<span class="badge" aria-label="Indisponível">Indisponível</span>';
 return '<article class="product-card"><a href="produto.html?productId='+Number(p.id)+'"><div class="product-visual" style="--card-theme:#efe0d8"><img src="'+img+'" loading="lazy" alt="'+safe(p.images?.[0]?.altText||p.name)+'" width="320" height="420"></div></a><div class="product-card__meta"><small>'+safe(p.brand?.name||"Catálogo da loja")+'</small><h3><a href="produto.html?productId='+Number(p.id)+'">'+productTitle(p)+'</a></h3><p>'+safe(p.description||"")+'</p><div class="product-card__bottom"><strong>'+label+'</strong>'+action+'</div></div></article>';
}
let requestConfirmation=null;
function ensureDialog(){
 let dlg=document.getElementById("whatsapp-confirm-dialog");
 if(dlg)return dlg;
 dlg=document.createElement("dialog");dlg.id="whatsapp-confirm-dialog";dlg.className="drawer";dlg.setAttribute("aria-labelledby","confirm-heading");
 dlg.innerHTML='<div class="drawer-inner"><div class="drawer-head"><h2 id="confirm-heading">Confirme sua consulta</h2><button type="button" class="icon-button" id="close-confirm" aria-label="Fechar">✕</button></div><div class="drawer-items"><p id="confirm-details"></p><div id="confirm-options"></div><p id="confirm-feedback" role="status" aria-live="polite"></p></div><div class="drawer-footer"><button type="button" class="btn btn--primary btn--full" id="send-confirm">Validar preço e disponibilidade</button><p id="confirmed-link"></p><small>O backend confirma a informação atual. A mensagem só é aberta quando você clicar no link validado.</small></div></div>';
 document.body.append(dlg);dlg.querySelector("#close-confirm").addEventListener("click",()=>dlg.close());
 dlg.addEventListener("click",e=>{if(e.target===dlg)dlg.close();});
 dlg.querySelector("#send-confirm").addEventListener("click",async()=>{
  if(!requestConfirmation)return;
  const btn=dlg.querySelector("#send-confirm"),feedback=dlg.querySelector("#confirm-feedback"),link=dlg.querySelector("#confirmed-link");
  btn.disabled=true;feedback.textContent="Validando com a loja...";link.replaceChildren();
  try{
   let customizations={};
   for(const el of dlg.querySelectorAll("[data-option-kind]")){if(el.value)customizations[el.dataset.optionKind]=el.value;}
   const response=await confirmWhatsApp({...requestConfirmation,customizations});
   const a=document.createElement("a");a.href=response.url;a.target="_blank";a.rel="noopener noreferrer";a.className="btn btn--secondary btn--full";a.textContent="Abrir WhatsApp com informações confirmadas ↗";link.append(a);
   feedback.textContent="Informações atualizadas confirmadas. Revise o resumo no WhatsApp antes de enviar.";
  }catch(err){feedback.textContent=err instanceof ApiError?err.message:"Não foi possível validar. Tente novamente.";}
  finally{btn.disabled=false;}
 });
 return dlg;
}
function showConfirmation({type,item}){
 if(!item||!item.available)return;
 const dlg=ensureDialog(),price=currentPrice(item),name=item.name||item.title;
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
document.addEventListener("click",e=>{
 const item=e.target.closest("[data-confirm-product]");
 if(item){const p=currentProducts.find(x=>x.id===Number(item.dataset.confirmProduct));if(p)showConfirmation({type:"PRODUCT",item:p});}
 const offer=e.target.closest("[data-confirm-offering]");
 if(offer){const o=currentOfferings.find(x=>x.id===Number(offer.dataset.confirmOffering));if(o)showConfirmation({type:"OFFERING",item:o});}
});
async function initHome(){
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
 // Gender and bottle-volume are not attributes of ProductResponse.
 for(const field of ["gender","size"]){const input=form.elements[field];if(input)input.closest(".field").hidden=true;}
 const heading=document.querySelector(".catalog-hero .lead");if(heading)heading.textContent="Produtos publicados e preços consultados da API. Confirme antes de abrir o WhatsApp.";
 const family=form.elements.family;family.innerHTML='<option value="">Todas as categorias</option>';
 const all=[];let page=0,hasNext=true;
 const loadMore=document.createElement("button");loadMore.type="button";loadMore.className="btn btn--secondary";loadMore.textContent="Carregar mais produtos";grid.after(loadMore);
 function render(){
  const data=new FormData(form),q=String(data.get("query")||"").toLocaleLowerCase("pt-BR"),category=String(data.get("family")||""),max=Number(data.get("max")||100000);
  let list=all.filter(p=>(p.name+" "+(p.description||"")+" "+(p.brand?.name||"")).toLocaleLowerCase("pt-BR").includes(q)&&(!category||(p.categories||[]).some(c=>c.name===category))&&(currentPrice(p)===null||currentPrice(p)<=max));
  const sort=data.get("sort");if(sort==="price-asc")list.sort((a,b)=>(currentPrice(a)??Infinity)-(currentPrice(b)??Infinity));
  if(sort==="price-desc")list.sort((a,b)=>(currentPrice(b)??-Infinity)-(currentPrice(a)??-Infinity));
  if(sort==="name")list.sort((a,b)=>a.name.localeCompare(b.name,"pt-BR"));
  grid.innerHTML=list.map(liveProductCard).join("")||'<p>Nenhum produto encontrado com estes filtros.</p>';
  count.textContent=list.length+" produtos carregados"+(hasNext?" · mais páginas disponíveis":"");
  loadMore.hidden=!hasNext;
 }
 async function next(){
  loadMore.disabled=true;status(grid,"Carregando produtos publicados...");
  try{
   const result=await fetchProducts(page++);
   all.push(...result.items.filter(p=>Number.isSafeInteger(Number(p.id))));currentProducts=all;hasNext=result.hasNext;
   const categories=[...new Set(all.flatMap(p=>(p.categories||[]).map(c=>c.name)))].sort();
   const selected=family.value;family.innerHTML='<option value="">Todas as categorias</option>'+categories.map(x=>'<option value="'+safe(x)+'">'+safe(x)+'</option>').join("");family.value=selected;
   render();
  }catch(err){grid.replaceChildren();status(grid,err.message,true);loadMore.hidden=true;}
  finally{loadMore.disabled=false;}
 }
 form.addEventListener("input",render);form.addEventListener("change",render);loadMore.addEventListener("click",next);await next();
}
async function initProduct(){
 const host=document.getElementById("product-content");if(!host)return;
 const query=new URLSearchParams(location.search),id=numberId(query.get("productId"));
 if(!id){status(host,"Selecione um produto do catálogo real.");return;}
 status(host,"Carregando produto...");
 try{
  const p=await fetchProduct(id);currentProducts=[p];
  const price=currentPrice(p),image=safe(imageFromProduct(p));
  host.innerHTML='<section class="container product-view"><div class="product-main-art"><img src="'+image+'" width="400" height="530" alt="'+safe(p.images?.[0]?.altText||p.name)+'"></div><div class="product-detail"><span class="eyebrow">Catálogo real da loja</span><h1>'+productTitle(p)+'</h1><p class="lead">'+safe(p.description||"")+'</p><p>'+safe((p.categories||[]).map(c=>c.name).join(" · "))+'</p><p><strong>'+(price===null?"Valor sob consulta":money(price))+'</strong></p><p class="muted">Volumes e pirâmide olfativa não constam no contrato de produtos desta API; não serão inventados.</p>'+(p.available?'<button class="btn btn--primary" data-confirm-product="'+p.id+'">Confirmar e consultar no WhatsApp</button>':'<span class="badge">Indisponível</span>')+'</div></section>';
  document.title=(p.name||"Produto")+" | Lojinha da Kátia";
 }catch(err){host.replaceChildren();status(host,"Não foi possível carregar: "+err.message,true);}
}
if(isLive){
 if(document.getElementById("catalog-grid"))initCatalog();
 else if(document.getElementById("product-content"))initProduct();
 else if(document.getElementById("featured-grid"))initHome();
}
