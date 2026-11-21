/** Public catalog recovery:
 * - Only initial unfiltered load receives bounded retries.
 * - When the visitor changes filters, abort pending requests AND retry timers.
 * - Never replace a live failure with fictitious catalog results.
 */
export function isUnfilteredFirstPage(page,filters={}){
 return page===0&&!String(filters?.q??"").trim()
  &&(!filters?.sort||filters.sort==="recent")
  &&(filters?.brandId===null||filters?.brandId===undefined||filters?.brandId==="")
  &&(filters?.categoryId===null||filters?.categoryId===undefined||filters?.categoryId==="")
  &&(filters?.maxPrice===null||filters?.maxPrice===undefined||filters?.maxPrice==="");
}
export function transientCatalogError(error){
 const status=Number(error?.status??0);
 return status===0||[500,502,503,504].includes(status);
}
function canceled(){
 const error=new Error("Consulta substituída por novos filtros.");
 error.name="AbortError";
 return error;
}
export function abortableCatalogDelay(milliseconds,signal){
 return new Promise((resolve,reject)=>{
  if(signal?.aborted){reject(canceled());return;}
  const done=()=>{
   signal?.removeEventListener("abort",stop);
   resolve();
  };
  const timer=setTimeout(done,milliseconds);
  function stop(){
   clearTimeout(timer);
   signal?.removeEventListener("abort",stop);
   reject(canceled());
  }
  signal?.addEventListener("abort",stop,{once:true});
 });
}
export async function loadCatalogPage(fetchPage,page=0,filters={},sleep=abortableCatalogDelay,signal){
 if(typeof fetchPage!=="function")throw new TypeError("Carregamento do catálogo inválido.");
 // Retry quick transient failures for the initial page, but don't make visitors
 // wait through repeated 18-second upstream deadlines before using the preview.
 const delays=isUnfilteredFirstPage(page,filters)?[700,1600]:[];
 const startedAt=Date.now();
 for(let attempt=0;;attempt++){
  if(signal?.aborted)throw canceled();
  try{
   return await fetchPage(page,filters,signal);
  }catch(error){
   if(signal?.aborted||error?.name==="AbortError")throw error;
   if(attempt>=delays.length||!transientCatalogError(error)||
      Number(error?.status)===504||Date.now()-startedAt+delays[attempt]>4000)throw error;
   await sleep(delays[attempt],signal);
  }
 }
}
