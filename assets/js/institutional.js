/** Public "Conheça a Loja" and "Espaço das Velas".
 * Never present demonstration content as a published commercial offer.
 * All API-provided text uses textContent and links use explicit allowlists.
 */
import {isLive} from "./config.js";
import {fetchStore,fetchContentSections,fetchOfferings} from "./api.js";
import {money} from "./data.js";
import {officialStoreLinks} from "./official-contact.js";
import {safeNumericId} from "./render-safety.js";
import {registerPublicOfferings} from "./live.js";
import {STORY_PREVIEW,renderServicePreviews} from "./editorial-defaults.js";

export function isAboutSection(section){
 const slug=String(section?.slug||"").toLocaleLowerCase("pt-BR");
 return ["conheca-a-loja","conheca-loja","sobre","sobre-a-loja","nossa-historia","historia-da-loja","historia"].includes(slug)
  ||slug.startsWith("sobre-");
}
export function safeInstitutionalImage(value,base="https://example.invalid/"){
 if(typeof value!=="string"||!value.trim()||value.length>2048)return null;
 try{
  const url=new URL(value,base),origin=new URL(base).origin;
  if(url.username||url.password||!url.hostname)return null;
  if(url.protocol==="https:"||(url.origin===origin&&url.protocol==="http:"))return url.href;
 }catch{}
 return null;
}
const host=id=>document.getElementById(id);
function status(target,message,error=false){
 if(!target)return;
 target.replaceChildren();
 const paragraph=document.createElement("p");
 paragraph.className="offering-empty";
 paragraph.setAttribute("role","status");
 paragraph.textContent=message;
 if(error)paragraph.dataset.apiError="";
 target.append(paragraph);
}
function contactNote(target,message,retry=false){
 target.replaceChildren();
 const note=document.createElement("p");
 note.className="institutional-contact-note";
 note.textContent=message;
 target.append(note);
 if(retry){
  const button=document.createElement("button");
  button.className="btn btn--secondary";button.type="button";
  button.textContent="Tentar novamente";
  button.addEventListener("click",()=>void initAbout(),{once:true});
  target.append(button);
 }
}
function storyNote(target,message,retry=false){
 target.replaceChildren();
 const note=document.createElement("p");
 note.className="institutional-story-note";
 note.setAttribute("role","status");
 note.textContent=message;
 target.append(note);
 if(retry){
  const button=document.createElement("button");
  button.className="text-link institutional-retry";
  button.type="button";
  button.textContent="Tentar novamente";
  button.addEventListener("click",()=>void initAbout(),{once:true});
  target.append(button);
 }
}
function storyPreview(target,append=false){
 const title=document.createElement("h3");title.textContent=STORY_PREVIEW.title;
 const body=document.createElement("p");body.textContent=STORY_PREVIEW.body;
 const label=document.createElement("span");label.className="eyebrow";label.textContent="Apresentação editorial";
 const article=document.createElement("article");article.className="story-preview";article.append(label,title,body);
 if(append)target.append(article);else target.replaceChildren(article);
}
function renderContacts(target,store){
 target.replaceChildren();
 const links=officialStoreLinks(store);
 if(!links.length){
  contactNote(target,"Os canais de atendimento serão exibidos aqui quando forem confirmados pela loja.");
  return;
 }
 for(const channel of links){
  const a=document.createElement("a");
  a.href=channel.href;
  a.className="btn btn--secondary";
  a.textContent=channel.label;
  if(channel.external){a.target="_blank";a.rel="noopener noreferrer";}
  target.append(a);
 }
}
function renderStory(section){
 const article=document.createElement("article");article.className="official-story-entry";
 article.dataset.reveal="";
 const title=document.createElement("h3");title.textContent=section.title;
 const body=document.createElement("p");body.textContent=String(section.body||"");
 article.append(title,body);
 const src=safeInstitutionalImage(section.imageUrl,location.href);
 if(src){
  const img=document.createElement("img");
  img.src=src;img.alt=section.title;
  img.loading="lazy";img.width=540;img.height=350;
  article.append(img);
 }
 return article;
}
let aboutVersion=0;
async function initAbout(){
 const story=host("official-story"),contacts=host("about-contacts");
 if(!story||!contacts)return;
 const revision=++aboutVersion;
 storyPreview(story);
 status(contacts,"Buscando os contatos oficiais...");
 const signature=document.querySelector(".quote-section__signature");
 if(signature)signature.textContent="Lojinha da Kátia";
 // Render independent results as soon as each arrives, even if the other
 // endpoint is still waking up or unavailable.
 const storyRequest=fetchContentSections().then(sections=>{
  if(revision!==aboutVersion)return;
  const published=sections.filter(isAboutSection);
  story.replaceChildren();
  if(published.length){
   for(const section of published)story.append(renderStory(section));
  }else storyPreview(story);
 }).catch(()=>{if(revision===aboutVersion){storyNote(story,"Nossa história está temporariamente indisponível. Você pode conhecer os produtos e as experiências da loja enquanto isso.",true);storyPreview(story,true);}});
 const contactRequest=fetchStore().then(store=>{
  if(revision!==aboutVersion)return;
  const intro=host("about-summary");
  if(intro&&typeof store.description==="string"&&store.description.trim())
   intro.textContent=store.description;
  renderContacts(contacts,store);
 }).catch(()=>{if(revision===aboutVersion)contactNote(contacts,"Os canais oficiais estão temporariamente indisponíveis.",true);});
 await Promise.allSettled([storyRequest,contactRequest]);
}
const typeLabels=Object.freeze({CANDLE:"Velas",WORKSHOP:"Oficinas",RENTAL:"Locações"});
function createCard(item){
 const article=document.createElement("article");
 article.className="offering-card";article.dataset.reveal="";
 const art=document.createElement("div");art.className="offering-card__art";
 const src=safeInstitutionalImage(item.imageUrl,location.href);
 if(src){
  const img=document.createElement("img");
  img.src=src;img.alt=String(item.title||"Serviço publicado").slice(0,180);
  img.loading="lazy";img.width=360;img.height=355;img.dataset.parallax="";
  art.append(img);
  const gallery=(Array.isArray(item.images)?item.images:[]).map(photo=>({
   url:safeInstitutionalImage(photo.url,location.href),alt:photo.altText||item.title
  })).filter(photo=>photo.url).slice(0,12);
  if(gallery.length>1){
   let index=0;
   const controls=document.createElement("div");controls.className="offering-gallery-controls";
   const count=document.createElement("span");count.setAttribute("aria-live","polite");
   const select=step=>{index=(index+step+gallery.length)%gallery.length;img.src=gallery[index].url;img.alt=String(gallery[index].alt||"Foto da oferta");count.textContent=(index+1)+" / "+gallery.length;};
   for(const [step,label] of [[-1,"Foto anterior"],[1,"Próxima foto"]]){
    const button=document.createElement("button");button.type="button";button.className="btn btn--secondary";button.textContent=step<0?"‹":"›";
    button.setAttribute("aria-label",label+" de "+item.title);button.addEventListener("click",()=>select(step));controls.append(button);
   }
   controls.insertBefore(count,controls.lastChild);select(0);art.append(controls);
  }
 }else{
  const icon=document.createElement("span");
  icon.textContent=item.type==="CANDLE"?"✽":item.type==="WORKSHOP"?"✦":"◇";
  icon.setAttribute("aria-hidden","true");art.append(icon);
 }
 const body=document.createElement("div");body.className="offering-card__body";
 const eyebrow=document.createElement("span");eyebrow.className="eyebrow";
 eyebrow.textContent=typeLabels[item.type];
 const title=document.createElement("h3");title.textContent=String(item.title||"Serviço publicado");
 const description=document.createElement("p");
 description.textContent=String(item.description||"Detalhes sob consulta.");
 const value=item.price===null?null:Number(item.price);
 const price=document.createElement("strong");price.className="offering-card__price";
 price.textContent=value===null||!Number.isFinite(value)||value<0?"Valor sob consulta":money(value);
 body.append(eyebrow,title,description,price);
 if(item.available){
  const button=document.createElement("button");button.type="button";
  button.className="btn btn--secondary";button.dataset.confirmOffering=String(item.id);
  button.textContent="Confirmar e consultar";body.append(button);
 }else{
  const badge=document.createElement("span");badge.className="badge";
  badge.textContent="Indisponível";badge.setAttribute("aria-label","Indisponível");
  body.append(badge);
 }
 article.append(art,body);
 return article;
}
async function initCandles(){
 const grid=host("candle-offerings"),filters=host("offering-filters"),contacts=host("candle-contacts");
 if(!grid||!filters||!contacts)return;
 renderServicePreviews(grid);
 grid.setAttribute("aria-busy","true");
 status(contacts,"Buscando os contatos oficiais...");
 fetchStore().then(store=>renderContacts(contacts,store))
  .catch(()=>status(contacts,"Não foi possível carregar os contatos oficiais.",true));
 try{
  const all=await fetchOfferings();
  if(!Array.isArray(all))throw new Error("Formato de serviços inesperado");
  const published=all.filter(item=>item&&item.published===true&&
   safeNumericId(item.id)!==null&&Object.hasOwn(typeLabels,item.type));
  registerPublicOfferings(published);
  const groups=[["ALL","Todos"],["CANDLE","Velas"],["WORKSHOP","Oficinas"],["RENTAL","Locações"]];
  let selection="ALL";
  filters.replaceChildren();
  filters.hidden=false;
  function render(){
   grid.replaceChildren();
   const visible=published.filter(item=>selection==="ALL"||item.type===selection);
   if(!visible.length)renderServicePreviews(grid,selection);
   else for(const item of visible)grid.append(createCard(item));
   for(const button of filters.querySelectorAll("button"))
    button.setAttribute("aria-pressed",String(button.dataset.offeringFilter===selection));
  }
  for(const [key,label] of groups){
   const button=document.createElement("button");
   button.type="button";button.textContent=label;button.dataset.offeringFilter=key;
   button.addEventListener("click",()=>{selection=key;render();});
   filters.append(button);
  }
  render();
 }catch{
  registerPublicOfferings([]);filters.hidden=true;
  status(grid,"Não foi possível carregar os serviços publicados. Tente novamente mais tarde.",true);
  const ideas=document.createElement("div");ideas.className="content-preview-fallback";renderServicePreviews(ideas);grid.append(ideas);
 }finally{grid.removeAttribute("aria-busy");}
}
if(isLive && typeof document!=="undefined"){
 // Hide all illustrative labels immediately, even when the live API fails.
 document.querySelectorAll("[data-demo-only]").forEach(el=>el.remove());
 if(host("official-story"))void initAbout();
 else if(host("candle-offerings"))void initCandles();
}
