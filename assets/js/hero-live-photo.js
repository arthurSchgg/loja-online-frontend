/** Cinematic home photo: optional muted loop over an eager, local image poster.
 * Never fetch motion media with reduced motion, Save-Data, or slow connections.
 * Pause video outside the viewport/hidden tab; keep native pause control.
 */
export function heroMotionAllowed({reducedMotion=false,saveData=false,connectionType="",motionOff=false}={}){
 return !reducedMotion&&!saveData&&!motionOff&&!["slow-2g","2g"].includes(connectionType);
}
export function setupHeroLivePhoto({win=globalThis.window,doc=globalThis.document}={}){
 if(!win||!doc)return ()=>{};
 const frame=doc.querySelector("[data-hero-live]");
 const video=frame?.querySelector("[data-hero-video]");
 const control=frame?.querySelector("[data-hero-toggle]");
 if(!frame||!video||!control)return ()=>{};
 const preference=win.matchMedia?.("(prefers-reduced-motion: reduce)");
 const connection=win.navigator?.connection;
 let inView=false,hasPlayed=false,userPaused=false,disposed=false;
 const permitted=()=>heroMotionAllowed({
  reducedMotion:preference?.matches===true,
  saveData:connection?.saveData===true,
  connectionType:connection?.effectiveType||"",
  motionOff:doc.documentElement?.dataset?.motion==="off"
 });
 const canDisplay=()=>permitted()&&inView&&!doc.hidden;
 function updateControl(){
  const active=canDisplay()&&!userPaused&&!video.paused;
  frame.dataset.liveActive=active?"true":"false";
  control.hidden=!hasPlayed||!canDisplay();
  control.setAttribute("aria-pressed",String(userPaused));
  control.setAttribute("aria-label",userPaused?"Reproduzir animação da fotografia":"Pausar animação da fotografia");
 }
 function sync(){
  if(disposed)return;
  if(!canDisplay()||userPaused){
   video.pause();
   updateControl();
   return;
  }
  if(!video.src){
   const source=video.dataset.src;
   if(!/^assets\/images\/brand\/hero-live-motion\.mp4$/.test(source||""))return;
   video.src=source;
   video.load();
  }
  try{
   const pending=video.play();
   pending?.catch?.(()=>{if(!disposed)updateControl();});
  }catch{
   // A blocked autoplay simply leaves the high-quality image poster visible.
  }
  updateControl();
 }
 const onPlaying=()=>{
  if(!canDisplay()||userPaused){video.pause();return;}
  hasPlayed=true;updateControl();
 };
 const onPause=()=>updateControl();
 const onToggle=()=>{userPaused=!userPaused;sync();};
 const onPageHide=()=>{video.pause();updateControl();};
 video.addEventListener("playing",onPlaying);
 video.addEventListener("pause",onPause);
 control.addEventListener("click",onToggle);
 doc.addEventListener("visibilitychange",sync);
 win.addEventListener("pageshow",sync);
 win.addEventListener("pagehide",onPageHide);
 preference?.addEventListener?.("change",sync);
 connection?.addEventListener?.("change",sync);
 const observer=typeof win.IntersectionObserver==="function"
  ?new win.IntersectionObserver(entries=>{
    inView=entries.some(entry=>entry.target===frame&&entry.isIntersecting);
    sync();
   },{threshold:0.08})
  :null;
 if(observer)observer.observe(frame);
 else{inView=true;sync();}
 return ()=>{
  disposed=true;video.pause();observer?.disconnect();
  video.removeEventListener("playing",onPlaying);
  video.removeEventListener("pause",onPause);
  control.removeEventListener("click",onToggle);
  doc.removeEventListener("visibilitychange",sync);
  win.removeEventListener("pageshow",sync);
  win.removeEventListener("pagehide",onPageHide);
  preference?.removeEventListener?.("change",sync);
  connection?.removeEventListener?.("change",sync);
 };
}
if(typeof window!=="undefined"&&typeof document!=="undefined"){
 setupHeroLivePhoto();
}
