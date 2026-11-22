import {AdminApi,AdminApiError,adminOriginAllowed} from "./api.js";
import {createRequestGuard} from "./request-guard.js";
import {action} from "./photo-editor.js";

/** The backend's list DTO intentionally omits result keys and edit metadata.
 * Never reconstruct a PUT from that incomplete DTO: it could erase data.
 */
export function validateExperienceDraft(draft) {
 if(!draft||typeof draft!=="object")throw new Error("Quiz inválido.");
 const title=String(draft.title||"").trim(),description=String(draft.description||"").trim();
 if(!title||title.length>180||description.length>2000)throw new Error("Confira título e descrição.");
 const published=draft.published===true;
 if(!Array.isArray(draft.results)||draft.results.length>20||(published&&!draft.results.length))
  throw new Error("Experiências publicadas precisam de 1 a 20 perfis; rascunhos podem estar vazios.");
 const results=draft.results.map(x=>({
  key:String(x.key||"").trim(),title:String(x.title||"").trim(),
  description:String(x.description||"").trim()
 }));
 const keys=new Set();
 for(const x of results){
  if(!/^[a-z0-9][a-z0-9_-]{0,79}$/.test(x.key)||!x.title||x.title.length>180||
     x.description.length>2000||keys.has(x.key))
   throw new Error("Chaves dos perfis devem ser únicas, válidas e conter títulos.");
  keys.add(x.key);
 }
 if(!Array.isArray(draft.questions)||draft.questions.length>30||(published&&!draft.questions.length))
  throw new Error("Experiências publicadas precisam de 1 a 30 perguntas; rascunhos podem estar vazios.");
 const questions=draft.questions.map((q,position)=>{
  const heading=String(q.title||"").trim();
  if(!heading||heading.length>350||!Array.isArray(q.options)||q.options.length>20||(published&&q.options.length<2))
   throw new Error("Cada pergunta publicada precisa de 2 a 20 alternativas e título válido.");
  const options=q.options.map((o,index)=>{
   const label=String(o.label||"").trim(),resultKey=String(o.resultKey||"").trim();
   if(!label||label.length>300||!keys.has(resultKey))
    throw new Error("Cada alternativa precisa ter texto e indicar um perfil cadastrado.");
   return {label,resultKey,position:index};
  });
  return {title:heading,position,options};
 });
 return {title,description,published,questions,results};
}
/** Accept only a complete admin DTO before populating an editable form. */
export function normalizeAdminExperience(data) {
 if(!data||!Number.isSafeInteger(data.id)||data.id<1||typeof data.published!=="boolean"||
  !Array.isArray(data.results)||!Array.isArray(data.questions))
  throw new Error("A API não retornou um quiz completo; edição cancelada.");
 const results=data.results.map(x=>({key:x.key,title:x.title,description:x.description||""}));
 const questions=data.questions.map(q=>({title:q.title,options:Array.isArray(q.options)?
  q.options.map(o=>({label:o.label,resultKey:o.resultKey})):null}));
 if(questions.some(q=>!q.options||q.options.some(o=>typeof o.resultKey!=="string")))
  throw new Error("Faltam chaves das alternativas; edição cancelada.");
 return {id:data.id,...validateExperienceDraft({title:data.title,description:data.description||"",
  published:data.published,results,questions})};
}
export function validateRecommendations({experienceId,resultKey,ids}) {
 const id=Number(experienceId),key=String(resultKey||"").trim();
 if(!Number.isSafeInteger(id)||id<1||!/^[a-z0-9][a-z0-9_-]{0,79}$/.test(key))
  throw new Error("Informe ID de experiência e chave de resultado válidos.");
 const raw=String(ids??"").trim();
 const parts=raw?raw.split(",").map(x=>x.trim()):[];
 if(parts.some(x=>!x))throw new Error("Informe IDs separados por vírgula sem valores vazios.");
 if(parts.length>3)throw new Error("É permitido recomendar no máximo 3 produtos.");
 const productIds=parts.map(Number);
 if(productIds.some(x=>!Number.isSafeInteger(x)||x<=0)||new Set(productIds).size!==productIds.length)
  throw new Error("IDs devem ser positivos e sem repetição.");
 return {experienceId:id,resultKey:key,productIds};
}
const api=new AdminApi(),$=selector=>document.querySelector(selector);
let editingId=null;
let originalResultKeys=[];
let sessionActive=false;
let recDetails=null,recChosen=[],recDirty=false,recReady=false;
const recGate=createRequestGuard(),recSearchGate=createRequestGuard();
const listGate=createRequestGuard(),editGate=createRequestGuard(),mutationGate=createRequestGuard();
export function removedResultKeys(originalKeys,nextKeys){
 const next=new Set(nextKeys);
 return originalKeys.filter(key=>!next.has(key));
}
function notify(message,error=false){
 const el=$("#experiences-status");if(el){el.textContent=message;el.classList.toggle("error",error);}
}
function lockWorkspace(){
 sessionActive=false;
 listGate.invalidate();editGate.invalidate();mutationGate.invalidate();
 recGate.invalidate();recSearchGate.invalidate();recDetails=null;recChosen=[];recDirty=false;recReady=false;
 $("#experiences-workspace").hidden=true;
 $("#available-experiences").replaceChildren();
 $("#recs-experience-id").value="";
 $("#recs-result-key").value="";
 $("#recommendations-form").reset();
 $("#recs-selected").replaceChildren();$("#recs-products").replaceChildren();$("#recs-pagination").replaceChildren();
 resetEditor();
 notify("Sessão expirada ou sem autorização. Entre novamente no painel.",true);
}
function handleSessionError(error){
 if(error?.status===401){lockWorkspace();return true;}
 return false;
}
function resultRow() {
 const el=document.createElement("fieldset");el.dataset.resultRow="";el.className="experience-card";
 el.innerHTML='<legend>Perfil de resultado</legend>'+
 '<input name="key" type="hidden">'+
 '<label class="field">Título<input name="title" maxlength="180" required></label>'+
 '<label class="field">Descrição<textarea name="description" maxlength="2000" rows="2"></textarea></label>'+
 '<button type="button" class="btn btn--ghost" data-remove-row>Remover perfil</button>';
 return el;
}
function optionRow(){
 const el=document.createElement("div");el.dataset.optionRow="";el.className="experience-option";
 el.innerHTML='<label class="field">Alternativa<input name="label" maxlength="300" required></label>'+
 '<label class="field">Perfil correspondente<select name="resultKey" required><option value="">Selecione um perfil</option></select></label>'+
 '<button class="btn btn--ghost" type="button" data-remove-row>Remover alternativa</button>';return el;
}
function questionRow(){
 const el=document.createElement("fieldset");el.dataset.questionRow="";el.className="experience-card";
 el.innerHTML='<legend>Pergunta</legend>'+
 '<label class="field">Enunciado<input name="title" maxlength="350" required></label>'+
 '<div class="experience-options" data-options></div>'+
 '<button class="btn btn--secondary" type="button" data-add-option>Adicionar alternativa</button> '+
 '<button class="btn btn--ghost" type="button" data-remove-row>Remover pergunta</button>';
 el.querySelector("[data-options]").append(optionRow(),optionRow());return el;
}
function field(row,name){return row.querySelector('[name="'+name+'"]')?.value||"";}
function syncProfiles(){
 const profiles=[],used=new Set();
 for(const row of $("#quiz-results").querySelectorAll("[data-result-row]")){
  const key=row.querySelector('[name="key"]'),title=field(row,"title").trim();
  if(!key.value&&title){
   const base=title.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,60)||"perfil";
   let next=base,index=2;
   const existing=new Set([...$("#quiz-results").querySelectorAll('[name="key"]')].map(x=>x.value));
   while(existing.has(next)||used.has(next))next=base+"-"+index++;
   key.value=next;
  }
  if(key.value){used.add(key.value);profiles.push({key:key.value,title:title||"Perfil sem título"});}
 }
 for(const select of $("#quiz-questions").querySelectorAll('[name="resultKey"]')){
  const saved=select.value||select.dataset.selected||"";
  select.replaceChildren(new Option("Selecione um perfil",""),...profiles.map(p=>new Option(p.title,p.key)));
  select.value=profiles.some(p=>p.key===saved)?saved:"";delete select.dataset.selected;
 }
}
function draftFromDom(){
 const form=$("#quiz-editor");
 const results=[...$("#quiz-results").querySelectorAll("[data-result-row]")].map(row=>({
  key:field(row,"key"),title:field(row,"title"),description:field(row,"description")
 }));
 const questions=[...$("#quiz-questions").querySelectorAll("[data-question-row]")].map(row=>({
  title:field(row,"title"),
  options:[...row.querySelectorAll("[data-option-row]")].map(opt=>({
   label:field(opt,"label"),resultKey:field(opt,"resultKey")
  }))
 }));
 return validateExperienceDraft({
  title:form.elements.title.value,description:form.elements.description.value,
  published:form.elements.published.checked,questions,results
 });
}
function resetEditor(){
 editGate.invalidate();
 editingId=null;
 originalResultKeys=[];
 $("#quiz-editor").reset();
 $("#quiz-results").replaceChildren(resultRow());
 $("#quiz-questions").replaceChildren(questionRow());
 syncProfiles();
 $("#submit-quiz").textContent="Cadastrar experiência";
 $("#cancel-edit").hidden=true;
 $("#create-heading").textContent="Criar experiência";
}
function fillEditor(data){
 const draft=normalizeAdminExperience(data),form=$("#quiz-editor");
 form.elements.title.value=draft.title;
 form.elements.description.value=draft.description;
 form.elements.published.checked=draft.published;
 $("#quiz-results").replaceChildren();
 for(const result of draft.results){
  const row=resultRow();
  for(const name of ["key","title","description"])row.querySelector('[name="'+name+'"]').value=result[name];
  $("#quiz-results").append(row);
 }
 $("#quiz-questions").replaceChildren();
 for(const question of draft.questions){
  const row=questionRow(),options=row.querySelector("[data-options]");
  row.querySelector('[name="title"]').value=question.title;
  options.replaceChildren();
  for(const option of question.options){
   const item=optionRow();
   item.querySelector('[name="label"]').value=option.label;
   item.querySelector('[name="resultKey"]').dataset.selected=option.resultKey;
   options.append(item);
  }
  $("#quiz-questions").append(row);
 }
 syncProfiles();
 editingId=draft.id;
 originalResultKeys=draft.results.map(x=>x.key);
 $("#submit-quiz").textContent="Salvar alterações";
 $("#cancel-edit").hidden=false;
 $("#create-heading").textContent="Editar experiência #"+draft.id;
 $("#quiz-editor").scrollIntoView({behavior:"smooth",block:"start"});
}
async function refresh(){
 if(!sessionActive)return;
 const ticket=listGate.begin();
 const list=$("#available-experiences");list.replaceChildren();
 let entries;
 try{entries=await api.get("/admin/experiences");}
 catch(error){if(listGate.isCurrent(ticket)&&!handleSessionError(error))notify(error.message,true);return;}
 if(!sessionActive||!listGate.isCurrent(ticket))return;
 const picker=$("#recs-experience-id"),previous=picker.value;
 picker.replaceChildren(new Option("Escolha a experiência",""));
 if(!Array.isArray(entries)||!entries.length){list.textContent="Nenhuma experiência cadastrada.";return;}
 for(const item of entries)picker.append(new Option(item.title,String(item.id)));
 picker.value=entries.some(item=>String(item.id)===previous)?previous:"";
 for(const item of entries){
  const article=document.createElement("article");article.className="experience-card";
  const heading=document.createElement("h3");heading.textContent=item.title||"Experiência";
  const sub=document.createElement("p");sub.textContent=(item.questions||[]).length+" perguntas · "+(item.published?"Publicado":"Rascunho");
  const button=document.createElement("button");button.type="button";button.className="btn btn--secondary";
  button.textContent="Configurar recomendações";
  button.addEventListener("click",()=>{if(recDirty&&!confirm("Descartar alterações nas recomendações?"))return;picker.value=String(item.id);void loadRecProfiles();});
  const edit=document.createElement("button");edit.type="button";edit.className="btn btn--secondary";
  edit.textContent="Editar quiz";edit.addEventListener("click",async()=>{
   const ticket=editGate.begin();
   edit.disabled=true;notify("Carregando quiz completo...");
   try{
    const loaded=await api.get("/admin/experiences/"+item.id);
    if(!sessionActive||!editGate.isCurrent(ticket))return;
    fillEditor(loaded);notify("Quiz carregado para edição.");
   }catch(error){
    if(editGate.isCurrent(ticket)&&!handleSessionError(error))
     notify(error?.message||"Não foi possível carregar o quiz.",true);
   }finally{edit.disabled=false;}
  });
  article.append(heading,sub,button,edit);list.append(article);
 }
}
function updateRecSelection(){
 const target=$("#recs-selected");target.replaceChildren();
 $("#recommendations-form").elements.ids.value=recChosen.map(x=>x.id).join(",");
 for(const [index,p] of recChosen.entries()){
  const row=document.createElement("div");row.className="owner-product-row";
  const text=document.createElement("strong");text.textContent=(index+1)+". "+p.name;
  row.append(text);
  if(index>0)row.append(action("Subir",()=>{[recChosen[index-1],recChosen[index]]=[recChosen[index],recChosen[index-1]];recDirty=true;updateRecSelection();}));
  if(index<recChosen.length-1)row.append(action("Descer",()=>{[recChosen[index+1],recChosen[index]]=[recChosen[index],recChosen[index+1]];recDirty=true;updateRecSelection();}));
  row.append(action("Retirar",()=>{recChosen=recChosen.filter(x=>x.id!==p.id);recDirty=true;updateRecSelection();},"btn btn--ghost"));
  target.append(row);
 }
 $("#save-recommendations").disabled=!recReady;
 for(const button of $("#recs-products").querySelectorAll("[data-rec-product]"))button.disabled=!recReady||recChosen.length>=3||recChosen.some(p=>Number(p.id)===Number(button.dataset.recProduct));
}
async function loadRecProfiles(){
 const ticket=recGate.begin();recSearchGate.invalidate();recDetails=null;recChosen=[];recDirty=false;recReady=false;
 const id=$("#recs-experience-id").value,select=$("#recs-result-key");
 select.replaceChildren(new Option("Escolha o perfil",""));$("#recs-products").replaceChildren();$("#recs-pagination").replaceChildren();updateRecSelection();
 if(!id||!sessionActive)return;
 try{
  const details=await api.get("/admin/experiences/"+Number(id));
  if(!sessionActive||!recGate.isCurrent(ticket))return;
  if(!Array.isArray(details.results))throw new Error("Perfis indisponíveis.");
  recDetails=details;for(const profile of details.results)select.append(new Option(profile.title,profile.key));
  if(details.results.length){select.value=details.results[0].key;await loadRecProducts();}
 }catch(error){if(recGate.isCurrent(ticket)&&!handleSessionError(error))notify(error.message,true);}
}
async function loadRecProducts(){
 const ticket=recGate.begin();recSearchGate.invalidate();recChosen=[];recDirty=false;recReady=false;
 const profile=recDetails?.results?.find(x=>x.key===$("#recs-result-key").value);
 updateRecSelection();$("#recs-products").replaceChildren();$("#recs-pagination").replaceChildren();
 if(!profile||!Array.isArray(profile.productIds))return;
 try{
  const items=await Promise.all(profile.productIds.map(async id=>{
   try{const product=await api.get("/admin/products/"+Number(id));return {id:Number(id),name:product.name||"Produto cadastrado"};}
   catch(error){if(error.status===401)throw error;return {id:Number(id),name:"Produto anteriormente selecionado"};}
  }));
  if(!sessionActive||!recGate.isCurrent(ticket))return;
  recChosen=items;recReady=true;updateRecSelection();await searchRecommendations(0);
 }catch(error){if(recGate.isCurrent(ticket)&&!handleSessionError(error))notify(error.message,true);}
}
async function searchRecommendations(page=0){
 if(!recReady||!sessionActive)return;
 const ticket=recSearchGate.begin(),params=new URLSearchParams({page:String(page),size:"12",published:"true"});
 const query=$("#recs-search").value.trim();if(query)params.set("q",query);
 try{
  const result=await api.get("/admin/products?"+params);
  if(!sessionActive||!recSearchGate.isCurrent(ticket))return;
  const list=$("#recs-products"),pager=$("#recs-pagination");list.replaceChildren();pager.replaceChildren();
  for(const p of result.content||[]){
   if(!p.published||!Number.isSafeInteger(Number(p.id)))continue;
   const row=document.createElement("div");row.className="owner-product-row";
   const title=document.createElement("span");title.textContent=p.name;
   const add=action("Adicionar",()=>{if(recChosen.length>=3||recChosen.some(x=>x.id===p.id))return;recChosen.push({id:p.id,name:p.name});recDirty=true;updateRecSelection();});
   add.dataset.recProduct=String(p.id);row.append(title,add);list.append(row);
  }
  if(!list.children.length)list.textContent="Nenhum produto publicado encontrado.";
  if(page>0)pager.append(action("Anterior",()=>void searchRecommendations(page-1)));
  if(!result.last)pager.append(action("Mais produtos",()=>void searchRecommendations(page+1)));
  updateRecSelection();
 }catch(error){if(recSearchGate.isCurrent(ticket)&&!handleSessionError(error))notify(error.message,true);}
}
function init() {
 $("#add-result").addEventListener("click",()=>{$("#quiz-results").append(resultRow());syncProfiles();});
 $("#add-question").addEventListener("click",()=>{$("#quiz-questions").append(questionRow());syncProfiles();});
 $("#quiz-results").addEventListener("input",syncProfiles);
 $("#quiz-editor").addEventListener("click",e=>{
  const add=e.target.closest("[data-add-option]");
  if(add){add.closest("[data-question-row]").querySelector("[data-options]").append(optionRow());syncProfiles();return;}
  const remove=e.target.closest("[data-remove-row]");
  if(remove){remove.closest("[data-option-row], [data-result-row], [data-question-row]")?.remove();syncProfiles();}
 });
 $("#quiz-results").append(resultRow());$("#quiz-questions").append(questionRow());
 updateRecSelection();
 $("#recs-experience-id").addEventListener("change",()=>{if(recDirty&&!confirm("Descartar alterações nas recomendações?")){$("#recs-experience-id").value=String(recDetails?.id||"");return;}void loadRecProfiles();});
 $("#recs-result-key").addEventListener("focus",event=>event.target.dataset.previous=event.target.value);
 $("#recs-result-key").addEventListener("change",event=>{if(recDirty&&!confirm("Descartar alterações nas recomendações?")){event.target.value=event.target.dataset.previous||"";return;}event.target.dataset.previous=event.target.value;void loadRecProducts();});
 $("#recs-find").addEventListener("click",()=>void searchRecommendations(0));
 $("#recs-search").addEventListener("keydown",event=>{if(event.key==="Enter"){event.preventDefault();void searchRecommendations(0);}});
 $("#cancel-edit").addEventListener("click",()=>{resetEditor();notify("Edição cancelada.");});
 $("#quiz-editor").addEventListener("submit",async e=>{
  e.preventDefault();const btn=$("#submit-quiz");btn.disabled=true;notify("Salvando experiência...");
  try{
   if(!sessionActive)throw new Error("Sessão administrativa não confirmada.");
   const ticket=mutationGate.begin(),payload=draftFromDom(),id=editingId;
   const removed=id===null?[]:removedResultKeys(originalResultKeys,payload.results.map(x=>x.key));
   if(removed.length && !window.confirm("Remover ou renomear os perfis "+removed.join(", ")+
    "? Recomendações e vínculos desses perfis serão apagados.")){
    notify("Alterações não salvas: exclusão de perfil cancelada.");return;
   }
   const saved=id===null?await api.write("POST","/admin/experiences",payload):
    await api.write("PUT","/admin/experiences/"+id,payload);
   if(!sessionActive||!mutationGate.isCurrent(ticket))return;
   resetEditor();
   notify(id===null?"Experiência cadastrada. Revise a disponibilidade e as recomendações.":
    "Experiência atualizada. Recomendações dos perfis mantidos foram preservadas.");
   await refresh();
   $("#recs-experience-id").value=String(saved.id);void loadRecProfiles();
  }catch(error){if(!handleSessionError(error))notify(error?.message||"Não foi possível salvar a experiência.",true);}
  finally{btn.disabled=false;}
 });
 $("#recommendations-form").addEventListener("submit",async e=>{
  e.preventDefault();const btn=$("#save-recommendations");btn.disabled=true;notify("Atualizando recomendações...");
  try{
   if(!sessionActive||!recReady)throw new Error("Escolha a experiência e o perfil antes de salvar.");
   const ticket=mutationGate.begin();
   const form=new FormData(e.currentTarget),request=validateRecommendations({
    experienceId:form.get("experienceId"),resultKey:form.get("resultKey"),ids:form.get("ids")
   });
   await api.write("PUT","/admin/experiences/"+request.experienceId+
     "/results/"+encodeURIComponent(request.resultKey)+"/recommendations",{productIds:request.productIds});
   if(sessionActive&&mutationGate.isCurrent(ticket)){
    const profile=recDetails?.results?.find(x=>x.key===request.resultKey);
    if(String(recDetails?.id)===String(request.experienceId)&&profile)profile.productIds=request.productIds;
    recDirty=false;notify("Recomendações salvas. A API só exibe produtos elegíveis.");
   }
  }catch(error){if(!handleSessionError(error))notify(error?.message||"Não foi possível atualizar recomendações.",true);}
  finally{btn.disabled=false;}
 });
 $("#reload-experiences").addEventListener("click",()=>refresh());
 if(!adminOriginAllowed(location)){notify("Use HTTPS na mesma origem da API.",true);return;}
 api.me().then(user=>{
  if(!user?.authenticated)throw new AdminApiError("Sessão não autenticada.",401);
  sessionActive=true;
  $("#experiences-workspace").hidden=false;
  return refresh();
 }).catch(error=>{
  if(!handleSessionError(error))notify("Não foi possível validar a sessão.",true);
 });
}
if(typeof document!=="undefined")init();
