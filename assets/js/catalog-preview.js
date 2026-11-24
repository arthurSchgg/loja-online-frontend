/** Bounded cache of previously public catalog metadata. Never cache commercial
 * values, credentials, stock or availability. A preview cannot authorize a sale.
 */
export const PREVIEW_TTL=10*60*1000;
const storagePrefix="katia-public-preview-v2:";
const numericId=value=>Number.isSafeInteger(Number(value))&&Number(value)>0?Number(value):null;
const bounded=(value,max)=>typeof value==="string"?value.slice(0,max):"";
function lookup(value){
 const id=numericId(value?.id);
 return id?{id,name:bounded(value.name,180)}:null;
}
function image(item){
 const url=bounded(item?.url,2048);
 if(!url)return null;
 try{
  const parsed=new URL(url,"https://preview.invalid/");
  if(parsed.protocol!=="https:"||parsed.username||parsed.password)return null;
 }catch{return null;}
 return {url,position:Number.isSafeInteger(Number(item?.position))?Number(item.position):0,altText:bounded(item?.altText,180)};
}
export function previewItems(items){
 if(!Array.isArray(items))return [];
 return items.slice(0,50).flatMap(item=>{
  const id=numericId(item?.id);
  if(!id||item.published!==true||typeof item.name!=="string")return [];
  return [{id,name:bounded(item.name,180),description:bounded(item.description,4000),
   brand:lookup(item.brand),categories:(Array.isArray(item.categories)?item.categories:[]).slice(0,50).map(lookup).filter(Boolean),
   images:(Array.isArray(item.images)?item.images:[]).slice(0,12).map(image).filter(Boolean),offlineSnapshot:true}];
 });
}
export function makePreview(items,hasNext,now=Date.now()){
 return {items:previewItems(items),hasNext:hasNext===true,savedAt:now};
}
export function validPreview(value,now=Date.now()){
 if(!value||!Array.isArray(value.items)||typeof value.hasNext!=="boolean"||
    !Number.isFinite(value.savedAt)||value.savedAt>now||now-value.savedAt>PREVIEW_TTL)return null;
 // Reapply the allowlist even for browser/edge data; no commercial data survives.
 const items=previewItems(value.items.map(item=>({...item,published:true})));
 return {items,hasNext:value.hasNext,offlineSnapshot:true,savedAt:value.savedAt};
}
function storage(){
 try{return globalThis.localStorage;}catch{return null;}
}
export function readPreview(kind,now=Date.now(),store=storage()){
 try{return validPreview(JSON.parse(store?.getItem(storagePrefix+kind)||"null"),now);}catch{return null;}
}
export function rememberPreview(kind,items,hasNext,now=Date.now(),store=storage()){
 const record=makePreview(items,hasNext,now);
 try{store?.setItem(storagePrefix+kind,JSON.stringify(record));}catch{/* Storage unavailable/full. */}
 return validPreview(record,now);
}
/** Only retry while a visitor is viewing an unresolved catalog; never keep the
 * free hosting awake in a hidden tab or after reaching the retry budget. */
export function foregroundRecovery(work,{delays=[12000,20000,30000,40000,50000],
 visible=()=>!globalThis.document?.hidden,set=setTimeout,clear=clearTimeout}={}){
 let timer=null,attempt=0,enabled=false,revision=0;
 function schedule(){
  if(!enabled||timer!==null||attempt>=delays.length||!visible())return;
  const ticket=revision;
  timer=set(async()=>{
   timer=null;if(!enabled||ticket!==revision||!visible())return;
   attempt++;
   try{await work();}catch{/* Keep bounded retrying displayed recovery state. */}
   finally{if(ticket===revision)schedule();}
  },delays[attempt]);
 }
 return {
  start(){if(!enabled){enabled=true;attempt=0;revision++;}schedule();},
  resume(){schedule();},
  stop(){enabled=false;revision++;if(timer!==null)clear(timer);timer=null;}
 };
}
