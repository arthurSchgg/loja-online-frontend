const scenes=[
 {title:"Elegância floral",description:"Delicadeza em cada nota."},
 {title:"Presença intensa",description:"Profundidade e personalidade."},
 {title:"Toque vibrante",description:"Um universo de novas sensações."}
];

export function showcasePosition(index,active){
 return ["front","left","right"][(index-active+3)%3];
}

export function setupHeroShowcase({win=globalThis.window,doc=globalThis.document}={}){
 const frame=doc?.querySelector("[data-hero-showcase]");
 if(!frame||!win)return;
 const old=doc.querySelector("[data-hero-live]");
 if(new URLSearchParams(win.location.search).get("hero")==="photo"){
  frame.hidden=true;if(old)old.hidden=false;return;
 }
 const buttons=[...frame.querySelectorAll("[data-showcase-select]")];
 const bottles=[...frame.querySelectorAll("[data-showcase-bottle]")];
 const pause=frame.querySelector("[data-showcase-pause]");
 const preference=win.matchMedia("(prefers-reduced-motion: reduce)");
 const connection=win.navigator?.connection;
 const allowed=()=>!preference.matches&&!connection?.saveData&&doc.documentElement.dataset.motion!=="off";
 let active=0,visible=false,paused=false,hover=false,focused=false,timer;
 function select(index){
  active=(index+scenes.length)%scenes.length;
  frame.dataset.active=String(active);
  bottles.forEach((b,i)=>b.dataset.position=showcasePosition(i,active));
  buttons.forEach((b,i)=>b.setAttribute("aria-pressed",String(i===active)));
  frame.querySelector("[data-showcase-number]").textContent=String(active+1).padStart(2,"0")+" / 03";
  frame.querySelector("[data-showcase-title]").textContent=scenes[active].title;
  frame.querySelector("[data-showcase-description]").textContent=scenes[active].description;
 }
 function schedule(){
  clearInterval(timer);timer=undefined;
  const enabled=allowed()&&visible&&!doc.hidden&&!paused&&!hover&&!focused;
  frame.dataset.playing=String(enabled);
  if(pause){pause.hidden=!allowed();pause.setAttribute("aria-pressed",String(paused));pause.setAttribute("aria-label",paused?"Reproduzir animação dos perfumes":"Pausar animação dos perfumes");}
  if(enabled)timer=setInterval(()=>select(active+1),4700);
 }
 buttons.forEach((button,index)=>button.addEventListener("click",()=>{select(index);schedule();}));
 pause?.addEventListener("click",()=>{paused=!paused;schedule();});
 frame.addEventListener("mouseenter",()=>{hover=true;schedule();});
 frame.addEventListener("mouseleave",()=>{hover=false;schedule();});
 frame.addEventListener("focusin",()=>{focused=true;schedule();});
 frame.addEventListener("focusout",event=>{if(!frame.contains(event.relatedTarget)){focused=false;schedule();}});
 frame.addEventListener("keydown",event=>{
  if(event.key!=="ArrowLeft"&&event.key!=="ArrowRight")return;
  if(!buttons.includes(event.target))return;
  event.preventDefault();select(active+(event.key==="ArrowRight"?1:-1));buttons[active]?.focus();schedule();
 });
 // Mouse movement uses a separate wrapper, never the bottle position transforms.
 frame.addEventListener("pointermove",event=>{
  if(event.pointerType!=="mouse"||!allowed())return;
  const box=frame.getBoundingClientRect();
  frame.style.setProperty("--showcase-x",((event.clientX-box.left)/box.width-.5)*14+"px");
  frame.style.setProperty("--showcase-y",((event.clientY-box.top)/box.height-.5)*10+"px");
 });
 frame.addEventListener("pointerleave",()=>{frame.style.removeProperty("--showcase-x");frame.style.removeProperty("--showcase-y");});
 if("IntersectionObserver" in win)new win.IntersectionObserver(entries=>{visible=entries.some(entry=>entry.isIntersecting);schedule();},{threshold:.2}).observe(frame);
 else{visible=true;schedule();}
 doc.addEventListener("visibilitychange",schedule);
 preference.addEventListener?.("change",schedule);
 connection?.addEventListener?.("change",schedule);
 win.addEventListener("pagehide",()=>{clearInterval(timer);frame.dataset.playing="false";});
 win.addEventListener("pageshow",schedule);
 schedule();
}
if(typeof document!=="undefined")setupHeroShowcase();
