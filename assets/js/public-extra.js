import {isLive} from "./config.js";
import {fetchStore,fetchExperiences,fetchExperience,evaluateExperience} from "./api.js";
import {officialStoreLinks} from "./official-contact.js";
const el=id=>document.getElementById(id);
function message(id,text){const node=el(id);if(node)node.textContent=text;}
function validId(raw){const n=Number(raw);return Number.isSafeInteger(n)&&n>0?n:null;}
function tag(name,content,className){const node=document.createElement(name);node.textContent=String(content??"");if(className)node.className=className;return node;}
function button(label,action){const b=tag("button",label,"btn btn--secondary");b.type="button";b.addEventListener("click",action);return b;}
function contactEmpty(links,details,{unavailable=false}={}){
 links.replaceChildren();
 const card=document.createElement("div");
 card.className="contact-empty";
 card.append(
  tag("h3",unavailable?"Canais temporariamente indisponíveis":"Canais em atualização"),
  tag("p",unavailable?
    "Não foi possível consultar os canais oficiais agora. Nenhum contato não confirmado será exibido.":
    "Os contatos oficiais aparecerão aqui assim que forem confirmados pela loja.")
 );
 if(unavailable)card.append(button("Tentar novamente",()=>void initContact()));
 const catalog=tag("a","Explorar o catálogo","text-link");
 catalog.href="catalogo.html";card.append(catalog);
 links.append(card);
 if(!details.children.length){
  const row=document.createElement("div");
  row.append(tag("dt","Atendimento"),
   tag("dd","Horários, localização e canais serão exibidos quando estiverem confirmados."));
  details.append(row);
 }
}
function contactIcon(){
 const ns="http://www.w3.org/2000/svg";
 const svg=document.createElementNS(ns,"svg");
 svg.setAttribute("viewBox","0 0 24 24");
 svg.setAttribute("fill","none");
 svg.setAttribute("aria-hidden","true");
 svg.setAttribute("focusable","false");
 const path=document.createElementNS(ns,"path");
 path.setAttribute("d","M5 19 19 5M8 5h11v11");
 path.setAttribute("stroke","currentColor");
 path.setAttribute("stroke-width","1.6");
 path.setAttribute("stroke-linecap","round");
 path.setAttribute("stroke-linejoin","round");
 svg.append(path);return svg;
}
async function initContact(){
 const links=el("contact-links"),details=el("contact-info");
 if(!links||!details)return;
 links.replaceChildren();details.replaceChildren();message("contact-status","Consultando os canais oficiais...");
 if(!isLive){message("contact-status","Esta é uma prévia. Os contatos reais estarão disponíveis após publicação pela loja.");links.append(tag("p","Nenhum contato demonstrativo é exibido."));return;}
 try{
  const store=await fetchStore();const channels=officialStoreLinks(store);
  message("contact-status","");
  if(!channels.length)contactEmpty(links,details);
  for(const channel of channels){
   const a=tag("a",channel.label,"contact-channel");
   a.append(contactIcon());
   a.href=channel.href;
   if(channel.external){a.target="_blank";a.rel="noopener noreferrer";}
   links.append(a);
  }
  // The empty-contact card may have inserted a placeholder; real published details win.
  details.replaceChildren();
  const fields=[["Horários",store.openingHours],["Localização",store.address],["Região de atendimento",store.region]];
  for(const [label,value] of fields){
   if(typeof value!=="string"||!value.trim())continue;
   const row=document.createElement("div");row.append(tag("dt",label),tag("dd",value.trim()));details.append(row);
  }
  if(!details.children.length){const row=document.createElement("div");row.append(tag("dt","Informações adicionais"),tag("dd","Horários e localização ainda não informados."));details.append(row);}
 }catch{message("contact-status","");contactEmpty(links,details,{unavailable:true});}
}
async function initExperiences(){
 const selection=el("experience-selection"),form=el("experience-form"),questions=el("experience-questions"),result=el("experience-result");
 if(!selection||!form||!questions||!result)return;
 if(!isLive){message("experience-status","Prévia demonstrativa: experiências oficiais aparecerão quando a loja publicar os dados.");return;}
 const reset=()=>{form.hidden=true;result.hidden=true;selection.hidden=false;questions.replaceChildren();result.replaceChildren();};
 el("experience-back").addEventListener("click",reset);
 message("experience-status","Buscando experiências publicadas...");
 try{
  const items=await fetchExperiences();
  if(!Array.isArray(items))throw new Error("Resposta inesperada");
  selection.replaceChildren();message("experience-status",items.length?"Selecione uma experiência para começar.":"Nenhuma experiência publicada no momento.");
  let chosen=null;
  for(const item of items){
   const id=validId(item?.id);if(!id)continue;
   const card=document.createElement("article");card.className="experience-card";card.dataset.reveal="";
   card.append(tag("span","EXPERIÊNCIA","eyebrow"),tag("h3",item.title||item.name||"Descoberta"),tag("p",item.description||"Descubra um perfil especial."));
   card.append(button("Começar ↗",async()=>{
    message("experience-status","Carregando perguntas...");
    try{
     const full=await fetchExperience(id);
     if(!Array.isArray(full?.questions)||!full.questions.length)throw new Error("Sem perguntas publicadas.");
     chosen=full;questions.replaceChildren();result.hidden=true;result.replaceChildren();
     el("experience-title").textContent=String(full.title||full.name||"Sua experiência");
     el("experience-description").textContent=String(full.description||"Responda às questões para conhecer seu resultado.");
     for(const question of full.questions){
      const qId=validId(question?.id);if(!qId||!Array.isArray(question.options))continue;
      const fieldset=document.createElement("fieldset");fieldset.append(tag("legend",question.title||"Escolha uma opção"));
      for(const option of question.options){
       const oId=validId(option?.id);if(!oId)continue;
       const label=document.createElement("label");label.className="quiz-choice";
       const input=document.createElement("input");input.type="radio";input.name="q-"+qId;input.value=String(oId);input.required=true;
       label.append(input,document.createTextNode(" "+String(option.label||"Opção")));fieldset.append(label);
      }
      if(fieldset.querySelector("input"))questions.append(fieldset);
     }
     if(!questions.children.length)throw new Error("Não há opções válidas.");
     form.hidden=false;selection.hidden=true;message("experience-status","");
     form.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth",block:"start"});
    }catch{message("experience-status","Não foi possível carregar esta experiência. Escolha outra ou tente novamente.");}
   }));
   selection.append(card);
  }
  if(!selection.children.length)message("experience-status","Nenhuma experiência disponível.");
  form.addEventListener("submit",async event=>{
   event.preventDefault();if(!chosen)return;
   const submit=form.querySelector('[type="submit"]');submit.disabled=true;
   message("experience-status","Consultando o resultado...");
   try{
    const data=new FormData(form);
    const answers=chosen.questions.map(q=>({questionId:validId(q.id),optionId:validId(data.get("q-"+q.id))}));
    if(answers.some(a=>!a.questionId||!a.optionId))throw new Error("Responda todas as perguntas.");
    const evaluation=await evaluateExperience(chosen.id,answers);
    result.replaceChildren();result.append(tag("span","SEU RESULTADO","eyebrow"),tag("h3",evaluation.title||evaluation.key||"Seu perfil"));
    if(evaluation.description)result.append(tag("p",evaluation.description));
    if(Array.isArray(evaluation.recommendations)&&evaluation.recommendations.length){
     result.append(tag("h4","Sugestões da loja"));
     const list=document.createElement("ul");
     for(const product of evaluation.recommendations){
      const li=document.createElement("li"),id=validId(product.id);
      if(id){const a=tag("a",product.name||"Ver produto");a.href="produto.html?productId="+id;li.append(a);}
      else li.textContent=String(product.name||"Produto recomendado");
      list.append(li);
     }result.append(list);
    }
    result.hidden=false;message("experience-status","Resultado disponível abaixo.");
    result.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth",block:"nearest"});
   }catch(e){message("experience-status",e.message||"Não foi possível avaliar suas respostas.");}
   finally{submit.disabled=false;}
  });
 }catch{message("experience-status","Experiências indisponíveis no momento.");selection.append(button("Tentar novamente",()=>{selection.replaceChildren();initExperiences();}));}
}
if(typeof document!=="undefined"){void initContact();void initExperiences();}
