/** Versioned pagination across server-side catalog filters.
 * Late responses for superseded filters are discarded, never mixed into new pages.
 */
export function createCatalogSearch(fetchPage) {
 if(typeof fetchPage!=="function")throw new TypeError("Uma função de busca é obrigatória.");
 let version=0,page=0,hasNext=true,items=[],source=null,filters={q:"",categoryId:null,sort:"recent",maxPrice:null},pending=null;
 const snapshot=(stale=false)=>({version,page,hasNext,items:[...items],source,stale});
 const unique=(previous,additional)=>{
  const ids=new Set(previous.map(p=>Number(p.id)));
  return additional.filter(p=>{
   const id=Number(p?.id);
   if(!Number.isSafeInteger(id)||id<1||ids.has(id))return false;
   ids.add(id);return true;
  });
 };
 const validate=result=>{
  if(!result||!Array.isArray(result.items)||typeof result.hasNext!=="boolean")
   throw new TypeError("Página inválida retornada pela API.");
  const kind=result.source??"live";
  if(!["live","snapshot"].includes(kind))throw new TypeError("Origem de catálogo inválida.");
  return kind;
 };
 return {
  get state(){return snapshot();},
  setFilters(next={}){
   const q=String(next.q??"").trim(),raw=next.categoryId;
   const id=raw===null||raw===undefined||raw===""?null:Number(raw);
   if(id!==null&&(!Number.isSafeInteger(id)||id<1))throw new TypeError("Categoria inválida.");
   const sort=String(next.sort??"recent");
   if(!["recent","name","price-asc","price-desc"].includes(sort))throw new TypeError("Ordenação inválida.");
   const rawPrice=next.maxPrice;
   const maxPrice=rawPrice===null||rawPrice===undefined||rawPrice===""?null:Number(rawPrice);
   if(maxPrice!==null&&(!Number.isFinite(maxPrice)||maxPrice<0))
    throw new TypeError("Preço máximo inválido.");
   pending?.controller?.abort();
   filters={q,categoryId:id,sort,maxPrice};
   items=[];page=0;hasNext=true;source=null;version++;
   return version;
  },
  async next(){
   if(pending?.version===version)return pending.promise;
   if(!hasNext)return snapshot();
   const requestedVersion=version,requestedPage=page,requestedFilters={...filters};
   const controller=new AbortController();
   const request=(async()=>{
    try{
     const result=await fetchPage(requestedPage,requestedFilters,controller.signal,{source,refresh:false});
     if(requestedVersion!==version)return snapshot(true);
     const resultSource=validate(result);
     if(requestedPage>0&&source!==resultSource)
      throw new TypeError("A origem do catálogo mudou; atualize a primeira página.");
     const fresh=unique(items,result.items);
     source=resultSource;
     items=[...items,...fresh];page++;hasNext=result.hasNext;
     return snapshot();
    }catch(error){
     if(requestedVersion!==version)return snapshot(true);
     throw error;
    }
   })();
   pending={version:requestedVersion,promise:request,controller};
   try{return await request;}
   finally{if(pending?.promise===request)pending=null;}
  },
  /** Revalidate already loaded pages as a unit, preserving the old view on failure. */
  async refreshLoaded(){
   if(pending?.version===version||!page)return snapshot(true);
   const requestedVersion=version,requestedFilters={...filters},requestedPages=page;
   const controller=new AbortController();
   const request=(async()=>{
    let fresh=[],freshPages=0,freshHasNext=true;
    try{
     while(freshPages<requestedPages&&freshHasNext){
      const result=await fetchPage(freshPages,requestedFilters,controller.signal,{source,refresh:true});
      if(requestedVersion!==version)return snapshot(true);
      if(validate(result)!=="live")throw new Error("Dados atuais indisponíveis.");
      fresh=[...fresh,...unique(fresh,result.items)];
      freshPages++;freshHasNext=result.hasNext;
     }
     items=fresh;page=freshPages;hasNext=freshHasNext;source="live";
     return snapshot();
    }catch(error){
     if(requestedVersion!==version)return snapshot(true);
     throw error;
    }
   })();
   pending={version:requestedVersion,promise:request,controller};
   try{return await request;}
   finally{if(pending?.promise===request)pending=null;}
  }
 };
}
