import {AdminApi,AdminApiError,adminOriginAllowed} from "./api.js";

/** The backend's list DTO intentionally omits result keys and edit metadata.
 * Never reconstruct a PUT from that incomplete DTO: it could erase data.
 */
export function validateExperienceDraft(draft) {
 if(!draft||typeof draft!=="object")throw new Error("Quiz inválido.");
 const title=String(draft.title||"").trim(),description=String(draft.description||"").trim();
 if(!title||title.length>180||description.length>2000)throw new Error("Confira título e descrição.");
 if(!Array.isArray(draft.results)||!draft.results.length||draft.results.length>20)throw new Error("Cadastre de 1 a 20 perfis.");
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
 if(!Array.isArray(draft.questions)||!draft.questions.length||draft.questions.length>20)
  throw new Error("Cadastre de 1 a 20 perguntas.");
 const questions=draft.questions.map((q,position)=>{
  const heading=String(q.title||"").trim();
  if(!heading||heading.length>350||!Array.isArray(q.options)||q.options.length<2||q.options.length>8)
   throw new Error("Cada pergunta precisa de título e 2 a 8 alternativas.");
  const options=q.options.map((o,index)=>{
   const label=String(o.label||"").trim(),resultKey=String(o.resultKey||"").trim();
   if(!label||label.length>300||!keys.has(resultKey))
    throw new Error("Cada alternativa precisa ter texto e indicar um perfil cadastrado.");
   return {label,resultKey,position:index};
  });
  return {title:heading,position,options};
 });
 return {title,description,published:draft.published===true,questions,results};
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
function notify(message,error=false){
 const el=$("#experiences-status");if(el){el.textContent=message;el.classList.toggle("error",error);}
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
async function refresh(){
 const list=$("#available-experiences");list.replaceChildren();
 const entries=await api.get("/admin/experiences");
 if(!Array.isArray(entries)||!entries.length){list.textContent="Nenhuma experiência cadastrada.";return;}
 for(const item of entries){
  const article=document.createElement("article");article.className="experience-card";
  const heading=document.createElement("h3");heading.textContent=item.title||"Experiência";
  const sub=document.createElement("p");sub.textContent="ID "+item.id+" · "+(item.questions||[]).length+" perguntas";
  const button=document.createElement("button");button.type="button";button.className="btn btn--secondary";
  button.textContent="Usar ID nas recomendações";
  button.addEventListener("click",()=>{$("#recs-experience-id").value=String(item.id);$("#recs-result-key").focus();});
  article.append(heading,sub,button);list.append(article);
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
 $("#quiz-editor").addEventListener("submit",async e=>{
  e.preventDefault();const btn=$("#submit-quiz");btn.disabled=true;notify("Salvando experiência...");
  try{
   const payload=draftFromDom(),created=await api.write("POST","/admin/experiences",payload);
   $("#recs-experience-id").value=String(created.id);$("#recs-result-key").value=payload.results[0].key;
   $("#quiz-editor").reset();$("#quiz-results").replaceChildren(resultRow());$("#quiz-questions").replaceChildren(questionRow());
   notify("Experiência cadastrada. Revise a disponibilidade e as recomendações.");
   await refresh();
  }catch(error){notify(error?.message||"Não foi possível salvar a experiência.",true);}
  finally{btn.disabled=false;}
 });
 $("#recommendations-form").addEventListener("submit",async e=>{
  e.preventDefault();const btn=$("#save-recommendations");btn.disabled=true;notify("Atualizando recomendações...");
  try{
   const form=new FormData(e.currentTarget),request=validateRecommendations({
    experienceId:form.get("experienceId"),resultKey:form.get("resultKey"),ids:form.get("ids")
   });
   await api.write("PUT","/admin/experiences/"+request.experienceId+
     "/results/"+encodeURIComponent(request.resultKey)+"/recommendations",{productIds:request.productIds});
   notify("Recomendações salvas. A API só exibe produtos elegíveis.");
  }catch(error){notify(error?.message||"Não foi possível atualizar recomendações.",true);}
  finally{btn.disabled=false;}
 });
 $("#reload-experiences").addEventListener("click",()=>refresh().catch(e=>notify(e.message,true)));
 if(!adminOriginAllowed(location)){notify("Use HTTPS na mesma origem da API.",true);return;}
 api.me().then(()=>{$("#experiences-workspace").hidden=false;return refresh();}).catch(error=>{
  notify(error instanceof AdminApiError&&error.status===401?
    "Faça login no painel administrativo antes de continuar.":"Não foi possível validar a sessão.",true);
 });
}
if(typeof document!=="undefined")init();
