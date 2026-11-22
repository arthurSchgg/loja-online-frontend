import {action} from "./photo-editor.js";
const el=(tag,text="",cls="")=>{const n=document.createElement(tag);n.textContent=text;if(cls)n.className=cls;return n;};
const option=(value,label)=>new Option(label,String(value));
const idOf=x=>Number.isSafeInteger(Number(x))&&Number(x)>0;
function backingField(name,value){
 const text=document.createElement("textarea");text.name=name;text.hidden=true;text.value=String(value??"");return text;
}
export function createLookupField({name,label,multiple,value,initial=[],load,onChange,onError}){
 const root=el("fieldset","","field wide owner-lookup"),backing=backingField(name,value);
 root.append(el("legend",label),backing);
 let entries=initial.filter(x=>idOf(x.id)),loaded=false;
 const content=el("div","","lookup-content"),notice=el("p","Carregando "+label.toLowerCase()+"...","admin-note");
 const search=document.createElement("input");search.type="search";search.placeholder="Buscar categoria";search.setAttribute("aria-label","Buscar categoria");search.hidden=!multiple;
 const ids=()=>new Set(backing.value.split(",").filter(idOf).map(Number));
 const set=array=>{backing.value=array.join(",");backing.dispatchEvent(new Event("input",{bubbles:true}));};
 function render(){
  const chosen=ids();content.replaceChildren();
  if(multiple){
   const query=search.value.trim().toLocaleLowerCase("pt-BR");
   for(const item of entries){
    if(query&&!String(item.name).toLocaleLowerCase("pt-BR").includes(query))continue;
    if(item.active===false&&!chosen.has(Number(item.id)))continue;
    const row=el("label","","lookup-option"),box=document.createElement("input");box.type="checkbox";box.checked=chosen.has(Number(item.id));
    box.addEventListener("change",()=>{const selected=ids();if(box.checked)selected.add(Number(item.id));else selected.delete(Number(item.id));set([...selected]);});
    row.append(box,document.createTextNode(item.name+(item.active===false?" (inativa — retire)":"")));content.append(row);
   }
   for(const id of chosen)if(!entries.some(item=>Number(item.id)===id)&&loaded)
    content.append(action("Retirar categoria não disponível",()=>set([...ids()].filter(x=>x!==id)),"btn btn--ghost"));
   notice.textContent=loaded?(chosen.size+" categoria(s) selecionada(s)."):"Carregando categorias...";
  }else{
   const select=document.createElement("select");select.setAttribute("aria-label","Marca");select.append(option("","Escolha uma marca"));
   for(const item of entries){
    if(item.active===false&&!chosen.has(Number(item.id)))continue;
    const op=option(item.id,item.name+(item.active===false?" (inativa — escolha outra)":""));op.disabled=item.active===false;select.append(op);
   }
   const selected=[...chosen][0];if(selected&&!entries.some(x=>Number(x.id)===selected))select.append(option(selected,"Marca atual (carregando ou indisponível)"));
   select.value=selected?String(selected):"";
   select.addEventListener("change",()=>set(select.value?[Number(select.value)]:[]));content.append(select);
   notice.textContent=loaded?"Escolha pelo nome. Para adicionar outra, use o módulo Marcas.":"Carregando marcas...";
  }
 }
 backing.addEventListener("input",()=>{render();onChange?.();});search.addEventListener("input",render);
 root.append(search,content,notice);render();
 Promise.resolve().then(load).then(data=>{
  if(!root.isConnected)return;
  entries=Array.isArray(data)?data.filter(x=>idOf(x.id)):[];
  loaded=true;render();
 }).catch(error=>{
  if(!root.isConnected)return;
  notice.textContent="Não foi possível carregar a lista. Atualize o painel e tente novamente.";onError?.(error);
 });
 return root;
}
const destinations=[
 ["","Sem link"],["/catalogo.html","Explore os produtos"],["/conheca-a-loja.html","Conheça a loja"],
 ["/viva-sua-experiencia.html","Experiências"],["/espaco-das-velas.html","Espaço das velas"],["/contato.html","Contato"],
 ["category","Categoria específica"],["product","Produto específico"]
];
export function createDestinationField({name,value,api,onChange,onError}){
 const root=el("fieldset","","field wide owner-lookup"),backing=backingField(name,value),page=document.createElement("select");
 page.setAttribute("aria-label","Destino do banner");
 for(const [v,title] of destinations)page.append(option(v,title));
 const controls=el("div","","destination-controls"),note=el("p","","admin-note");
 root.append(el("legend","Destino do banner"),backing,page,controls,note);
 let revision=0;
 const typeOf=raw=>raw.startsWith("/produto.html?productId=")?"product":raw.startsWith("/catalogo.html?categoryId=")?"category":destinations.some(([v])=>v===raw)?raw:"legacy";
 const set=raw=>{backing.value=raw;onChange?.();};
 async function render(raw=backing.value){
  const kind=typeOf(raw),ticket=++revision;
  page.querySelector('option[value="legacy"]')?.remove();
  if(kind==="legacy")page.append(option("legacy","Destino anterior — escolha uma página da loja"));
  page.value=kind;controls.replaceChildren();note.textContent="";
  if(kind!=="product"&&kind!=="category")return;
  const search=document.createElement("input");search.type="search";search.placeholder="Buscar produto";search.maxLength=180;search.setAttribute("aria-label","Buscar produto para banner");
  const select=document.createElement("select");select.setAttribute("aria-label",kind==="product"?"Produto do banner":"Categoria do banner");
  const current=raw.includes("=")?raw.split("=")[1]:"";
  const path=kind==="product"?"/produto.html?productId=":"/catalogo.html?categoryId=";
  const refresh=async()=>{
   const params=new URLSearchParams({page:"0",size:"50",published:"true"});if(search.value.trim())params.set("q",search.value.trim());
   let rows=kind==="product"?(await api.get("/admin/products?"+params)).content:await api.get("/admin/categories");
   if(kind==="product"&&idOf(current)&&!rows.some(x=>String(x.id)===current)){
    try{const item=await api.get("/admin/products/"+current);if(item?.published)rows=[item,...rows];}catch{}
   }
   if(!root.isConnected||ticket!==revision)return;
   select.replaceChildren(option("","Selecione pelo nome"));
   for(const record of rows||[]){
    if(record.active===false||record.published===false)continue;
    select.append(option(record.id,record.name));
   }
   const selected=backing.value.startsWith(path)?backing.value.slice(path.length):"";
   select.value=selected;
   note.textContent=kind==="product"?"Selecione um produto publicado. Use a busca para encontrar outros.":"Selecione a categoria.";
  };
  if(kind==="product")controls.append(search,action("Buscar",()=>void refresh().catch(onError)));
  controls.append(select);
  select.addEventListener("change",()=>set(select.value?path+select.value:""));
  try{await refresh();}catch(error){if(root.isConnected&&ticket===revision)onError?.(error);}
 }
 page.addEventListener("change",()=>{
  const kind=page.value;
  if(kind==="product"||kind==="category"){
   set("");void render((kind==="product"?"/produto.html?productId=":"/catalogo.html?categoryId="));
  }else{set(kind==="legacy"?"":kind);void render();}
 });
 backing.addEventListener("input",()=>void render());
 queueMicrotask(()=>void render());return root;
}
