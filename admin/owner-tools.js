import {action,previewImage,uploadPhoto} from "./photo-editor.js";
const el=(tag,text="",className="")=>{const n=document.createElement(tag);n.textContent=text;if(className)n.className=className;return n;};
const money=bytes=>((Number(bytes)||0)/1048576).toLocaleString("pt-BR",{maximumFractionDigits:1})+" MB";
const safeProductId=id=>Number.isSafeInteger(Number(id))&&Number(id)>0;
export const ownerModules=new Set(["media","featured","templates"]);
export const templateLabels={PRODUCT:"Produtos",CANDLE:"Velas",WORKSHOP:"Oficinas",RENTAL:"Locações"};
export function validateTemplate(text,required){
 if(typeof text!=="string"||!text.trim()||text.length>1200)throw new Error("Escreva a mensagem, com até 1.200 caracteres.");
 const variables=Array.from(text.matchAll(/\{\{([a-z]+)\}\}/g),x=>x[1]);
 if(variables.some(v=>!required.includes(v))||!required.every(v=>variables.includes(v))||/[{}]/.test(text.replace(/\{\{[a-z]+\}\}/g,"")))
  throw new Error("Mantenha as variáveis obrigatórias e seus nomes exatamente como aparecem.");
 return text;
}
export function exampleMessage(text,kind){
 const value={nome:kind==="PRODUCT"?"Perfume de exemplo":kind==="CANDLE"?"Vela de exemplo":"Serviço de exemplo",
  preco:kind==="PRODUCT"?"R$ 99,90":"Valor sob consulta",personalizacao:" Personalização: Aroma: exemplo. Preço final a confirmar no WhatsApp."};
 return String(text).replace(/\{\{([a-z]+)\}\}/g,(_,key)=>value[key]??"");
}
export async function renderOwnerTool({module,container,api,active,info,changed,sessionExpired}){
 container.replaceChildren(el("p","Carregando...","muted"));
 const fail=error=>{if(active()){if(error.status===401)sessionExpired();else info(error.message,true);}};
 const safe=async work=>{try{await work();}catch(error){fail(error);}};
 if(module==="media"){
  const heading=el("h2","Biblioteca de fotos"),note=el("p","Envie imagens do celular ou computador. Fotos usadas em algum cadastro não podem ser excluídas daqui.","admin-note");
  const status=el("p","","admin-note"),grid=el("div","","owner-media-grid"),pager=el("div","","photo-tools"),progress=el("p","","photo-feedback");
  progress.setAttribute("role","status");
  const file=document.createElement("input");file.type="file";file.accept="image/*";file.multiple=true;file.hidden=true;
  const send=action("Enviar fotos",()=>file.click(),"btn btn--primary");
  let page=0,busy=false,revision=0;
  const load=async index=>{
   const request=++revision;const result=await api.get("/admin/media?page="+index+"&size=24");
   if(!active()||request!==revision)return;
   page=index;status.textContent="Armazenamento: "+money(result.usedBytes)+" de "+money(result.capacityBytes)+".";
   grid.replaceChildren();pager.replaceChildren();
   if(!result.content?.length)grid.append(el("p","Nenhuma foto nesta página."));
   for(const item of result.content||[]){
    const card=el("article","","owner-media-card"),img=previewImage(item.url);
    const meta=el("small",item.width+" × "+item.height+" · "+Math.ceil(item.byteLength/1024)+" KB");
    const badge=el("strong",item.used?"Em uso":"Sem vínculo");
    const remove=action("Excluir foto",()=>void safe(async()=>{
     if(!confirm("Excluir definitivamente esta foto sem vínculo?"))return;
     remove.disabled=true;
     try{await api.write("DELETE","/admin/media/"+item.id);if(active()){info("Foto excluída.");await load(page);}}
     finally{remove.disabled=false;}
    }),"btn btn--ghost");
    remove.disabled=!!item.used||busy;
    card.append(img,meta,badge,remove);grid.append(card);
   }
   if(page>0)pager.append(action("Anterior",()=>void safe(()=>load(page-1))));
   if(!result.last)pager.append(action("Próxima",()=>void safe(()=>load(page+1))));
  };
  file.addEventListener("change",()=>void safe(async()=>{
   const files=Array.from(file.files||[]);file.value="";
   if(!files.length||busy)return;
   if(files.length>24)throw new Error("Envie até 24 fotos por vez.");
   busy=true;send.disabled=true;changed(true);
   try{
    for(const [i,item] of files.entries()){
     if(!active())return;
     progress.textContent="Preparando e enviando "+(i+1)+" de "+files.length+"...";
     await uploadPhoto(api,item);
    }
    if(active()){progress.textContent="Fotos enviadas. Escolha-as ao editar seus cadastros.";await load(0);}
   }finally{busy=false;if(active()){send.disabled=false;changed(false);}}
  }));
  if(!active())return;
  container.replaceChildren(heading,note,send,file,progress,status,grid,pager);
  await safe(()=>load(0));return;
 }
 if(module==="featured"){
  await safe(async()=>{
   const initial=await api.get("/admin/storefront/featured");if(!active())return;
   let chosen=Array.isArray(initial.products)?initial.products.filter(p=>safeProductId(p.id)):[];
   const heading=el("h2","Destaques da página inicial"),note=el("p","Escolha até 8 produtos publicados e a ordem em que aparecem. A vitrine continua exibindo preços e estoque atualizados.","admin-note");
   const label=el("label","Usar seleção personalizada","owner-toggle"),toggle=document.createElement("input");toggle.type="checkbox";toggle.checked=!!initial.customized;label.prepend(toggle);
   const selected=el("div","","owner-selection"),search=document.createElement("input");search.type="search";search.placeholder="Buscar pelo nome do produto";search.maxLength=180;search.setAttribute("aria-label","Buscar produtos publicados");
   const results=el("div","","owner-selection"),pager=el("div","","photo-tools"),state=el("p","","admin-note");
   const save=action("Salvar destaques",()=>void safe(async()=>{
    if(!toggle.checked&&!confirm("Voltar aos produtos mais recentes na página inicial?"))return;
    if(toggle.checked&&chosen.some(p=>!p.published))throw new Error("Retire os produtos que não estão publicados.");
    save.disabled=true;
    try{
     const body={customized:toggle.checked,productIds:chosen.filter(p=>p.published).map(p=>Number(p.id))};
     await api.write("PUT","/admin/storefront/featured",body);
     if(active()){changed(false);info("Destaques salvos.");}
    }finally{save.disabled=false;}
   }),"btn btn--primary");
   function render(){
    selected.replaceChildren();state.textContent=toggle.checked?chosen.length+" de 8 produtos selecionados.":"Modo automático: produtos publicados mais recentes.";
    for(const [i,p] of chosen.entries()){
     const row=el("div","","owner-product-row");
     if(p.images?.[0]?.url)row.append(previewImage(p.images[0].url));
     row.append(el("strong",(i+1)+". "+p.name+(p.published?"":" · Não publicado")));
     if(i>0)row.append(action("Subir",()=>{[chosen[i-1],chosen[i]]=[chosen[i],chosen[i-1]];update();}));
     if(i<chosen.length-1)row.append(action("Descer",()=>{[chosen[i+1],chosen[i]]=[chosen[i],chosen[i+1]];update();}));
     row.append(action("Retirar",()=>{chosen=chosen.filter(x=>x.id!==p.id);update();},"btn btn--ghost"));
     selected.append(row);
    }
    for(const button of results.querySelectorAll("button[data-product]"))
     button.disabled=chosen.length>=8||chosen.some(x=>Number(x.id)===Number(button.dataset.product));
   }
   function update(){changed(true);render();}
   toggle.addEventListener("change",update);
   let request=0;
   async function find(page=0){
    const id=++request;
    const params=new URLSearchParams({page:String(page),size:"12",published:"true"});
    if(search.value.trim())params.set("q",search.value.trim());
    const data=await api.get("/admin/products?"+params);
    if(!active()||id!==request)return;
    results.replaceChildren();pager.replaceChildren();
    for(const p of data.content||[]){
     if(!p.published||!safeProductId(p.id))continue;
     const row=el("div","","owner-product-row");
     if(p.images?.[0]?.url)row.append(previewImage(p.images[0].url));
     row.append(el("span",p.name));
     const btn=action("Adicionar",()=>{if(chosen.length<8&&!chosen.some(x=>x.id===p.id)){chosen.push(p);toggle.checked=true;update();}});
     btn.dataset.product=String(p.id);row.append(btn);results.append(row);
    }
    if(!results.children.length)results.append(el("p","Nenhum produto publicado encontrado."));
    if(page>0)pager.append(action("Anterior",()=>void safe(()=>find(page-1))));
    if(!data.last)pager.append(action("Mais produtos",()=>void safe(()=>find(page+1))));
    render();
   }
   const lookup=el("form","","owner-search"),button=el("button","Buscar","btn btn--secondary");button.type="submit";
   lookup.append(search,button);lookup.addEventListener("submit",e=>{e.preventDefault();void safe(()=>find(0));});
   container.replaceChildren(heading,note,label,state,selected,save,el("h3","Adicionar produtos"),lookup,results,pager);
   render();await find();
  });return;
 }
 if(module==="templates"){
  await safe(async()=>{
   const entries=await api.get("/admin/whatsapp-templates");if(!active())return;
   container.replaceChildren(el("h2","Mensagens do WhatsApp"),el("p","Personalize a mensagem de cada tipo de atendimento. As variáveis serão preenchidas com os dados reais da loja; aqui a prévia é fictícia e nada é enviado.","admin-note"));
   const edits=new Set();
   for(const model of entries){
    if(!templateLabels[model.kind])continue;
    const card=el("section","","owner-template"),heading=el("h3",templateLabels[model.kind]);
    const area=document.createElement("textarea");area.rows=5;area.maxLength=1200;area.value=model.template;area.setAttribute("aria-label","Mensagem de "+templateLabels[model.kind]);
    const variables=model.requiredVariables||[],preview=el("p","","owner-message-preview");
    const refresh=()=>{preview.textContent=exampleMessage(area.value,model.kind);edits.add(model.kind);changed(true);};
    area.addEventListener("input",refresh);preview.textContent=exampleMessage(area.value,model.kind);
    const reset=action("Restaurar mensagem padrão",()=>{if(confirm("Substituir esta mensagem pelo modelo padrão? Salve para aplicar.")){area.value=model.defaultTemplate;refresh();}},"btn btn--ghost");
    const save=action("Salvar mensagem",()=>void safe(async()=>{
     const text=validateTemplate(area.value,variables);save.disabled=true;area.disabled=true;reset.disabled=true;
     try{await api.write("PUT","/admin/whatsapp-templates/"+model.kind,{template:text});if(active()){edits.delete(model.kind);changed(edits.size>0);info("Mensagem salva: "+templateLabels[model.kind]+".");}}
     finally{save.disabled=false;area.disabled=false;reset.disabled=false;}
    }),"btn btn--primary");
    card.append(heading,el("p","Variáveis obrigatórias: "+variables.map(x=>"{{"+x+"}}").join(", "),"admin-note"),area,el("strong","Prévia com dados de exemplo"),preview,save,reset);
    container.append(card);
   }
  });
 }
}
