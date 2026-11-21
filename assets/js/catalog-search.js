/** Versioned pagination across server-side catalog filters.
 * Late responses for superseded filters are discarded, never mixed into new pages.
 */
export function createCatalogSearch(fetchPage) {
 if(typeof fetchPage!=="function")throw new TypeError("Uma função de busca é obrigatória.");
 let version=0,page=0,hasNext=true,items=[],filters={q:"",categoryId:null,sort:"recent",maxPrice:null},pending=null;
 const snapshot=(stale=false)=>({version,page,hasNext,items:[...items],stale});
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
   items=[];page=0;hasNext=true;version++;
   return version;
  },
  async next(){
   if(pending?.version===version)return pending.promise;
   if(!hasNext)return snapshot();
   const requestedVersion=version,requestedPage=page,requestedFilters={...filters};
   const controller=new AbortController();
   const request=(async()=>{
    try{
     const result=await fetchPage(requestedPage,requestedFilters,controller.signal);
     if(requestedVersion!==version)return snapshot(true);
     if(!result||!Array.isArray(result.items)||typeof result.hasNext!=="boolean")
      throw new TypeError("Página inválida retornada pela API.");
     const ids=new Set(items.map(p=>Number(p.id)));
     const fresh=result.items.filter(p=>{
      const id=Number(p?.id);
      if(!Number.isSafeInteger(id)||id<1||ids.has(id))return false;
      ids.add(id);return true;
     });
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
  }
 };
}
