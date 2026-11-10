import {AdminApi,AdminApiError,adminOriginAllowed} from "./api.js";
import {setupSecurityPanel} from "./security.js";
/** Administrative browser client. Authorization belongs to Spring Security,
 * never to hidden HTML fields, role flags or localStorage.
 */
const api=new AdminApi();
const $=q=>document.querySelector(q),el=(tag,text="",className="")=>{
 const e=document.createElement(tag);e.textContent=String(text??"");if(className)e.className=className;return e;
};
let moduleName="brands",editing=null,recordsPage=0,dirty=false,sessionUser=null;
const formDefs={
 brands:[["name","Nome da marca","text",true]],
 categories:[["name","Nome da categoria","text",true]],
 products:[["name","Nome do produto","text",true],["description","Descrição","textarea"],["price","Preço vigente (R$)","number",true],["brandId","ID da marca","number",true],["categoryIds","IDs de categorias (1,2,3)","text"],["images","Imagens HTTPS (URL|descrição por linha)","textarea"],["published","Publicado","checkbox"],["available","Disponível manualmente","checkbox"]],
 offerings:[["title","Título","text",true],["description","Descrição","textarea"],["type","Tipo de serviço","select",true,["CANDLE","WORKSHOP","RENTAL"]],["price","Preço (vazio = sob consulta)","number"],["imageUrl","URL HTTPS da imagem","text"],["published","Publicado","checkbox"],["available","Disponível","checkbox"]],
 content:[["slug","Identificador","text",true],["title","Título","text",true],["body","Conteúdo","textarea"],["imageUrl","URL HTTPS da imagem","text"],["position","Ordem","number"],["published","Publicado","checkbox"]],
 campaigns:[["title","Título","text",true],["subtitle","Subtítulo","text"],["imageUrl","URL HTTPS da imagem","text"],["linkUrl","Destino","text"],["position","Ordem","number"],["startsAt","Data início","datetime-local"],["endsAt","Data fim","datetime-local"],["published","Publicado","checkbox"]],
 store:[["displayName","Nome público","text",true],["slogan","Slogan","text"],["description","Descrição da loja","textarea"],["whatsapp","WhatsApp DDI+DDD (somente dígitos)","text"],["instagramUrl","Instagram URL","text"],["email","E-mail de contato","email"]]
};
const endMap={brands:"brands",categories:"categories",products:"products",offerings:"offerings",content:"content-sections",campaigns:"campaigns",audit:"audit-events",store:"store"};
function info(message,isError=false){const p=$("#admin-status");p.textContent=message;p.classList.toggle("error",!!isError);}
function toolInfo(message,isError=false){const p=$("#record-tool-status");p.textContent=message;p.classList.toggle("error",!!isError);}
function showLogin(){
 sessionUser=null;editing=null;dirty=false;recordsPage=0;
 $("#admin-workspace").hidden=true;$("#login-panel").hidden=false;
 // The panel is hidden, not destroyed, so clear private records and unsaved form data.
 $("#login-form").reset();
 $("#admin-user").textContent="";
 $("#edit-form").replaceChildren();
 $("#admin-records").replaceChildren();
 $("#record-tool-body").replaceChildren();
 $("#security-password-form")?.reset();
 $("#security-email-form")?.reset();
 const dialog=$("#record-tool-dialog");if(dialog?.open)dialog.close();
}
function showWorkspace(name){sessionUser=name;$("#admin-user").textContent="Sessão: "+name;$("#login-panel").hidden=true;$("#admin-workspace").hidden=false;changeModule(true);}
async function bootstrap(){
 if(!adminOriginAllowed(window.location)){info("Painel exige HTTPS e API sob a mesma origem. Bloqueado neste endereço.",true);$("#login-form").querySelector("button").disabled=true;return;}
 try{await api.refreshCsrf();const user=await api.me();if(user?.authenticated)showWorkspace(user.username);else showLogin();}
 catch{showLogin();}
}
$("#login-form").addEventListener("submit",async event=>{
 event.preventDefault();const btn=event.submitter,username=$("#admin-username").value.trim(),password=$("#admin-password").value;
 btn.disabled=true;info("Autenticando...");
 try{
  const user=await api.login(username,password);$("#admin-password").value="";
  showWorkspace(user.username);info("Acesso confirmado.");
 }catch(error){$("#admin-password").value="";info(error.message,true);}
 finally{btn.disabled=false;}
});
$("#logout").addEventListener("click",async()=>{
 try{await api.logout();showLogin();info("Sessão encerrada.");}
 catch(error){info("Não foi possível confirmar o encerramento. Atualize a página e tente novamente.",true);}
});
function fieldValue(field,values){
 const name=field[0],v=values[name];
 if(name==="brandId")return values.brand?.id??"";
 if(name==="categoryIds")return (values.categories||[]).map(x=>x.id).join(",");
 if(name==="images")return (values.images||[]).map(x=>x.url+"|"+(x.altText||"")).join("\n");
 if(field[2]==="datetime-local"&&v){const d=new Date(v);if(Number.isFinite(d.getTime()))return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);}
 return v??"";
}
function buildForm(values={}){
 const root=$("#edit-form");root.replaceChildren();dirty=false;
 $("#edit-heading").textContent=moduleName==="store"?"Informações da loja":editing===null?"Novo cadastro":"Editar cadastro";
 $("#editor-panel").hidden=moduleName==="audit";
 for(const field of formDefs[moduleName]||[]){
  const [name,label,type="text",required=false,options=[]]=field;
  const wrapper=el("label",label,"field"+(["description","images","body"].includes(name)?" wide":""));
  let input;
  if(type==="textarea"){input=document.createElement("textarea");input.rows=4;}
  else if(type==="select"){input=document.createElement("select");for(const opt of options){const op=el("option",opt);op.value=opt;input.append(op);}}
  else{input=document.createElement("input");input.type=type; if(type==="number"){input.step=name==="position"||name==="brandId"?"1":".01";input.min="0";}}
  input.name=name;input.required=required;
  if(type==="checkbox")input.checked=values[name]===undefined?(moduleName==="offerings"&&name==="available"):Boolean(values[name]);
  else input.value=String(fieldValue(field,values));
  input.addEventListener("input",()=>dirty=true);
  wrapper.append(input);root.append(wrapper);
 }
 $("#reset-form").hidden=moduleName==="store";
 $("#save-button").hidden=moduleName==="audit";
}
function collectForm(){
 const form=$("#edit-form"),data={};
 for(const field of formDefs[moduleName]||[]){
  const [name,,type="text"]=field,input=form.elements[name];
  let v=type==="checkbox"?input.checked:input.value.trim();
  if(type==="number")v=v===""?null:Number(v);
  if(type==="datetime-local")v=v?new Date(v).toISOString():null;
  if(name==="categoryIds")v=v?v.split(",").map(s=>Number(s.trim())).filter(Number.isSafeInteger):[];
  if(name==="whatsapp"&&v==="")v=null;
  if(name==="images")v=v?v.split("\n").map((line,i)=>{const [url, ...rest]=line.split("|");return {url:url.trim(),altText:rest.join("|").trim(),position:i};}).filter(x=>x.url):[];
  if(name==="images"){for(const image of v){if(!image.url.startsWith("https://")&&!image.url.startsWith("/"))throw new Error("Imagens precisam de URLs HTTPS ou relativas seguras.");}}
  if(["imageUrl","linkUrl","instagramUrl"].includes(name)&&v){
   const parsed=new URL(v,location.origin);
   if(parsed.protocol!=="https:"&&!["localhost","127.0.0.1"].includes(parsed.hostname))throw new Error("Use URL HTTPS em "+name);
  }
  data[name]=v;
 }
 if(moduleName==="products"&&(data.price===null||data.price<0||!Number.isSafeInteger(data.brandId)))throw new Error("Preço e ID de marca válidos são obrigatórios.");
 if(moduleName==="offerings"&&data.price===null)delete data.price;
 return data;
}
async function save(event){
 event.preventDefault();const button=$("#save-button");button.disabled=true;
 const endpoint=endMap[moduleName],path=moduleName==="store"?"/admin/store":"/admin/"+endpoint+(editing===null?"":"/"+Number(editing));
 const method=moduleName==="store"||editing!==null?"PUT":"POST";
 try{
  const body=collectForm();await api.write(method,path,body);info("Dados salvos. Revise publicação e disponibilidade.");editing=null;dirty=false;buildForm();recordsPage=0;await loadRecords();
 }catch(error){info(error.message,true);if(error.status===401)showLogin();}
 finally{button.disabled=false;}
}
$("#edit-form").addEventListener("submit",save);
$("#reset-form").addEventListener("click",()=>{
 if(dirty&&!confirm("Descartar alterações não salvas?"))return;
 editing=null;buildForm();
});
$("#admin-module").addEventListener("change",()=>{if(dirty&&!confirm("Descartar alterações não salvas?")){$("#admin-module").value=moduleName;return;}changeModule(true);});
$("#reload-records").addEventListener("click",()=>{recordsPage=0;loadRecords().catch(e=>info(e.message,true));});
$("#admin-more").addEventListener("click",async()=>{recordsPage++;try{await loadRecords();}catch(e){recordsPage--;info(e.message,true);}});
function changeModule(reset=false){
 moduleName=$("#admin-module").value;if(reset)recordsPage=0;editing=null;buildForm();loadRecords().catch(e=>info(e.message,true));
}
function addAction(parent,label,handler){
 const button=el("button",label,"btn btn--secondary");button.type="button";button.addEventListener("click",handler);parent.append(button);return button;
}
async function loadRecords(){
 const endpoint=endMap[moduleName];
 let result,items;
 if(moduleName==="store"){
  result=await api.get("/store");items=[result];buildForm(result);
 }else{
  const suffix=moduleName==="products"?"?page="+recordsPage+"&size=12":moduleName==="audit"?"?page="+recordsPage+"&size=20":"";
  result=await api.get("/admin/"+endpoint+suffix);items=Array.isArray(result)?result:result?.content||[];
 }
 const list=$("#admin-records");if(recordsPage===0)list.replaceChildren();
 if(!items.length&&recordsPage===0)list.append(el("p","Nenhum registro disponível.","muted"));
 $("#admin-more").hidden=!["products","audit"].includes(moduleName)||result?.last!==false;
 for(const item of items){
  const card=el("article","","admin-record"),desc=el("div","","admin-record__info");
  if(moduleName==="audit"){
   desc.append(el("strong",(item.method||"HTTP")+" · "+(item.routePattern||"Rota")+" · "+(item.status??"?")));
   desc.append(el("small",(item.occurredAt?new Date(item.occurredAt).toLocaleString("pt-BR"):"")+" · "+(item.actor||"Administrador")));
   card.append(desc);list.append(card);continue;
  }
  desc.append(el("strong",item.name||item.title||item.displayName||"Registro #"+(item.id||"")));
  desc.append(el("small",item.id?"ID "+item.id+" · "+(item.published===true?"Publicado":item.published===false?"Rascunho":"Cadastro"):"Configuração única"));card.append(desc);
  if(moduleName!=="store"){
   const actions=el("div","","admin-record__actions");
   if(moduleName==="products"){addAction(actions,"Estoque",()=>openTool(item.id,"stock"));addAction(actions,"Promoções",()=>openTool(item.id,"promotions"));}
   if(moduleName==="offerings"&&item.type==="CANDLE")addAction(actions,"Aromas / cores",()=>openTool(item.id,"options"));
   addAction(actions,"Editar",()=>{editing=item.id;buildForm(item);window.scrollTo({top:0,behavior:"smooth"});});
   addAction(actions,"Excluir",async()=>{
    if(!confirm("Confirmar exclusão/arquivamento definitivo deste cadastro?"))return;
    try{await api.write("DELETE","/admin/"+endpoint+"/"+Number(item.id));info("Operação concluída.");recordsPage=0;await loadRecords();}
    catch(error){info(error.message,true);}
   });
   card.append(actions);
  }
  list.append(card);
 }
}
const tool=$("#record-tool-dialog");$("#close-record-tool").addEventListener("click",()=>tool.close());
tool.addEventListener("click",e=>{if(e.target===tool)tool.close();});
function field(parent,name,label,type="text"){
 const wrap=el("label",label,"field"),input=document.createElement("input");
 input.name=name;input.type=type;input.required=true;if(type==="number"){input.min="0";input.step="1";}
 wrap.append(input);parent.append(wrap);return input;
}
async function openTool(id,kind){
 const root=$("#record-tool-body");root.replaceChildren();
 $("#record-tool-heading").textContent=(kind==="stock"?"Movimentação de estoque":kind==="promotions"?"Promoções":"Personalização de velas")+" · #"+id;
 if(!tool.open)tool.showModal();toolInfo("Carregando...");
 try{
  if(kind==="stock"){
   const [balance,history]=await Promise.all([api.get("/admin/products/"+id+"/stock"),api.get("/admin/products/"+id+"/stock/movements?page=0&size=10")]);
   root.append(el("p","Saldo: "+balance.quantity+" · Disponível: "+(balance.available?"Sim":"Não")));
   const form=el("form","","admin-form"),wrap=el("label","Tipo","field"),sel=document.createElement("select");
   sel.name="type";for(const t of ["ENTRY","EXIT","ADJUSTMENT"]){const o=el("option",t);o.value=t;sel.append(o);}wrap.append(sel);form.append(wrap);
   const qty=field(form,"quantity","Quantidade / novo saldo","number");qty.min="0";
   const reason=field(form,"reason","Justificativa");reason.maxLength=500;
   const btn=el("button","Registrar movimentação","btn btn--primary");btn.type="submit";form.append(btn);
   form.addEventListener("submit",async e=>{e.preventDefault();btn.disabled=true;try{const amount=Number(qty.value);if(!Number.isSafeInteger(amount)||amount<0||(sel.value!=="ADJUSTMENT"&&amount===0))throw new Error("Quantidade inválida.");await api.write("POST","/admin/products/"+id+"/stock/movements",{type:sel.value,quantity:amount,reason:reason.value.trim()});await openTool(id,kind);toolInfo("Movimentação registrada.");}catch(e){toolInfo(e.message,true);}finally{btn.disabled=false;}});
   root.append(form,el("h3","Últimas movimentações"));
   for(const h of history.content||[]){root.append(el("p",(h.createdAt||"")+" · "+h.type+" "+h.quantity+" · saldo "+h.resultingQuantity+" · "+(h.reason||""),"tool-entry"));}
  }else if(kind==="promotions"){
   const all=await api.get("/admin/products/"+id+"/promotions");
   for(const p of all){const row=el("div","","tool-entry");row.append(el("p","Promoção #"+p.id+" · R$ "+p.promotionalPrice+" · "+p.startsAt+" até "+p.endsAt));addAction(row,"Excluir",async()=>{if(!confirm("Excluir promoção?"))return;try{await api.write("DELETE","/admin/products/"+id+"/promotions/"+p.id);await openTool(id,kind);}catch(e){toolInfo(e.message,true);}});root.append(row);}
   const form=el("form","","admin-form"),value=field(form,"promotionalPrice","Preço promocional","number"),start=field(form,"startsAt","Início","datetime-local"),end=field(form,"endsAt","Fim","datetime-local");value.step=".01";
   const button=el("button","Criar promoção","btn btn--primary");button.type="submit";form.append(button);
   form.addEventListener("submit",async e=>{e.preventDefault();button.disabled=true;try{const begins=new Date(start.value),ends=new Date(end.value),amount=Number(value.value);if(!Number.isFinite(begins.valueOf())||!Number.isFinite(ends.valueOf())||begins>=ends||amount<=0)throw new Error("Datas ou preço inválidos.");await api.write("POST","/admin/products/"+id+"/promotions",{promotionalPrice:amount,startsAt:begins.toISOString(),endsAt:ends.toISOString()});await openTool(id,kind);toolInfo("Promoção registrada.");}catch(e){toolInfo(e.message,true);}finally{button.disabled=false;}});
   root.append(form);
  }else{
   const offering=await api.get("/admin/offerings/"+id),form=el("form","","admin-form"),editors={};
   root.append(el("p","Uma opção por linha; prefixe com ! para desativar. Salvar substitui todas as opções do modelo."));
   for(const kind of ["AROMA","COLOR","PACKAGING"]){
    const wrap=el("label",kind,"field wide"),area=document.createElement("textarea");area.rows=4;area.value=(offering.options||[]).filter(o=>o.kind===kind).map(o=>(o.active?"":"!")+o.label).join("\n");wrap.append(area);form.append(wrap);editors[kind]=area;
   }
   const btn=el("button","Salvar opções","btn btn--primary");btn.type="submit";form.append(btn);
   form.addEventListener("submit",async e=>{e.preventDefault();btn.disabled=true;try{const options=[];for(const [kind,area] of Object.entries(editors)){for(const raw of area.value.split("\n").map(x=>x.trim()).filter(Boolean)){const active=!raw.startsWith("!"),label=(active?raw:raw.slice(1)).trim();if(!label||label.length>120)throw new Error("Rótulo inválido.");options.push({kind,label,position:options.length,active});}}if(options.length>48)throw new Error("Limite de 48 opções.");await api.write("PUT","/admin/offerings/"+id+"/options",{options});await openTool(id,kind);toolInfo("Personalizações atualizadas.");}catch(e){toolInfo(e.message,true);}finally{btn.disabled=false;}});
   root.append(form);
  }
  toolInfo("");
 }catch(error){toolInfo(error.message,true);}
}
setupSecurityPanel(api,{
 onPasswordChanged:()=>{showLogin();info("Credenciais alteradas. Faça login novamente.");},
 onSessionExpired:()=>{showLogin();info("Sessão encerrada. Faça login novamente.",true);}
});
bootstrap();
