/** Public API storefront: never replace an API failure with fictitious offers.
 * All prices/availability in live mode originate from the backend.
 */
import {isLive} from "./config.js";
import {fetchProducts,fetchFeatured,fetchProduct,fetchRelatedProducts,fetchOfferings,fetchOffering,fetchStore,fetchExperiences,fetchExperience,evaluateExperience,confirmWhatsApp,currentPrice,fetchCategories,fetchCatalogPreview,ApiError} from "./api.js";
import {readPreview,foregroundRecovery} from "./catalog-preview.js";
import {initCampaignBanners} from "./campaign-banners.js";
import {money} from "./data.js";
import {createCatalogSearch} from "./catalog-search.js";
import {setupCatalogToolbar} from "./catalog-toolbar.js";
import {productGalleryImages} from "./product-gallery.js";
import {relatedCatalogProducts} from "./related-products.js";
import {loadCatalogPage,isUnfilteredFirstPage} from "./public-catalog-load.js";
import {escapeHtml} from "./layout.js";
import {UI_ICONS} from "./ui-icons.js";
import {officialStoreLinks} from "./official-contact.js";
import {safeNumericId as numberId} from "./render-safety.js";
import {createConfirmationGate} from "./confirmation-gate.js";
import {setupCommercialRefresh} from "./commercial-refresh.js";
import {CATEGORY_PREVIEWS,SERVICE_PREVIEWS,previewCard} from "./editorial-defaults.js";
import {renderProductGrid,clearProductGrid,renderProductDetail,clearProductDetail} from "../modern/storefront.js";
const safe=value=>escapeHtml(value??"");
// Institutional and service pages do not need to download the catalog snapshot.
let snapshotPromise,SNAPSHOT_NOTICE="Fotos e descrições salvas; dados comerciais precisam de confirmação.";
function loadSnapshot(){
 return snapshotPromise??=import("./public-catalog-snapshot.js").then(module=>{
  SNAPSHOT_NOTICE=module.SNAPSHOT_NOTICE;
  return module;
 }).catch(()=>{
  // A missing optional preview must not prevent the real API from loading.
  return {snapshotCatalogPage:()=>({items:[],hasNext:false}),snapshotCategories:()=>[],
   snapshotProduct:()=>null,canShowPublicSnapshot:()=>false};
 });
}

