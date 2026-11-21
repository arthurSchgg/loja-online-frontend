/** Progressive Live Photo for the home hero.
 * - Keep the crisp local WebP poster as the LCP image.
 * - Load a muted local clip only when in view and motion is allowed.
 * - Once a frame is rendered, pausing freezes that frame instead of
 *   flickering back to an unrelated poster/camera position.
 * - Fall back cleanly to the static poster on a blocked or failed video.
 */
export function heroMotionAllowed({reducedMotion=false,saveData=false,connectionType="",motionOff=false}={}){
 return !reducedMotion&&!saveData&&!motionOff&&!["slow-2g","2g"].includes(connectionType);
}

export function setupHeroLivePhoto({win=globalThis.window,doc=globalThis.document}={}){
 if(!win||!doc)return ()=>{};
 const frame=doc.querySelector("[data-hero-live]");
 const video=frame?.querySelector("[data-hero-video]");
 const control=frame?.querySelector("[data-hero-toggle]");
 const poster=frame?.querySelector("[data-hero-bottle]");
 if(!frame||!video||!control)return ()=>{};

 const preference=win.matchMedia?.("(prefers-reduced-motion: reduce)");
 const connection=win.navigator?.connection;
 let inView=false;
 let hasPlayed=false;
 let userPaused=false;
 let videoFailed=false;
 let playPending=false;
 let disposed=false;
 let posterReady=!poster;
 let autoplayBlocked=false;

 const permitted=()=>heroMotionAllowed({
  reducedMotion:preference?.matches===true,
  saveData:connection?.saveData===true,
  connectionType:connection?.effectiveType||"",
  motionOff:doc.documentElement?.dataset?.motion==="off"
 });
 const canPlay=()=>!disposed&&!videoFailed&&!autoplayBlocked&&posterReady&&permitted()&&inView&&!doc.hidden;
 const pause=()=>{if(!video.paused)video.pause();};
 function render(){
  if(disposed)return;
  // Display the last decoded frame when paused, instead of jumping to poster.
  // If the user disables motion or data use, show the poster instead.
  const ready=hasPlayed&&!videoFailed&&permitted();
  frame.dataset.liveReady=String(ready);
  frame.dataset.liveActive=String(ready&&inView&&!doc.hidden&&!userPaused&&!video.paused);
  control.hidden=!ready||!inView||doc.hidden;
  control.setAttribute("aria-pressed",String(userPaused));
  control.setAttribute("aria-label",userPaused?"Reproduzir animação da fotografia":"Pausar animação da fotografia");
 }
 function sync(){
  if(disposed)return;
  if(!canPlay()||userPaused){
   pause();
   render();
   return;
  }
  if(!video.src){
   const source=video.dataset.src;
   // Never let the DOM or an API response provide an arbitrary media URL.
   if(!/^assets\/images\/brand\/hero-live-motion\.mp4$/.test(source||""))return;
   video.src=source;
   video.load();
  }
  // Avoid repeat play() calls during intersection/visibility changes.
  if(video.paused&&!playPending){
   playPending=true;
   try{
    const pending=video.play();
    Promise.resolve(pending).catch(error=>{
     // Autoplay might be denied: continue showing the poster, with no loop.
     if(error?.name!=="AbortError"&&canPlay())autoplayBlocked=true;
    }).finally(()=>{
     playPending=false;
     if(!disposed)render();
    });
   }catch{
    playPending=false;
    autoplayBlocked=true;
   }
  }
  render();
 }
 const onPlaying=()=>{
  if(!canPlay()||userPaused){pause();return;}
  hasPlayed=true;
  render();
 };
 const onPause=()=>render();
 const onError=()=>{
  videoFailed=true;
  hasPlayed=false;
  pause();
  render();
 };
 const onToggle=()=>{
  if(videoFailed||!hasPlayed)return;
  userPaused=!userPaused;
  sync();
 };
 const onPageHide=()=>{pause();render();};
 // The local poster is the priority image. Start video only after it has
 // loaded/decoded and the browser has had a chance to display it.
 const onPosterLoad=()=>{
  const ready=()=>{
   if(disposed)return;
   const proceed=()=>{if(!disposed){posterReady=true;sync();}};
   if(typeof win.requestIdleCallback==="function")win.requestIdleCallback(proceed,{timeout:600});
   else if(typeof win.requestAnimationFrame==="function")win.requestAnimationFrame(proceed);
   else proceed();
  };
  if(typeof poster?.decode==="function")poster.decode().then(ready,ready);
  else ready();
 };
 poster?.addEventListener("load",onPosterLoad,{once:true});
 if(poster?.complete&&poster.naturalWidth>0)onPosterLoad();

 video.addEventListener("playing",onPlaying);
 video.addEventListener("pause",onPause);
 video.addEventListener("error",onError);
 control.addEventListener("click",onToggle);
 doc.addEventListener("visibilitychange",sync);
 win.addEventListener("pageshow",sync);
 win.addEventListener("pagehide",onPageHide);
 preference?.addEventListener?.("change",sync);
 connection?.addEventListener?.("change",sync);

 // Motion settings can change without a media-query or network event.
 const motionObserver=typeof win.MutationObserver==="function"
  ?new win.MutationObserver(sync):null;
 if(motionObserver&&doc.documentElement)
  motionObserver.observe(doc.documentElement,{attributes:true,attributeFilter:["data-motion"]});

 const observer=typeof win.IntersectionObserver==="function"
  ?new win.IntersectionObserver(entries=>{
    inView=entries.some(entry=>entry.target===frame&&entry.isIntersecting);
    sync();
   },{threshold:0.16})
  :null;
 if(observer)observer.observe(frame);
 else{inView=true;sync();}
 render();

 return ()=>{
  disposed=true;
  pause();
  observer?.disconnect();
  motionObserver?.disconnect();
  frame.dataset.liveReady="false";
  frame.dataset.liveActive="false";
  control.hidden=true;
  video.removeEventListener("playing",onPlaying);
  video.removeEventListener("pause",onPause);
  video.removeEventListener("error",onError);
  control.removeEventListener("click",onToggle);
  poster?.removeEventListener("load",onPosterLoad);
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
