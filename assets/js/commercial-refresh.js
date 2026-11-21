/** Refresh commercial data on return to the page, never by background polling. */
export function setupCommercialRefresh(refresh,{win=globalThis.window,doc=globalThis.document,
 minimumAwayMs=30000,now=Date.now}={}){
 if(!win||!doc||typeof refresh!=="function")return ()=>{};
 let hiddenAt=doc.hidden?now():null,pending=false,disposed=false;
 const run=async()=>{
  if(disposed||pending||doc.hidden)return;
  pending=true;
  try{await refresh();}catch{/* Each screen retains its own recoverable error state. */}
  finally{pending=false;}
 };
 const visibility=()=>{
  if(doc.hidden){hiddenAt=now();return;}
  const away=hiddenAt===null?0:now()-hiddenAt;
  hiddenAt=null;
  if(away>=minimumAwayMs)void run();
 };
 const pageHide=()=>{hiddenAt=now();};
 const pageShow=event=>{
  if(event.persisted){hiddenAt=null;void run();}
 };
 doc.addEventListener("visibilitychange",visibility);
 win.addEventListener("pagehide",pageHide);
 win.addEventListener("pageshow",pageShow);
 return ()=>{
  disposed=true;
  doc.removeEventListener("visibilitychange",visibility);
  win.removeEventListener("pagehide",pageHide);
  win.removeEventListener("pageshow",pageShow);
 };
}
