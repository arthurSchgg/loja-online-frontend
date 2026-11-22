import {AdminApi,AdminApiError,adminOriginAllowed} from "./api.js";
import {setupSecurityPanel} from "./security.js";
import {validateProductImages} from "./product-validation.js";
import {parseCategoryIds,validateProductFields,validateStockMovement,validatePromotion,localDateTimeInput} from "./catalog-validation.js";
import {createRequestGuard} from "./request-guard.js";
import {captureEditorDraft,restoreEditorDraft} from "./editor-draft.js";
import {promotionStatus,promotionClosePayload} from "./promotion-lifecycle.js";
import {validateOfferingFields} from "./offering-validation.js";
import {validateStoreFields} from "./store-validation.js";
import {createPhotoEditor,parsePhotoLines,serializePhotos,previewImage} from "./photo-editor.js";
import {ownerModules,renderOwnerTool} from "./owner-tools.js";
import {createLookupField,createDestinationField} from "./owner-fields.js";
/** Administrative browser client. Authorization belongs to Spring Security,
 * never to hidden HTML fields, role flags or localStorage.
 */
const api=new AdminApi();
const $=q=>document.querySelector(q),el=(tag,text="",className="")=>{
 const e=document.createElement(tag);e.textContent=String(text??"");if(className)e.className=className;return e;
};
let moduleName="brands",editing=null,recordsPage=0,dirty=false,sessionUser=null,pendingDraft=null;
const recordsGate=createRequestGuard(),toolGate=createRequestGuard(),saveGate=createRequestGuard();
let lookupsPromise=null;
const lookup=()=>lookupsPromise??=Promise.all([api.get("/admin/brands"),api.get("/admin/categories")]).catch(error=>{lookupsPromise=null;throw error;});
const filters=()=>$("#record-filters");
function markDirty(){dirty=true;saveGate.invalidate();}
function editorError(error){if(error?.status===401){showLogin();info("Sessão expirada. Entre novamente.");}else info(error.message,true);}
const formDefs={
 brands:[["name","Nome da marca","text",true]],
 categories:[["name","Nome da categoria","text",true]],
 products:[["name","Nome do produto","text",true],["description","Descrição","textarea"],["priceStatus","Situação do preço","select",true,["CONFIRMED","ON_REQUEST"]],["price","Preço base (R$)","number",true],["brandId","Marca","brand",true],["categoryIds","Categorias","categories"],["images","Fotos","photos"],["published","Publicado","checkbox"],["available","Disponível manualmente","checkbox"]],
 offerings:[["title","Título","text",true],["description","Descrição","textarea"],["type","Tipo de serviço","select",true,["CANDLE","WORKSHOP","RENTAL"]],["price","Preço (vazio = sob consulta)","number"],["images","Fotos","photos"],["published","Publicado","checkbox"],["available","Disponível","checkbox"]],
 content:[["slug","Seção da loja","select",true,["conheca-a-loja","politica-de-privacidade"]],["title","Título","text",true],["body","Conteúdo","textarea"],["imageUrl","Foto","photo"],["position","Ordem","number"],["published","Publicado","checkbox"]],
 campaigns:[["title","Título","text",true],["subtitle","Subtítulo","text"],["imageUrl","Foto","photo"],["linkUrl","Destino do banner","destination"],["position","Ordem","number"],["startsAt","Data início","datetime-local"],["endsAt","Data fim","datetime-local"],["published","Publicado","checkbox"]],
 store:[["displayName","Nome público","text",true],["slogan","Slogan","text"],["description","Descrição da loja","textarea"],["whatsapp","WhatsApp DDI+DDD (somente dígitos)","text"],["instagramUrl","Instagram URL","text"],["email","E-mail de contato","email"],["openingHours","Horários de atendimento","textarea"],["address","Endereço (se publicado)","textarea"],["region","Região de atendimento","text"]]
};
const endMap={brands:"brands",categories:"categories",products:"products",offerings:"offerings",content:"content-sections",campaigns:"campaigns",audit:"audit-events",store:"store"};
function info(message,isError=false){const p=$("#admin-status");p.textContent=message;p.classList.toggle("error",!!isError);}
function toolInfo(message,isError=false){const p=$("#record-tool-status");p.textContent=message;p.classList.toggle("error",!!isError);}
function showLogin({preserveDraft=true}={}){
 if(preserveDraft&&sessionUser){
  const draft=captureEditorDraft({moduleName,editing,dirty,form:$("#edit-form")});
  if(draft)pendingDraft=draft;
 }else if(!preserveDraft)pendingDraft=null;
 recordsGate.invalidate();toolGate.invalidate();saveGate.invalidate();
 lookupsPromise=null;
 sessionUser=null;editing=null;dirty=false;recordsPage=0;
 $("#admin-workspace").hidden=true;$("#login-panel").hidden=false;
 // The panel is hidden, not destroyed, so clear private records and unsaved form data.
 $("#login-form").reset();
 $("#admin-user").textContent="";
 $("#edit-form").replaceChildren();
 $("#admin-records").replaceChildren();
 $("#record-tool-body").replaceChildren();
 $("#owner-tools").replaceChildren();
 filters().reset();filters().hidden=true;
 $("#security-password-form")?.reset();
 $("#security-email-form")?.reset();
 const dialog=$("#record-tool-dialog");if(dialog?.open)dialog.close();
}
function showWorkspace(name){
 sessionUser=name;$("#admin-user").textContent="Sessão: "+name;
 $("#login-panel").hidden=true;$("#admin-workspace").hidden=false;
 const draft=pendingDraft;pendingDraft=null;
 if(draft){
  $("#admin-module").value=draft.moduleName;
  changeModule(true);
  editing=draft.editing;
  buildForm(draft.moduleName==="content"?{slug:draft.fields?.slug}:{});
  if(restoreEditorDraft(draft,$("#edit-form"))){
   for(const input of $("#edit-form").elements)if(input.name)input.dispatchEvent(new Event("input"));
   $("#edit-form").elements.priceStatus?.dispatchEvent(new Event("change"));
   dirty=true;
   info("Edição não salva recuperada na aba. Revise os campos e salve novamente.");
  }
 }else changeModule(true);
}
async function bootstrap(){
 if(!adminOriginAllowed(window.location)){info("Painel exige HTTPS e API sob a mesma origem. Bloqueado neste endereço.",true);$("#login-form").querySelector("button").disabled=true;return;}
 try{await api.refreshCsrf();const user=await api.me();if(user?.authenticated)showWorkspace(user.username);else showLogin();}
 catch(error){showLogin();if(error?.status!==401)info("Não foi possível verificar a sessão. Aguarde o servidor e tente entrar novamente.",true);}
}
$("#login-form").addEventListener("submit",async event=>{
 event.preventDefault();const btn=event.submitter,username=$("#admin-username").value.trim(),password=$("#admin-password").value;
 btn.disabled=true;info("Autenticando...");
 try{
  const user=await api.login(username,password);$("#admin-password").value="";
  if(user?.authenticated!==true||typeof user.username!=="string"||!user.username.trim())
   throw new AdminApiError("Não foi possível confirmar a sessão administrativa.",401);
  showWorkspace(user.username);info("Acesso confirmado.");
 }catch(error){$("#admin-password").value="";info(error.message,true);}
 finally{btn.disabled=false;}
});
$("#logout").addEventListener("click",async()=>{
 try{await api.logout();showLogin({preserveDraft:false});info("Sessão encerrada.");}
 catch(error){
  showLogin({preserveDraft:false});
  info("Dados ocultados localmente; não foi possível confirmar a saída no servidor. Recarregue a página antes de continuar.",true);
 }
});
function fieldValue(field,values){
 const name=field[0],v=values[name];
 if(name==="brandId")return values.brand?.id??"";
 if(name==="categoryIds")return (values.categories||[]).map(x=>x.id).join(",");
 if(name==="images")return serializePhotos(values.images?.length?values.images:values.imageUrl?[{url:values.imageUrl,altText:""}]:[]);
 if(name==="priceStatus")return values.priceStatus??(values.id&&!(Number(values.price)>0)?"ON_REQUEST":"CONFIRMED");
 if(field[2]==="datetime-local"&&v)return localDateTimeInput(v);
 return v??"";
}
function buildForm(values={}){
 const root=$("#edit-form");root.replaceChildren();dirty=false;
 $("#save-button").disabled=false;
 $("#new-record").hidden=["audit","store"].includes(moduleName);
 $("#edit-heading").textContent=moduleName==="store"?"Informações da loja":editing===null?"Novo cadastro":"Editar cadastro";
 $("#editor-panel").hidden=moduleName==="audit";
 for(const field of formDefs[moduleName]||[]){
  const [name,label,type="text",required=false,options=[]]=field;
  if(type==="photos"||type==="photo"){
   const editor=createPhotoEditor({api,name,value:fieldValue(field,values),single:type==="photo",limit:type==="photo"?1:12,
    onChange:markDirty,onBusy:busy=>{$("#save-button").disabled=busy;if(busy)markDirty();},onError:editorError});
   root.append(editor);continue;
  }
  if(type==="brand"||type==="categories"){
   root.append(createLookupField({name,label,multiple:type==="categories",value:fieldValue(field,values),
    initial:type==="brand"?(values.brand?[values.brand]:[]):values.categories||[],
    load:()=>lookup().then(result=>result[type==="brand"?0:1]),onChange:markDirty,onError:editorError}));
   continue;
  }
  if(type==="destination"){
   root.append(createDestinationField({name,value:fieldValue(field,values),api,onChange:markDirty,onError:editorError}));continue;
  }
  const wrapper=el("label",label,"field"+(["description","images","body"].includes(name)?" wide":""));
  let input;
  if(type==="textarea"){input=document.createElement("textarea");input.rows=4;}
  else if(type==="select"){
   input=document.createElement("select");
   const choices=[...options];if(name==="slug"&&values.slug&&!choices.includes(values.slug))choices.unshift(values.slug);
   const labels={CONFIRMED:"Preço confirmado",ON_REQUEST:"Valor sob consulta",CANDLE:"Velas artesanais",WORKSHOP:"Oficinas",RENTAL:"Locações","conheca-a-loja":"Conheça a Loja","politica-de-privacidade":"Política de privacidade"};
   for(const opt of choices){const op=el("option",labels[opt]||opt);op.value=opt;input.append(op);}
  }
  else{input=document.createElement("input");input.type=type; if(type==="number"){input.step=name==="position"||name==="brandId"?"1":".01";input.min="0";}}
  input.name=name;input.required=required;
  if(type==="checkbox"){
   const selected=moduleName==="products"&&name==="available"?values.manualAvailable??values.available:values[name];
   input.checked=selected===undefined?(moduleName==="offerings"&&name==="available"):Boolean(selected);
  }
  else input.value=String(fieldValue(field,values)||(name==="slug"?"conheca-a-loja":name==="type"?"CANDLE":""));
  if(name==="slug"&&editing!==null)input.disabled=true;
  input.addEventListener("input",markDirty);
  wrapper.append(input);root.append(wrapper);
 }
 if(moduleName==="products"){
  const price=root.elements.price,status=root.elements.priceStatus;
  const syncPrice=()=>{
   const pending=status.value==="ON_REQUEST";
   price.disabled=pending;price.required=!pending;
  };
  status.addEventListener("change",syncPrice);syncPrice();
  if(editing!==null&&typeof values.manualAvailable!=="boolean"&&values.available===false)
   root.append(el("p","A versão antiga da API não distingue falta de estoque de indisponibilidade manual. Confira a seleção antes de salvar.","muted wide"));
 }
 $("#reset-form").hidden=moduleName==="store";
 $("#save-button").hidden=moduleName==="audit";
}
function collectForm(){
 const form=$("#edit-form"),data={};
 if(form.querySelector('[data-uploading="true"]'))throw new Error("Aguarde o envio de todas as fotos.");
 for(const field of formDefs[moduleName]||[]){
  const [name,,type="text"]=field,input=form.elements[name];
  let v=type==="checkbox"?input.checked:input.value.trim();
  if(type==="number"||name==="brandId")v=v===""?null:Number(v);
  if(type==="datetime-local")v=v?new Date(v).toISOString():null;
  if(name==="categoryIds")v=parseCategoryIds(v);
  if(name==="whatsapp"&&v==="")v=null;
  if(name==="images")v=parsePhotoLines(v);

  if(name==="instagramUrl"&&v){
   const parsed=new URL(v,location.origin);
   if(parsed.protocol!=="https:"&&!["localhost","127.0.0.1"].includes(parsed.hostname))throw new Error("Use URL HTTPS em "+name);
  }
  data[name]=v;
 }
 if(moduleName==="products"){
  if(data.priceStatus==="ON_REQUEST")data.price=null;
  validateProductFields(data);
 }
 if(moduleName==="products")validateProductImages(data.images,data.published);
 if(moduleName==="offerings"){validateProductImages(data.images,data.published);data.imageUrl=data.images[0]?.url||null;validateOfferingFields(data);if(data.price===null)delete data.price;}
 if(moduleName==="campaigns"){
  if(data.published&&!data.imageUrl)throw new Error("Escolha uma foto antes de publicar o banner.");
  if(data.startsAt&&data.endsAt&&data.endsAt<=data.startsAt)throw new Error("O fim da campanha deve ser posterior ao início.");
 }
 if(moduleName==="store")validateStoreFields(data);
 return data;
}
async function save(event){
 event.preventDefault();const button=$("#save-button");button.disabled=true;
 const submittedModule=moduleName,submittedSession=sessionUser,token=saveGate.begin();
 const isCurrent=()=>saveGate.isCurrent(token)&&sessionUser===submittedSession&&moduleName===submittedModule;
 const endpoint=endMap[submittedModule],path=submittedModule==="store"?"/admin/store":"/admin/"+endpoint+(editing===null?"":"/"+Number(editing));
 const method=submittedModule==="store"||editing!==null?"PUT":"POST";
 try{
  const body=collectForm();
  await api.write(method,path,body);
  if(!isCurrent())return;
  if(["brands","categories"].includes(submittedModule))lookupsPromise=null;
  info("Dados salvos. Revise publicação e disponibilidade.");editing=null;dirty=false;buildForm();recordsPage=0;await loadRecords();
 }catch(error){
  if(!isCurrent())return;
  info(error.message,true);
  $("#admin-status").scrollIntoView({block:"nearest",behavior:"smooth"});
  if(error.status===401)showLogin();
 }
 finally{button.disabled=false;}
}
$("#edit-form").addEventListener("submit",save);
$("#reset-form").addEventListener("click",()=>{
 if(dirty&&!confirm("Descartar alterações não salvas?"))return;
 saveGate.invalidate();editing=null;buildForm();
});
$("#new-record").addEventListener("click",()=>{
 if(dirty&&!confirm("Descartar alterações não salvas?"))return;
 saveGate.invalidate();editing=null;buildForm();$("#editor-panel").scrollIntoView({block:"start",behavior:"smooth"});
});
$("#admin-module").addEventListener("change",()=>{if(dirty&&!confirm("Descartar alterações não salvas?")){$("#admin-module").value=moduleName;return;}changeModule(true);});
$("#reload-records").addEventListener("click",()=>{recordsPage=0;loadRecords().catch(e=>info(e.message,true));});
$("#admin-more").addEventListener("click",async()=>{recordsPage++;try{await loadRecords();}catch(e){recordsPage--;info(e.message,true);}});
filters().addEventListener("submit",event=>{event.preventDefault();recordsPage=0;loadRecords().catch(editorError);});
filters().addEventListener("change",event=>{if(event.target.tagName==="SELECT"){recordsPage=0;loadRecords().catch(editorError);}});
$("#clear-filters").addEventListener("click",()=>{filters().reset();recordsPage=0;loadRecords().catch(editorError);});
function changeModule(reset=false){
 recordsGate.invalidate();toolGate.invalidate();saveGate.invalidate();
 if(tool.open)tool.close();
 $("#admin-records").replaceChildren();
 $("#admin-more").hidden=true;
 moduleName=$("#admin-module").value;
 if(reset)recordsPage=0;
 editing=null;dirty=false;
 $("#edit-form").replaceChildren();$("#owner-tools").replaceChildren();
 filters().reset();filters().hidden=moduleName!=="products";
 $("#standard-editor").hidden=ownerModules.has(moduleName);
 $("#owner-tools").hidden=!ownerModules.has(moduleName);
 if(ownerModules.has(moduleName)){
  const ticket=recordsGate.begin(),session=sessionUser;
  const active=()=>recordsGate.isCurrent(ticket)&&sessionUser===session&&!!session;
  void renderOwnerTool({module:moduleName,container:$("#owner-tools"),api,active,info,
    changed:value=>{if(active())dirty=value;},sessionExpired:()=>showLogin()}).catch(editorError);
  return;
 }
 if(moduleName==="products"){
  const form=filters(),session=sessionUser;
  lookup().then(([brands,categories])=>{
   if(session!==sessionUser||moduleName!=="products")return;
   for(const [name,entries,placeholder] of [["brandId",brands,"Todas as marcas"],["categoryId",categories,"Todas as categorias"]]){
    const input=form.elements[name];input.replaceChildren(new Option(placeholder,""));
    for(const entry of entries)input.append(new Option(entry.name,String(entry.id)));
   }
  }).catch(error=>{if(session===sessionUser&&moduleName==="products")editorError(error);});
 }
 buildForm();
 loadRecords().catch(error=>{if(error.status!==401)info(error.message,true);});
}
function addAction(parent,label,handler){
 const button=el("button",label,"btn btn--secondary");button.type="button";button.addEventListener("click",handler);parent.append(button);return button;
}
async function loadRecords(){
 const requestedModule=moduleName,requestedPage=recordsPage,requestedSession=sessionUser;
 if(!requestedSession)return;
 const ticket=recordsGate.begin(),endpoint=endMap[requestedModule];
 const moreButton=$("#admin-more");moreButton.disabled=true;
 let result,items;
 try{
 if(requestedModule==="store"){
  result=await api.get("/store");items=[result];
 }else{
  const params=new URLSearchParams({page:String(requestedPage),size:"12"});
  if(requestedModule==="products"){for(const [key,value] of new FormData(filters()))if(String(value).trim())params.set(key,String(value).trim());}
  const suffix=requestedModule==="products"?"?"+params:requestedModule==="audit"?"?page="+requestedPage+"&size=20":"";
  result=await api.get("/admin/"+endpoint+suffix);items=Array.isArray(result)?result:result?.content||[];
 }
 }catch(error){
  if(recordsGate.isCurrent(ticket)&&sessionUser===requestedSession){
   if(error.status===401)showLogin();
   else moreButton.disabled=false;
  }
  throw error;
 }
 if(!recordsGate.isCurrent(ticket)||sessionUser!==requestedSession||
    moduleName!==requestedModule||recordsPage!==requestedPage)return;
 moreButton.disabled=false;
 if(requestedModule==="store"&&!dirty)buildForm(result);
 const list=$("#admin-records");if(requestedPage===0)list.replaceChildren();
 if(!items.length&&requestedPage===0)list.append(el("p","Nenhum registro disponível.","muted"));
 $("#admin-more").hidden=!["products","audit"].includes(requestedModule)||result?.last!==false;
 for(const item of items){
  const card=el("article","","admin-record"),desc=el("div","","admin-record__info");
  if(requestedModule==="audit"){
   desc.append(el("strong",(item.method||"HTTP")+" · "+(item.routePattern||"Rota")+" · "+(item.status??"?")));
   desc.append(el("small",(item.occurredAt?new Date(item.occurredAt).toLocaleString("pt-BR"):"")+" · "+(item.actor||"Administrador")));
   card.append(desc);list.append(card);continue;
  }
  desc.append(el("strong",item.name||item.title||item.displayName||"Registro #"+(item.id||"")));
  const lookup=["brands","categories"].includes(requestedModule);
  const recordStatus=lookup&&typeof item.active==="boolean"?(item.active?"Ativa":"Inativa"):
   item.published===true?"Publicado":item.published===false?"Rascunho":"Cadastro";
  if(item.images?.[0]?.url||item.imageUrl){const image=previewImage(item.images?.[0]?.url||item.imageUrl);image.className="admin-record-photo";card.append(image);}
  desc.append(el("small",recordStatus+(requestedModule==="products"&&item.brand?.name?" · "+item.brand.name:"")));
  if(requestedModule==="products"&&item.priceStatus==="ON_REQUEST")desc.append(el("small","Valor sob consulta · solicitação bloqueada"));
  if(requestedModule==="products"&&Number.isInteger(item.stockQuantity))
   desc.append(el("small","Estoque: "+item.stockQuantity+" · Disponibilidade manual: "+(item.manualAvailable?"Sim":"Não")));
  card.append(desc);
  if(requestedModule!=="store"){
   const actions=el("div","","admin-record__actions");
   if(requestedModule==="products"){addAction(actions,"Estoque",()=>openTool(item.id,"stock"));addAction(actions,"Promoções",()=>openTool(item.id,"promotions",item.price));}
   if(requestedModule==="offerings"&&item.type==="CANDLE")addAction(actions,"Aromas / cores",()=>openTool(item.id,"options"));
   addAction(actions,"Editar",()=>{
    if(dirty&&!confirm("Descartar alterações não salvas?"))return;
    saveGate.invalidate();editing=item.id;buildForm(item);$("#editor-panel").scrollIntoView({block:"start",behavior:"smooth"});
   });
   const reactivate=lookup&&item.active===false;
   addAction(actions,reactivate?"Reativar":lookup?"Desativar":"Excluir",async()=>{
    if(!confirm(reactivate?"Confirmar reativação?":lookup?"Confirmar desativação do cadastro?":"Confirmar exclusão definitiva? Registros com histórico devem ser despublicados."))return;
    const sameContext=()=>recordsGate.isCurrent(ticket)&&sessionUser===requestedSession&&moduleName===requestedModule;
    try{
     const path="/admin/"+endpoint+"/"+Number(item.id)+(reactivate?"/activate":"");
     await api.write(reactivate?"PUT":"DELETE",path);
     if(!sameContext())return;
     if(lookup)lookupsPromise=null;
     info("Operação concluída.");recordsPage=0;await loadRecords();
    }catch(error){if(sameContext()){if(error.status===401)showLogin();info(error.message,true);}}
   });
   card.append(actions);
  }
  list.append(card);
 }
}
const tool=$("#record-tool-dialog");$("#close-record-tool").addEventListener("click",()=>tool.close());
tool.addEventListener("close",()=>toolGate.invalidate());
tool.addEventListener("click",e=>{if(e.target===tool)tool.close();});
function field(parent,name,label,type="text"){
 const wrap=el("label",label,"field"),input=document.createElement("input");
 input.name=name;input.type=type;input.required=true;if(type==="number"){input.min="0";input.step="1";}
 wrap.append(input);parent.append(wrap);return input;
}
async function openTool(id,kind,basePrice=null,successMessage=""){
 if(!sessionUser)return;
 const requestedSession=sessionUser,ticket=toolGate.begin();
 const isActive=()=>toolGate.isCurrent(ticket)&&sessionUser===requestedSession&&tool.open;
 const toolError=error=>{
  if(!isActive())return;
  if(error.status===401){showLogin();info("Sessão expirada. Entre novamente.",true);}
  else toolInfo(error.message,true);
 };
 const root=$("#record-tool-body");root.replaceChildren();
 $("#record-tool-heading").textContent=(kind==="stock"?"Movimentação de estoque":kind==="promotions"?"Promoções":"Personalização de velas")+" · #"+id;
 if(!tool.open)tool.showModal();toolInfo("Carregando...");
 try{
  if(kind==="stock"){
   const [balance,history]=await Promise.all([api.get("/admin/products/"+id+"/stock"),api.get("/admin/products/"+id+"/stock/movements?page=0&size=10")]);
   if(!isActive())return;
   root.append(el("p","Saldo: "+balance.quantity+" · Disponível: "+(balance.available?"Sim":"Não")));
   const form=el("form","","admin-form"),wrap=el("label","Tipo","field"),sel=document.createElement("select");
   sel.name="type";for(const t of ["ENTRY","EXIT","ADJUSTMENT"]){const o=el("option",t);o.value=t;sel.append(o);}wrap.append(sel);form.append(wrap);
   const qty=field(form,"quantity","Quantidade / novo saldo","number");qty.min="0";
   const reason=field(form,"reason","Justificativa");reason.maxLength=500;
   const btn=el("button","Registrar movimentação","btn btn--primary");btn.type="submit";form.append(btn);
   form.addEventListener("submit",async e=>{e.preventDefault();btn.disabled=true;try{const movement=validateStockMovement({type:sel.value,quantity:qty.value,reason:reason.value});await api.write("POST","/admin/products/"+id+"/stock/movements",movement);if(isActive())await openTool(id,kind,null,"Movimentação registrada.");}catch(e){toolError(e);}finally{btn.disabled=false;}});
   root.append(form,el("h3","Últimas movimentações"));
   for(const h of history.content||[]){root.append(el("p",(h.createdAt||"")+" · "+h.type+" "+h.quantity+" · saldo "+h.resultingQuantity+" · "+(h.reason||""),"tool-entry"));}
  }else if(kind==="promotions"){
   const all=await api.get("/admin/products/"+id+"/promotions");
   if(!isActive())return;
   let editingPromotion=null;
   const form=el("form","","admin-form"),value=field(form,"promotionalPrice","Preço promocional","number"),start=field(form,"startsAt","Início","datetime-local"),end=field(form,"endsAt","Fim","datetime-local");value.step=".01";
   const button=el("button","Criar promoção","btn btn--primary");button.type="submit";form.append(button);
   const cancel=addAction(form,"Cancelar edição",()=>{
    editingPromotion=null;form.reset();button.textContent="Criar promoção";cancel.hidden=true;
   });cancel.hidden=true;
   for(const p of all){
    const row=el("div","","tool-entry"),status=promotionStatus(p);
    const labels={active:"Ativa",future:"Programada",ended:"Encerrada por prazo",closed:"Encerrada manualmente",unknown:"Status desconhecido"};
    row.append(el("p","Promoção #"+p.id+" · R$ "+p.promotionalPrice+" · "+p.startsAt+" até "+p.endsAt+" · "+labels[status]));
    if(status==="closed"){
     row.append(el("p","Motivo: "+(p.closedReason||"Não informado")+" · Responsável: "+(p.closedBy||"Não informado")));
    }
    if(status==="active"){
     addAction(row,"Encerrar promoção",async()=>{
      const reason=prompt("Informe o motivo do encerramento desta promoção ativa:");
      if(reason===null)return;
      let payload;try{payload=promotionClosePayload(reason);}catch(error){toolInfo(error.message,true);return;}
      if(!confirm("Confirmar encerramento? A promoção ficará no histórico e perderá vigência imediatamente."))return;
      try{await api.write("POST","/admin/products/"+id+"/promotions/"+p.id+"/close",payload);if(isActive())await openTool(id,kind,basePrice,"Promoção encerrada; histórico preservado.");}
      catch(error){toolError(error);}
     });
    }
    if(status==="future"){
     addAction(row,"Editar promoção programada",()=>{
      editingPromotion=p.id;
      value.value=String(p.promotionalPrice);
      start.value=localDateTimeInput(p.startsAt);end.value=localDateTimeInput(p.endsAt);
      button.textContent="Salvar promoção programada";cancel.hidden=false;
      value.focus();
     });
    }
    root.append(row);
   }
   root.append(el("p","Preço base do produto: R$ "+String(basePrice??"não informado"),"muted"));
   form.addEventListener("submit",async e=>{
    e.preventDefault();button.disabled=true;cancel.disabled=true;
    try{
     const promotion=validatePromotion({price:value.value,basePrice,startsAt:start.value,endsAt:end.value});
     const basePath="/admin/products/"+id+"/promotions";
     await api.write(editingPromotion===null?"POST":"PUT",basePath+(editingPromotion===null?"":"/"+Number(editingPromotion)),promotion);
     if(isActive())await openTool(id,kind,basePrice,"Promoção registrada.");
    }catch(error){toolError(error);}finally{button.disabled=false;cancel.disabled=false;}
   });
   root.append(form);
  }else{
   const offering=await api.get("/admin/offerings/"+id);
   if(!isActive())return;
   const form=el("form","","admin-form"),editors={};
   root.append(el("p","Uma opção por linha; prefixe com ! para desativar. Salvar substitui todas as opções do modelo."));
   for(const kind of ["AROMA","COLOR","PACKAGING"]){
    const wrap=el("label",kind,"field wide"),area=document.createElement("textarea");area.rows=4;area.value=(offering.options||[]).filter(o=>o.kind===kind).map(o=>(o.active?"":"!")+o.label).join("\n");wrap.append(area);form.append(wrap);editors[kind]=area;
   }
   const btn=el("button","Salvar opções","btn btn--primary");btn.type="submit";form.append(btn);
   form.addEventListener("submit",async e=>{e.preventDefault();btn.disabled=true;try{const options=[];for(const [kind,area] of Object.entries(editors)){for(const raw of area.value.split("\n").map(x=>x.trim()).filter(Boolean)){const active=!raw.startsWith("!"),label=(active?raw:raw.slice(1)).trim();if(!label||label.length>120)throw new Error("Rótulo inválido.");options.push({kind,label,position:options.length,active});}}if(options.length>48)throw new Error("Limite de 48 opções.");await api.write("PUT","/admin/offerings/"+id+"/options",{options});if(isActive())await openTool(id,kind,null,"Personalizações atualizadas.");}catch(e){toolError(e);}finally{btn.disabled=false;}});
   root.append(form);
  }
  if(isActive())toolInfo(successMessage);
 }catch(error){
  if(!isActive())return;
  if(error.status===401){showLogin();info("Sessão expirada. Entre novamente.",true);}
  else toolInfo(error.message,true);
 }
}
setupSecurityPanel(api,{
 onPasswordChanged:()=>{showLogin();info("Credenciais alteradas. Faça login novamente.");},
 onSessionExpired:()=>{showLogin();info("Sessão encerrada. Faça login novamente.",true);}
});
bootstrap();
