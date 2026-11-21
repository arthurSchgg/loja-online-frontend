/** Progressive catalog filter chips.
 * All user-visible content is inserted with textContent, never as HTML.
 * The API remains authoritative for product search, pricing and availability.
 */
export function activeCatalogFilters({q="",categoryId="",categoryName="",maxPrice="",maxPriceLabel=""}={}){
 const result=[];
 const query=String(q??"").trim().slice(0,90);
 if(query)result.push({key:"query",label:"Busca: "+query});
 if(String(categoryId??"").trim()){
  result.push({key:"family",label:"Categoria: "+String(categoryName||"selecionada").slice(0,80)});
 }
 if(maxPrice!==""&&maxPrice!==null&&maxPrice!==undefined){
  result.push({key:"max",label:"Até "+String(maxPriceLabel||"R$ "+maxPrice).slice(0,40)});
 }
 return result;
}
export function setupCatalogToolbar({form,count,onChange,doc=globalThis.document,win=globalThis.window}={}){
 if(!doc||!form||!count||typeof onChange!=="function")return {render(){},destroy(){}};
 const toolbar=doc.createElement("div");
 toolbar.className="catalog-toolbar";
 count.before(toolbar);
 toolbar.append(count);
 const chips=doc.createElement("div");
 chips.className="catalog-active-filters";
 chips.setAttribute("role","group");
 chips.setAttribute("aria-label","Filtros ativos");
 toolbar.after(chips);

 const updateAddress=()=>{
  if(!win?.history?.replaceState||!win?.location)return;
  try{
   const url=new URL(win.location.href);
   url.searchParams.delete("q");url.searchParams.delete("familia");
   win.history.replaceState(win.history.state,"",url.pathname+url.search+url.hash);
  }catch{ /* UI still clears even if URL history is unavailable. */ }
 };
 const reset=key=>{
  if(key==="query")form.elements.query.value="";
  if(key==="family")form.elements.family.value="";
  if(key==="max")form.elements.max.value="";
  if(key==="all"){
   form.elements.query.value="";
   form.elements.family.value="";
   form.elements.max.value="";
   if(form.elements.sort)form.elements.sort.value="recent";
  }
  updateAddress();
  onChange();
 };
 const makeButton=(label,key,clearAll=false)=>{
  const button=doc.createElement("button");
  button.type="button";
  button.className=clearAll?"catalog-clear":"catalog-chip";
  button.textContent=label;
  button.setAttribute("aria-label",clearAll?"Limpar todos os filtros":"Remover filtro "+label);
  button.addEventListener("click",()=>reset(key));
  return button;
 };
 const render=()=>{
  chips.replaceChildren();
  const category=form.elements.family;
  const active=activeCatalogFilters({
   q:form.elements.query?.value,
   categoryId:category?.closest(".field")?.hidden?"":category?.value,
   categoryName:category?.selectedOptions?.[0]?.textContent||"",
   maxPrice:form.elements.max?.value,
   maxPriceLabel:form.elements.max?.selectedOptions?.[0]?.textContent
  });
  for(const filter of active)chips.append(makeButton(filter.label,filter.key));
  if(active.length>1)chips.append(makeButton("Limpar tudo","all",true));
  chips.hidden=!active.length;
 };
 render();
 return {render,destroy(){toolbar.replaceWith(count);chips.remove();}};
}
