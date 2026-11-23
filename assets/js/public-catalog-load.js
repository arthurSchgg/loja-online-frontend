/** Retry only the first, unfiltered public catalog page when the free-tier API
 * is briefly waking up. Search/filter requests stay responsive and do not
 * generate a burst of outdated retries.
 */
export function isUnfilteredFirstPage(page, filters={}){
 return page===0&&!String(filters?.q??"").trim()
  &&(filters?.categoryId===null||filters?.categoryId===undefined||filters?.categoryId==="")
  &&(filters?.maxPrice===null||filters?.maxPrice===undefined||filters?.maxPrice==="");
}
export function transientCatalogError(error){
 const status=Number(error?.status??0);
 return status===0||[500,502,503,504].includes(status);
}
export async function loadCatalogPage(fetchPage,page=0,filters={},sleep=delay=>new Promise(resolve=>setTimeout(resolve,delay))){
 if(typeof fetchPage!=="function")throw new TypeError("Carregamento do catálogo inválido.");
 const delays=isUnfilteredFirstPage(page,filters)?[1400,3300,6500]:[];
 for(let attempt=0;;attempt++){
  try{return await fetchPage(page,filters);}
  catch(error){
   if(attempt>=delays.length||!transientCatalogError(error))throw error;
   await sleep(delays[attempt]);
  }
 }
}