// The eight previously supplied Skelt miniatures are kept only as an offline
// fallback. Primary product photos come from the official Skelt CDN via API.
// Never infer stock or sales availability from the presence of an image.
const SKELT_IMAGE_FALLBACK=Object.freeze({
 "Maquiagem Corporal Bronzeado Instantâneo":"maquiagem-corporal-bronzeado-instantaneo.webp",
 "Kit Miniaturas Sellers Set":"kit-miniaturas-sellers-set.webp",
 "Kit miniaturas Exótic Set":"kit-miniaturas-exotic-set.webp",
 "Kit Miniaturas Trends Set":"kit-miniaturas-trends-set.webp",
 "Mousse Autobronzeador Dark":"mousse-autobronzeador-dark.webp",
 "Luva aplicadora de autobronzeador":"luva-aplicadora-autobronzeador.webp",
 "Autobronzeador Bifásico":"autobronzeador-bifasico.webp",
 "Maquiagem Corporal Iluminador":"maquiagem-corporal-iluminador.webp"
});
function imageFallback(p){
 const file=p?.brand?.name==="Skelt"?SKELT_IMAGE_FALLBACK[p?.name]:null;
 return file?"assets/images/catalogo/skelt/"+file:"assets/images/brand/product-photo-pending.svg";
}
// CSP-safe fallback, including when an upstream image host rejects a request.
// The alternative must be a local, explicitly approved static asset.
document.addEventListener("error",event=>{
 const image=event.target;
 if(!(image instanceof HTMLImageElement))return;
 const fallback=image.dataset.imageFallback;
 if(!fallback)return;
 delete image.dataset.imageFallback;
 if(!/^assets\/images\/[a-z0-9/_-]+\.(?:svg|webp)$/.test(fallback))return;
 image.src=new URL(fallback,location.href).href;
},true);
function imageFromProduct(p){
 const raw=p?.images?.[0]?.url;
 if(typeof raw!=="string"||!raw.trim())return "assets/images/brand/product-photo-pending.svg";
 try{
  const url=new URL(raw,location.href);
  if(url.protocol==="https:"||(url.origin===location.origin&&["http:","https:"].includes(url.protocol)))return url.href;
 }catch{}
 return "assets/images/brand/product-photo-pending.svg";
}
const imageFromOffering=o=>{
 if(typeof o.imageUrl!=="string"||!o.imageUrl.trim())return "assets/images/brand/product-photo-pending.svg";
 try{const u=new URL(o.imageUrl,location.href);if(u.protocol==="https:"||u.origin===location.origin)return u.href;}catch{}
 return "assets/images/brand/product-photo-pending.svg";
};
function status(target,message,error=false){
 if(!target)return;let region=target.querySelector("[data-api-status]");
 if(!region){region=document.createElement("p");region.setAttribute("role","status");region.dataset.apiStatus="";region.style.marginBlock="24px";target.prepend(region);}
 region.textContent=message;region.style.color=error?"#a13023":"#6d625b";
}
function liveProductCard(p){
 const id=numberId(p?.id);
 if(id===null)return null;
 const price=currentPrice(p),available=!!p.available;
 const preview=p?.offlineSnapshot===true;
 const pricePending=preview||price===null||price===0;
 const label=preview?"Preço a confirmar":pricePending?"Valor sob consulta":money(price);
 const state=preview?"snapshot":pricePending?"pending":available?"available":"unavailable";
 // React escapes text values and keeps the validated product identifier.
 return {id,name:String(p.name||"Produto sem nome"),brand:String(p.brand?.name||"Catálogo da loja"),
  description:String(p.description||""),image:imageFromProduct(p),fallback:imageFallback(p),
  alt:String(p.images?.[0]?.altText||p.name||"Produto"),price:label,state};
}
/** Show previously public photos without using stale stock/prices for sale. */
function showSnapshotNotice(grid,message=SNAPSHOT_NOTICE){
 if(!grid?.parentNode)return;
 let note=grid.parentNode.querySelector('[data-snapshot-for="'+grid.id+'"]');
 if(!note){
  note=document.createElement("p");
  note.className="catalog-snapshot-notice";
  note.dataset.snapshotFor=grid.id;
  note.setAttribute("role","status");
  grid.before(note);
 }
 note.textContent=message;
}
function clearSnapshotNotice(grid){
 grid?.parentNode?.querySelector('[data-snapshot-for="'+grid.id+'"]')?.remove();
}
/** Perceived-loading placeholder; never substitute fake products for API data. */
function catalogLoadingMarkup(count=4){
 return Array.from({length:count},()=>'<div class="product-skeleton" aria-hidden="true"><div class="product-skeleton__art"></div><div class="product-skeleton__line"></div><div class="product-skeleton__line"></div><div class="product-skeleton__line"></div></div>').join("");
}
const confirmationGate=createConfirmationGate();
let requestConfirmation=null;
function ensureDialog(){
 let dlg=document.getElementById("whatsapp-confirm-dialog");
 if(dlg)return dlg;
 dlg=document.createElement("dialog");dlg.id="whatsapp-confirm-dialog";dlg.className="drawer";dlg.setAttribute("aria-labelledby","confirm-heading");
 dlg.innerHTML='<div class="drawer-inner"><div class="drawer-head"><h2 id="confirm-heading">Confirme sua consulta</h2><button type="button" class="icon-button icon-button--close" id="close-confirm" aria-label="Fechar">'+UI_ICONS.close+'</button></div><div class="drawer-items"><p id="confirm-details"></p><div id="confirm-options"></div><p id="confirm-feedback" role="status" aria-live="polite"></p></div><div class="drawer-footer"><button type="button" class="btn btn--primary btn--full" id="send-confirm">Validar preço e disponibilidade</button><p id="confirmed-link"></p><small>O backend confirma a informação atual. A mensagem só é aberta quando você clicar no link validado.</small></div></div>';
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
   const a=document.createElement("a");a.href=response.url;a.target="_blank";a.rel="noopener noreferrer";a.className="btn btn--secondary btn--full";a.textContent="Abrir WhatsApp com informações confirmadas";link.append(a);
   if(response.message){
    const copy=document.createElement("button");copy.type="button";copy.className="btn btn--ghost btn--full";
    copy.textContent="Copiar mensagem confirmada";
    copy.addEventListener("click",async()=>{
     if(!confirmationGate.isCurrent(revision)||!dlg.open)return;
     try{await navigator.clipboard.writeText(response.message);if(confirmationGate.isCurrent(revision)&&dlg.open)feedback.textContent="Mensagem copiada.";}
     catch{if(confirmationGate.isCurrent(revision)&&dlg.open)feedback.textContent="Não foi possível copiar. Utilize o link confirmado.";}
    });
    link.append(copy);
   }
   feedback.textContent="Informações atualizadas confirmadas. Revise o resumo no WhatsApp antes de enviar.";
  }catch(err){
   if(confirmationGate.isCurrent(revision)&&dlg.open){
    feedback.textContent=err instanceof ApiError?err.message:"Não foi possível validar. Tente novamente.";
    if(err instanceof ApiError&&[404,409].includes(err.status)){
     const reload=document.createElement("button");reload.type="button";reload.className="btn btn--secondary btn--full";
     reload.textContent="Atualizar informações";
     reload.addEventListener("click",async()=>{
      if(!confirmationGate.isCurrent(revision)||!dlg.open)return;
      const refreshRevision=confirmationGate.begin();
      reload.disabled=true;btn.disabled=true;feedback.textContent="Consultando os dados atuais...";
      try{
       const fresh=selection.type==="PRODUCT"?await fetchProduct(selection.id):await fetchOffering(selection.id);
       if(!confirmationGate.isCurrent(refreshRevision)||!dlg.open)return;
       const newPrice=currentPrice(fresh);
       if(!fresh?.available||(selection.type==="PRODUCT"&&(newPrice===null||newPrice<=0))){
        requestConfirmation=null;link.replaceChildren();
        feedback.textContent="Este item não está disponível para consulta agora.";return;
       }
       showConfirmation({type:selection.type,item:fresh});
       feedback.textContent="As informações foram atualizadas. Revise e confirme novamente.";
      }catch(error){
       if(confirmationGate.isCurrent(refreshRevision)&&dlg.open){
        requestConfirmation=null;link.replaceChildren();
        feedback.textContent=error instanceof ApiError?error.message:"Não foi possível atualizar agora.";
       }
      }
     },{once:true});
     link.append(reload);
    }
   }
  }finally{
   if(confirmationGate.isCurrent(revision))btn.disabled=false;
  }
 });
 return dlg;
}
function showConfirmation({type,item}){
 if(!item||!item.available)return;
 const dlg=ensureDialog(),price=currentPrice(item),name=item.name||item.title;
 if(type==="PRODUCT"&&(item.offlineSnapshot||price===null||price<=0))return;
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
 if(!dlg.open)dlg.showModal();
}
let currentProducts=[],currentOfferings=[];
/** Enable the existing WhatsApp confirmation dialog on dedicated public service pages. */
export function registerPublicOfferings(items){
 currentOfferings=Array.isArray(items)?items.filter(x=>numberId(x?.id)!==null):[];
}
document.addEventListener("click",e=>{
 const item=e.target.closest("[data-confirm-product]");
 if(item){const p=currentProducts.find(x=>numberId(x.id)===Number(item.dataset.confirmProduct));if(p)showConfirmation({type:"PRODUCT",item:p});}
 const offer=e.target.closest("[data-confirm-offering]");
 if(offer){const o=currentOfferings.find(x=>numberId(x.id)===Number(offer.dataset.confirmOffering));if(o)showConfirmation({type:"OFFERING",item:o});}
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
  if(!channels.length){status(links,"Conheça nosso universo de fragrâncias e presentes.");const a=document.createElement("a");a.className="btn btn--secondary";a.href="contato.html";a.textContent="Informações de atendimento";links.append(a);return;}
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
 clearProductGrid(grid);grid.replaceChildren(...CATEGORY_PREVIEWS.map(item=>previewCard(item)));
 try{
  const categories=await fetchCategories();
  clearProductGrid(grid);
  if(!categories.length){grid.replaceChildren(...CATEGORY_PREVIEWS.map(item=>previewCard(item)));return;}
  const palette=["#edced6","#e7e7c4","#dfd0c1","#ebcfc6"];
  for(const [index,category] of categories.slice(0,8).entries()){
   const link=document.createElement("a");
   link.className="family-tile";
   link.href="catalogo.html?familia="+encodeURIComponent(category.name);
   link.style.setProperty("--tile-color",palette[index%palette.length]);
   const order=document.createElement("span");order.textContent=String(index+1).padStart(2,"0")+" / "+String(categories.length).padStart(2,"0");
   const symbol=document.createElement("i");symbol.textContent="✿";symbol.setAttribute("aria-hidden","true");
   const heading=document.createElement("strong");heading.textContent=category.name;
   const detail=document.createElement("span");detail.textContent="Ver produtos da categoria";
   link.append(order,symbol,heading,detail);grid.append(link);
  }
 }catch(error){
  clearProductGrid(grid);status(grid,"Categorias indisponíveis. Use a busca do catálogo.",true);
  grid.append(...CATEGORY_PREVIEWS.map(item=>previewCard(item)));
 }
}
async function initHomeOfferings(){
 const sec=document.querySelector("#experiencias .editorial-copy");
 if(sec){
  const box=document.createElement("div");box.className="service-preview-list";sec.append(box);
  try{
   currentOfferings=await fetchOfferings();
   const published=currentOfferings.filter(item=>item.published!==false).slice(0,3);
   for(const offering of published){
    const card=document.createElement("article");card.className="service-preview";
    const head=document.createElement("div");head.className="service-preview__copy";
    const name=document.createElement("h3");name.textContent=String(offering.title||"Serviço");
    const kind=document.createElement("span");kind.className="service-preview__kind";
    kind.textContent=String(offering.type||"Experiência");
    const price=document.createElement("p");price.textContent=offering.price===null?"Valor sob consulta":money(offering.price);
    head.append(kind,name,price);card.append(head);
    if(offering.available){
     const btn=document.createElement("button");btn.type="button";btn.className="btn btn--ghost";
     btn.textContent="Consultar";btn.dataset.confirmOffering=offering.id;card.append(btn);
    }else{
     const badge=document.createElement("span");badge.className="badge";badge.textContent="Indisponível";card.append(badge);
    }
    box.append(card);
   }
   if(!published.length){
    for(const item of SERVICE_PREVIEWS){
     const card=document.createElement("article");card.className="service-preview";
     const copy=document.createElement("div");copy.className="service-preview__copy";
     const kind=document.createElement("span");kind.className="service-preview__kind";kind.textContent="Inspiração";
     const title=document.createElement("h3");title.textContent=item.title;
     const description=document.createElement("p");description.textContent=item.description;
     copy.append(kind,title,description);card.append(copy);box.append(card);
    }
   }
  }catch{box.remove();}
 }
}

async function initHome(){
 const {snapshotCatalogPage,canShowPublicSnapshot}=await loadSnapshot();
 const cta=document.querySelector(".hero-copy .btn--primary");
 if(cta?.firstChild?.nodeType===Node.TEXT_NODE)cta.firstChild.textContent="Explorar produtos ";
 // Curated editorial tiles now link to real published product categories
 // (Perfumaria and Kits para presente), not fictional olfactory families.
 const collectionSection=document.getElementById("colecoes");
 if(collectionSection)collectionSection.hidden=false;
 const showcase=document.getElementById("mais-amados");
 if(showcase){
  const eyebrow=showcase.querySelector(".eyebrow"),heading=showcase.querySelector("h2");
  if(eyebrow)eyebrow.textContent="CATÁLOGO PUBLICADO";
  if(heading)heading.textContent="Produtos para descobrir.";
 }
 const quizLead=document.querySelector("#quiz p.lead");
 if(quizLead)quizLead.textContent="Responda às experiências da loja sem armazenar suas respostas.";
 const editorialImage=document.querySelector("#experiencias img[data-parallax]");
 // The home uses self-hosted, transparent editorial illustrations. SKU photos remain API-owned.
 void initLiveCategoryHighlights();
 void initContact();
 // Service discovery is independent of slow product and quiz endpoints.
 void initHomeOfferings();
 void initCampaignBanners();
 const grid=document.getElementById("featured-grid");
 if(grid){
  let loadingFeatured=false;
  const recovery=foregroundRecovery(()=>loadFeatured());
  document.addEventListener("visibilitychange",()=>recovery.resume());
  window.addEventListener("pagehide",()=>recovery.stop());
  const paintFeatured=page=>{
   recovery.stop();
   currentProducts=page.items;
   renderProductGrid(grid,currentProducts.slice(0,8).map(liveProductCard),{title:"Nenhum produto publicado ainda.",description:"Explore outras experiências da loja enquanto o catálogo é preparado."});
   clearSnapshotNotice(grid);
  };
  const loadFeatured=async()=>{
   if(loadingFeatured)return;
   loadingFeatured=true;
   grid.parentNode?.querySelector("[data-home-retry]")?.remove();
   const preview=readPreview("featured")||snapshotCatalogPage(0);
   currentProducts=preview.items;
   renderProductGrid(grid,preview.items.slice(0,8).map(liveProductCard));
   showSnapshotNotice(grid,"Conferindo preços e disponibilidade atualizados...");
   grid.setAttribute("aria-busy","true");
   // Cache-only edge preview may be newer than the bundled fallback.
   void fetchCatalogPreview("featured").then(cached=>{
    if(!cached||!loadingFeatured||!grid.hasAttribute("aria-busy"))return;
    currentProducts=cached.items;renderProductGrid(grid,cached.items.slice(0,8).map(liveProductCard));
   });
   try{
    const page=await loadCatalogPage((_index,_filters,signal)=>fetchFeatured(signal),0);
    paintFeatured(page);
   }catch(err){
    if(!canShowPublicSnapshot(err)&&!currentProducts.length){
     status(grid,"Não foi possível carregar os produtos da loja.",true);
    }else showSnapshotNotice(grid);
    recovery.start();
    const retry=document.createElement("button");
    retry.type="button";retry.className="btn btn--secondary";
    retry.dataset.homeRetry="";
    retry.textContent="Tentar novamente";
    retry.addEventListener("click",()=>void loadFeatured(),{once:true});
    grid.after(retry);
   }finally{loadingFeatured=false;grid.removeAttribute("aria-busy");}
  };
  // Homepage sections are independent: a sleeping API must not hold the quiz
  // and service discovery until the featured-products retry window finishes.
  void loadFeatured();
  setupCommercialRefresh(async()=>{
   if(loadingFeatured)return;
   loadingFeatured=true;
   try{
    const page=await fetchFeatured();
    grid.parentNode?.querySelector("[data-home-retry]")?.remove();
    paintFeatured(page);
   }catch{
    const preview=readPreview("featured")||snapshotCatalogPage(0);
    currentProducts=preview.items;renderProductGrid(grid,currentProducts.slice(0,8).map(liveProductCard));
    showSnapshotNotice(grid);recovery.start();
   }
   finally{loadingFeatured=false;}
  });
 }
 // Replace local demonstration quiz with the actual backend question contract.
 const quiz=document.getElementById("quiz-form");
 if(quiz){
  quiz.replaceChildren();status(quiz,"Buscando experiências da loja...");
  try{
   const experiences=await fetchExperiences(),e=experiences?.[0];
   if(!e){quiz.replaceChildren(previewCard({title:"Descubra seu estilo olfativo",description:"Flores, notas frescas, madeiras e aromas envolventes: explore as combinações que despertam boas sensações.",symbol:"✧"},"Experiência ilustrativa"));}
   else{
    const full=Array.isArray(e.questions)&&e.questions.length?e:await fetchExperience(e.id);quiz.replaceChildren();
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


}
async function initCatalog(){
 const {snapshotCatalogPage,snapshotCategories,canShowPublicSnapshot}=await loadSnapshot();
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
 const search=createCatalogSearch(async(page,filters,signal,context)=>{
  if(context.refresh)return {...await fetchProducts(page,signal,filters),source:"live"};
  if(context.source==="snapshot"&&page>0)return {...snapshotCatalogPage(page,filters),source:"snapshot"};
  try{
   const result=await loadCatalogPage(
    (index,options,requestSignal)=>fetchProducts(index,requestSignal,options),
    page,filters,undefined,signal);
   return {...result,source:"live"};
  }catch(error){
   // A later live page must be retried, never mixed with old preview rows.
   if(signal.aborted||error?.name==="AbortError"||page>0||(!canShowPublicSnapshot(error)&&!snapshotCatalogPage(page,filters).items.length))throw error;
   if(isUnfilteredFirstPage(page,filters)){
    const cached=readPreview("catalog")||await fetchCatalogPreview("catalog",signal);
    if(cached)return {...cached,source:"snapshot"};
   }
   return {...snapshotCatalogPage(page,filters),source:"snapshot"};
  }
 });
 const loadMore=document.createElement("button");loadMore.type="button";loadMore.className="btn btn--secondary";
 loadMore.textContent="Carregar mais produtos";grid.after(loadMore);
 const retryLive=document.createElement("button");retryLive.type="button";retryLive.className="btn btn--secondary";
 retryLive.textContent="Atualizar dados da loja";retryLive.hidden=true;loadMore.after(retryLive);
 let version=0,searchTimer=null,categoryWarning="",hasLiveView=false;
 const recovery=foregroundRecovery(()=>refresh());
 document.addEventListener("visibilitychange",()=>recovery.resume());
 window.addEventListener("pagehide",()=>recovery.stop());
 const params=new URLSearchParams(location.search),familyName=params.get("familia");
 // Display the unfiltered catalog immediately. The categories endpoint is an
 // independent enhancement and must not block the first product listing.
 const categoryField=family.closest(".field");
 const initialCategories=snapshotCategories();
 function paintCategories(categories){
  const selectedId=family.value;
  family.replaceChildren();
  const any=document.createElement("option");
  any.value="";any.textContent="Todas as categorias";family.append(any);
  for(const c of categories){
   const option=document.createElement("option");option.value=String(c.id);
   option.textContent=c.name;family.append(option);
  }
  if(selectedId&&categories.some(c=>String(c.id)===selectedId))family.value=selectedId;
  else if(categories.some(c=>String(c.id)===new URLSearchParams(location.search).get("categoryId")))
   family.value=new URLSearchParams(location.search).get("categoryId");
  else if(familyName&&new URLSearchParams(location.search).has("familia")){
   const requestedName=new URLSearchParams(location.search).get("familia");
   const match=categories.find(c=>c.name.toLocaleLowerCase("pt-BR")===requestedName.toLocaleLowerCase("pt-BR"));
   if(match)family.value=String(match.id);
  }
  family.disabled=false;
 }
 paintCategories(initialCategories);
 async function loadCategories(){
  try{
   const categories=await fetchCategories();
   categoryWarning="";
   const before=family.value;
   paintCategories(categories);
   if(before!==family.value)applyServerFilters();
  }catch(error){
   // Keep public cached categories rather than hiding the filter entirely.
   categoryWarning="Categorias carregadas da vitrine salva. ";
  }finally{toolbar.render();}
 }
 if(params.has("q"))queryField.value=params.get("q").slice(0,180);
 function render(appendFrom=0){
  const state=search.state;
  const snapshotActive=state.source==="snapshot";
  hasLiveView=state.source==="live";
  grid.querySelector("[data-api-status]")?.remove();
  renderProductGrid(grid,state.items.map(liveProductCard),snapshotActive
   ?{title:"Aguardando o catálogo atualizado.",description:"Não há resultados nesta prévia. A loja será consultada novamente."}
   :{title:"Nenhum produto encontrado.",description:"Experimente outro termo ou remova os filtros para explorar o catálogo completo."});
  if(snapshotActive)
   showSnapshotNotice(grid,SNAPSHOT_NOTICE+((form.elements.max?.value||String(form.elements.sort?.value||"").startsWith("price-"))?" A filtragem e a ordenação por preço dependem da API.":""));
  else clearSnapshotNotice(grid);
  if(snapshotActive)recovery.start();else recovery.stop();
  toolbar.render();
  count.textContent=categoryWarning+state.items.length+" produtos carregados"+
    (state.hasNext?" · mais páginas disponíveis":" · fim dos resultados");
  loadMore.hidden=!state.hasNext;
  loadMore.textContent="Carregar mais produtos";
  retryLive.hidden=!snapshotActive;
 }
 async function next(expectedVersion=version){
  if(expectedVersion!==version)return;
  const previousCount=search.state.items.length;
  loadMore.disabled=true;
  if(!search.state.items.length){
   if(grid.dataset.snapshotPreview!=="true"&&grid.dataset.preserveView!=="true"){clearProductGrid(grid);grid.innerHTML=catalogLoadingMarkup(6);}
   grid.setAttribute("aria-busy","true");
  }
  else loadMore.textContent="Carregando mais...";
  try{
   const state=await search.next();
   if(expectedVersion!==version||state.stale)return;
   currentProducts=state.items;grid.dataset.snapshotPreview="false";render(previousCount);
  }catch(error){
   if(expectedVersion!==version)return;
   if(!search.state.items.length){
    hasLiveView=false;
    if(grid.dataset.snapshotPreview!=="true"&&grid.dataset.preserveView!=="true")clearProductGrid(grid);
   }
   status(grid,"Não foi possível carregar esta página: "+(error?.message||"Tente novamente."),true);
   loadMore.textContent="Tentar novamente";loadMore.hidden=false;
  }finally{if(expectedVersion===version){loadMore.disabled=false;grid.removeAttribute("aria-busy");grid.inert=false;grid.dataset.preserveView="false";}}
 }
 function applyServerFilters(){
  window.clearTimeout(searchTimer);
  recovery.stop();
  const wasLive=hasLiveView;
  search.setFilters({q:queryField.value,categoryId:family.closest(".field").hidden?null:family.value,
   sort:form.elements.sort?.value||"recent",maxPrice:form.elements.max?.value||null});
  version++;
  if(wasLive){
   // Keep decoded cards stable during a new search, but don't allow clicks
   // on results that belong to the previous set of filters.
   grid.inert=true;grid.dataset.preserveView="true";
   grid.dataset.snapshotPreview="false";clearSnapshotNotice(grid);
  }else{
   const activeFilters={q:queryField.value,categoryId:family.value,
    sort:form.elements.sort?.value||"recent",maxPrice:form.elements.max?.value};
   const preview=(isUnfilteredFirstPage(0,activeFilters)&&readPreview("catalog"))||snapshotCatalogPage(0,activeFilters);
   currentProducts=preview.items;
   renderProductGrid(grid,preview.items.map(liveProductCard),{title:"Buscando produtos...",description:"Aguarde a consulta ao catálogo atualizado."});
   grid.dataset.snapshotPreview="true";
   showSnapshotNotice(grid,"Conferindo dados atualizados...");
   if(isUnfilteredFirstPage(0,activeFilters)){
    const ticket=version;
    void fetchCatalogPreview("catalog").then(cached=>{
     if(!cached||ticket!==version||grid.dataset.snapshotPreview!=="true"||!grid.hasAttribute("aria-busy"))return;
     currentProducts=cached.items;renderProductGrid(grid,cached.items.map(liveProductCard));
    });
   }
  }
  toolbar.render();
  count.textContent="Verificando os dados publicados...";
  loadMore.hidden=true;
  retryLive.hidden=true;
  retryLive.disabled=false;
  void next(version);
 }
 const toolbar=setupCatalogToolbar({form,count,onChange:applyServerFilters});
 queryField.addEventListener("input",()=>{
  window.clearTimeout(searchTimer);
  searchTimer=window.setTimeout(applyServerFilters,300);
 });
 family.addEventListener("change",()=>{
  const url=new URL(location.href);
  url.searchParams.delete("categoryId");
  if(family.value)url.searchParams.set("familia",family.selectedOptions[0].textContent);
  else url.searchParams.delete("familia");
  history.replaceState(history.state,"",url.pathname+url.search+url.hash);
  applyServerFilters();
 });
 form.addEventListener("submit",event=>{event.preventDefault();applyServerFilters();});
 for(const field of ["sort","max"])form.elements[field]?.addEventListener("change",applyServerFilters);
 loadMore.addEventListener("click",()=>void next());
 const refresh=async()=>{
  if(grid.hasAttribute("aria-busy")||loadMore.disabled)return;
  const expectedVersion=version;
  grid.setAttribute("aria-busy","true");loadMore.disabled=true;retryLive.disabled=true;
  try{
   const state=await search.refreshLoaded();
   if(expectedVersion!==version||state.stale)return;
   currentProducts=state.items;render();
  }catch{
   if(expectedVersion===version){
    count.textContent="Não foi possível atualizar agora. Os dados serão novamente confirmados antes da consulta.";
    recovery.start();
   }
  }finally{
   if(expectedVersion===version){grid.removeAttribute("aria-busy");loadMore.disabled=false;retryLive.disabled=false;}
  }
 };
 retryLive.addEventListener("click",()=>void refresh());
 setupCommercialRefresh(refresh);
 applyServerFilters();
 void loadCategories();
}
async function initProduct(){
 const host=document.getElementById("product-content");if(!host)return;
 const relatedGrid=document.getElementById("related-grid"),relatedSection=relatedGrid?.closest("section");
 if(relatedSection)relatedSection.hidden=true;
 const query=new URLSearchParams(location.search),id=numberId(query.get("productId"));
 if(!id){status(host,"Selecione um produto do catálogo real.");return;}
 status(host,"Carregando produto...");
 let current=null,viewVersion=0,loading=false;
 const clearRelated=()=>{
  if(relatedSection)relatedSection.hidden=true;
  if(relatedGrid)clearProductGrid(relatedGrid);
 };
 function renderProduct(p){
  current=p;viewVersion++;clearRelated();
  currentProducts=[p];
  const price=currentPrice(p),fallback=imageFallback(p);
  const gallery=productGalleryImages(p,{origin:location.origin,fallback});
  const pricePending=price===null||price===0;
  const priceLabel=p.offlineSnapshot?"Preço atualizado indisponível":pricePending?"Valor sob consulta":money(price);
  const quantity=Number(p.stockQuantity);
  const stockLabel=!p.offlineSnapshot&&!pricePending&&p.available&&Number.isSafeInteger(quantity)&&quantity>0
    ?quantity+(quantity===1?" unidade disponível":" unidades disponíveis"):"";
  const categories=(p.categories||[]).filter(c=>typeof c?.name==="string").slice(0,8).map(c=>c.name);
  renderProductDetail(host,{
   id,name:String(p.name||"Produto sem nome"),brand:String(p.brand?.name||"Lojinha da Kátia"),
   description:String(p.description||""),categories,images:gallery.length?gallery:[{url:imageFromProduct(p),alt:String(p.name||"Produto")}],
   fallback,price:priceLabel,stock:stockLabel,state:p.offlineSnapshot?"snapshot":pricePending?"pending":p.available?"available":"unavailable"
  });
  if(p.offlineSnapshot)showSnapshotNotice(host,SNAPSHOT_NOTICE);
  else clearSnapshotNotice(host);
  document.title=(p.name||"Produto")+" | Lojinha da Kátia";
 }
 async function loadRelated(p,revision){
  if(!relatedGrid||p.offlineSnapshot)return;
  try{
   let recommendations;
   try{
    recommendations=relatedCatalogProducts(p,await fetchRelatedProducts(id),4);
   }catch(error){
    // Transitional compatibility with the previously deployed API: use its
    // actual brand/category filters rather than scanning an unrelated page.
    if(![401,403,404,405].includes(Number(error?.status)))throw error;
    const candidates=[],brandId=numberId(p.brand?.id);
    if(brandId)candidates.push(...(await fetchProducts(0,undefined,{brandId})).items);
    for(const category of (p.categories||[]).slice(0,2)){
     if(relatedCatalogProducts(p,candidates,4).length>=4)break;
     const categoryId=numberId(category.id);
     if(categoryId)candidates.push(...(await fetchProducts(0,undefined,{categoryId})).items);
    }
    recommendations=relatedCatalogProducts(p,candidates,4);
   }
   if(revision!==viewVersion||!recommendations.length)return;
   currentProducts=[p,...recommendations];
   renderProductGrid(relatedGrid,recommendations.map(liveProductCard));
   if(relatedSection)relatedSection.hidden=false;
  }catch{/* Related products are optional; the main product remains visible. */}
 }
 function showRetry(){
  host.parentNode?.querySelector("[data-product-retry]")?.remove();
  const button=document.createElement("button");button.type="button";button.className="btn btn--secondary";
  button.dataset.productRetry="";button.textContent="Atualizar produto";
  button.addEventListener("click",()=>void refresh(),{once:true});host.after(button);
 }
 async function refresh({initial=false}={}){
  if(loading)return;
  loading=true;host.parentNode?.querySelector("[data-product-retry]")?.remove();
  let remoteSettled=false;
  const remote=fetchProduct(id).then(value=>{remoteSettled=true;return {value};},
   error=>{remoteSettled=true;return {error};});
  try{
   const {snapshotProduct,canShowPublicSnapshot}=await loadSnapshot();
   const preview=initial?snapshotProduct(id):null;
   if(preview&&!remoteSettled){
    renderProduct(preview);
    showSnapshotNotice(host,"Conferindo preço e disponibilidade atualizados...");
   }
   const result=await remote;
   if(result.error){
    // A definitive not-found/invalid response must remove an outdated preview.
    if([400,404].includes(Number(result.error?.status))||!canShowPublicSnapshot(result.error))throw result.error;
    const display=current||preview;
    if(!display)throw result.error;
    renderProduct({...display,offlineSnapshot:true,price:null,effectivePrice:null,available:false,stockQuantity:undefined});
    showRetry();
    return;
   }
   const p=result.value;
   if(numberId(p?.id)!==id||p.published===false)throw new ApiError("Produto não encontrado.",404);
   if(!current||JSON.stringify(current)!==JSON.stringify(p))renderProduct(p);
   else {current=p;currentProducts=[p];clearRelated();viewVersion++;}
   void loadRelated(p,viewVersion);
  }catch(error){
   current=null;currentProducts=[];viewVersion++;clearRelated();clearSnapshotNotice(host);
   clearProductDetail(host);status(host,"Não foi possível carregar: "+error.message,true);showRetry();
  }finally{loading=false;}
  }
 setupCommercialRefresh(()=>refresh());
 await refresh({initial:true});
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
