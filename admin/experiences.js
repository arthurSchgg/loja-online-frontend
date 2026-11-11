import {AdminApi,AdminApiError,adminOriginAllowed} from "./api.js";
import {createRequestGuard} from "./request-guard.js";

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
 const parts=String(ids||"").split(",").map(x=>x.trim()).filter(Boolean);
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
 $("#experiences-workspace").hidden=true;
 $("#available-experiences").replaceChildren();
 $("#recs-experience-id").value="";
 $("#recs-result-key").value="";
 $("#recommendations-form").reset();
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
 '<label class="field">Chave única (ex.: floral)<input name="key" maxlength="80" pattern="[a-z0-9][a-z0-9_-]*" required></label>'+
 '<label class="field">Título<input name="title" maxlength="180" required></label>'+
 '<label class="field">Descrição<textarea name="description" maxlength="2000" rows="2"></textarea></label>'+
 '<button type="button" class="btn btn--ghost" data-remove-row>Remover perfil</button>';
 return el;
}
function optionRow(){
 const el=document.createElement("div");el.dataset.optionRow="";el.className="experience-option";
 el.innerHTML='<label class="field">Alternativa<input name="label" maxlength="300" required></label>'+
 '<label class="field">Chave do perfil<input name="resultKey" maxlength="80" required></label>'+
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
   item.querySelector('[name="resultKey"]').value=option.resultKey;
   options.append(item);
  }
  $("#quiz-questions").append(row);
 }
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
 if(!Array.isArray(entries)||!entries.length){list.textContent="Nenhuma experiência cadastrada.";return;}
 for(const item of entries){
  const article=document.createElement("article");article.className="experience-card";
  const heading=document.createElement("h3");heading.textContent=item.title||"Experiência";
  const sub=document.createElement("p");sub.textContent="ID "+item.id+" · "+(item.questions||[]).length+" perguntas";
  const button=document.createElement("button");button.type="button";button.className="btn btn--secondary";
  button.textContent="Usar ID nas recomendações";
  button.addEventListener("click",()=>{$("#recs-experience-id").value=String(item.id);$("#recs-result-key").focus();});
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
function init() {
 $("#add-result").addEventListener("click",()=>$("#quiz-results").append(resultRow()));
 $("#add-question").addEventListener("click",()=>$("#quiz-questions").append(questionRow()));
 $("#quiz-editor").addEventListener("click",e=>{
  const add=e.target.closest("[data-add-option]");
  if(add){add.closest("[data-question-row]").querySelector("[data-options]").append(optionRow());return;}
  const remove=e.target.closest("[data-remove-row]");
  if(remove)remove.closest("[data-option-row], [data-result-row], [data-question-row]")?.remove();
 });
 $("#quiz-results").append(resultRow());$("#quiz-questions").append(questionRow());
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
   $("#recs-experience-id").value=String(saved.id);$("#recs-result-key").value=payload.results[0]?.key||"";
   if(!sessionActive||!mutationGate.isCurrent(ticket))return;
   resetEditor();
   notify(id===null?"Experiência cadastrada. Revise a disponibilidade e as recomendações.":
    "Experiência atualizada. Recomendações dos perfis mantidos foram preservadas.");
   await refresh();
  }catch(error){if(!handleSessionError(error))notify(error?.message||"Não foi possível salvar a experiência.",true);}
  finally{btn.disabled=false;}
 });
 $("#recommendations-form").addEventListener("submit",async e=>{
  e.preventDefault();const btn=$("#save-recommendations");btn.disabled=true;notify("Atualizando recomendações...");
  try{
   if(!sessionActive)throw new Error("Sessão administrativa não confirmada.");
   const ticket=mutationGate.begin();
   const form=new FormData(e.currentTarget),request=validateRecommendations({
    experienceId:form.get("experienceId"),resultKey:form.get("resultKey"),ids:form.get("ids")
   });
   await api.write("PUT","/admin/experiences/"+request.experienceId+
     "/results/"+encodeURIComponent(request.resultKey)+"/recommendations",{productIds:request.productIds});
   if(sessionActive&&mutationGate.isCurrent(ticket))notify("Recomendações salvas. A API só exibe produtos elegíveis.");
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
