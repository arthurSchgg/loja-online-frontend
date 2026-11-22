import {fetchCampaigns} from "./api.js";
import {safeProductPhotoUrl} from "./product-gallery.js";

export function internalBannerLink(raw){
 if(typeof raw!=="string")return null;
 if(/^\/(?:catalogo|conheca-a-loja|viva-sua-experiencia|espaco-das-velas|contato)\.html$/.test(raw)||
    /^\/produto\.html\?productId=[0-9]{1,18}$/.test(raw)||
    /^\/catalogo\.html\?categoryId=[0-9]{1,18}$/.test(raw))return raw;
 return null;
}
export function visibleBanners(rows,origin,now=Date.now()){
 return (Array.isArray(rows)?rows:[]).filter(row=>row?.published===true&&typeof row.title==="string"&&
   (!row.startsAt||Date.parse(row.startsAt)<=now)&&(!row.endsAt||Date.parse(row.endsAt)>now))
  .map(row=>({...row,src:safeProductPhotoUrl(row.imageUrl,{origin}),href:internalBannerLink(row.linkUrl)}))
  .filter(row=>row.src).sort((a,b)=>(Number(a.position)||0)-(Number(b.position)||0)).slice(0,20);
}
const el=(tag,label="",cls="")=>{const e=document.createElement(tag);e.textContent=label;if(cls)e.className=cls;return e;};
export async function initCampaignBanners(){
 const hero=document.querySelector(".hero");if(!hero||document.querySelector(".managed-banner"))return;
 let banners;
 try{banners=visibleBanners(await fetchCampaigns(),location.origin);}catch{return;}
 // The approved home and its cinematic hero stay exactly as they are when no campaign is published.
 if(!banners.length)return;
 const section=el("section","","managed-banner container");
 section.setAttribute("aria-label","Campanhas e novidades da loja");
 section.setAttribute("aria-roledescription","carrossel");
 const frame=el("article","","managed-banner__frame"),img=el("img"),copy=el("div","","managed-banner__copy");
 img.width=800;img.height=450;img.loading="lazy";img.decoding="async";
 const title=el("h2"),subtitle=el("p"),cta=el("a","Explorar","btn btn--primary");
 copy.append(el("span","NOVIDADES DA LOJA","eyebrow"),title,subtitle,cta);frame.append(img,copy);section.append(frame);
 const controls=el("div","","managed-banner__controls"),dots=el("div","","managed-banner__dots");
 let index=0,timer=null,hover=false,focused=false,visible=true;
 const preference=matchMedia("(prefers-reduced-motion: reduce)");
 let paused=preference.matches||navigator.connection?.saveData===true;
 const button=(label,handler)=>{const b=el("button",label,"btn btn--secondary");b.type="button";b.addEventListener("click",handler);return b;};
 const prev=button("Anterior",()=>go(index-1,true)),next=button("Próximo",()=>go(index+1,true));
 const toggle=button(paused?"Reproduzir":"Pausar",()=>{paused=!paused;toggle.textContent=paused?"Reproduzir":"Pausar";schedule();});
 const indicators=[];
 for(let i=0;i<banners.length;i++){
  const dot=button(String(i+1),()=>go(i,true));dot.setAttribute("aria-label","Mostrar campanha "+(i+1));indicators.push(dot);dots.append(dot);
 }
 function go(value,user=false){
  index=(value+banners.length)%banners.length;
  const item=banners[index];img.src=item.src;img.alt=item.title;title.textContent=item.title;subtitle.textContent=String(item.subtitle||"");
  cta.hidden=!item.href;if(item.href)cta.href=item.href;else cta.removeAttribute("href");
  indicators.forEach((dot,i)=>dot.setAttribute("aria-current",i===index?"true":"false"));
  if(user)schedule();
 }
 function schedule(){
  clearInterval(timer);timer=null;
  if(!paused&&!hover&&!focused&&visible&&!document.hidden&&section.isConnected&&banners.length>1)
   timer=setInterval(()=>go(index+1),6500);
 }
 if(banners.length>1){
  controls.append(prev,dots,next,toggle);section.append(controls);
  section.addEventListener("mouseenter",()=>{hover=true;schedule();});
  section.addEventListener("mouseleave",()=>{hover=false;schedule();});
  section.addEventListener("focusin",()=>{focused=true;schedule();});
  section.addEventListener("focusout",event=>{if(!section.contains(event.relatedTarget)){focused=false;schedule();}});
  section.addEventListener("keydown",event=>{if(event.key==="ArrowLeft"||event.key==="ArrowRight"){event.preventDefault();go(index+(event.key==="ArrowLeft"?-1:1),true);}});
  document.addEventListener("visibilitychange",schedule);
  preference.addEventListener?.("change",()=>{if(preference.matches){paused=true;toggle.textContent="Reproduzir";schedule();}});
  if("IntersectionObserver" in window)new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting);schedule();}).observe(section);
  window.addEventListener("pagehide",()=>{clearInterval(timer);timer=null;});
  window.addEventListener("pageshow",schedule);
 }
 go(0);hero.after(section);schedule();
}
