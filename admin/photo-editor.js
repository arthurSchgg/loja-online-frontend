/** Owner photo editor. Files are normalized on-device; the server independently validates them. */
export const managedPhoto=raw=>typeof raw==="string"&&/^\/api\/v1\/media\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(raw);
const bundledPhoto=raw=>/^assets\/images\/catalogo\/[a-z0-9-]+\/[a-z0-9-]+\.webp$/.test(raw);
export function photoReference(raw){
 if(typeof raw!=="string"||!raw||raw.length>2048)return false;
 if(managedPhoto(raw)||bundledPhoto(raw))return true;
 try{
  const u=new URL(raw);
  return u.protocol==="https:"&&!!u.hostname&&!u.username&&!u.password&&!u.port&&!u.hash&&!u.pathname.startsWith("/api/v1/media/");
 }catch{return false;}
}
export function photoPreview(raw,storefront=globalThis.location?.origin){
 if(!photoReference(raw))return null;
 if(managedPhoto(raw))return raw.replace("/api/v1/media/","/api/v1/admin/media/");
 if(bundledPhoto(raw))return new URL(raw,new URL("/",storefront)).href;
 return new URL(raw).href;
}
export function parsePhotoLines(value){
 return String(value??"").split("\n").map(line=>{
  const [url,...alt]=line.split("|");
  return {url:url.trim(),altText:alt.join("|").trim()};
 }).filter(item=>item.url).map((item,position)=>({...item,position}));
}
export const serializePhotos=items=>items.map(item=>item.url+"|"+String(item.altText??"").replace(/[\r\n]/g," ")).join("\n");
const element=(tag,label="",className="")=>{
 const e=document.createElement(tag);e.textContent=label;if(className)e.className=className;return e;
};
export function action(label,handler,cls="btn btn--secondary"){
 const b=element("button",label,cls);b.type="button";b.addEventListener("click",handler);return b;
}
export function storefrontOrigin(){
 return document.querySelector(".admin-heading a")?.href||location.origin;
}
export function previewImage(url,alt="Foto cadastrada"){
 const img=element("img");const src=photoPreview(url,storefrontOrigin());
 if(src)img.src=src;img.alt=alt;img.loading="lazy";img.decoding="async";
 img.referrerPolicy="no-referrer";return img;
}
function canvasBlob(canvas,type,quality){
 return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error("Não foi possível preparar a foto.")),type,quality));
}
export async function preparePhoto(file){
 if(!file||file.size<1||file.size>25*1024*1024)throw new Error("Selecione uma foto de até 25 MB.");
 // Browser's raster decoder also handles camera HEIC when supported by the device.
 // SVG is never accepted as a photo, even if the browser could draw it.
 if((!file.type.startsWith("image/")&&!(file.type===""&&/\.(?:jpe?g|png|webp|heic|heif)$/i.test(file.name||"")))||["image/svg+xml","image/gif"].includes(file.type))
  throw new Error("Selecione uma foto JPG, PNG, WebP ou uma foto da câmera compatível.");
 const objectUrl=URL.createObjectURL(file),image=new Image();
 try{
  await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(new Error("Formato não compatível. Tente salvar a foto como JPEG ou PNG."));image.src=objectUrl;});
  const {naturalWidth:w,naturalHeight:h}=image;
  if(!w||!h||w*h>80_000_000)throw new Error("Foto grande demais. Escolha uma versão menor.");
  const type=["image/png","image/webp"].includes(file.type)?"image/png":"image/jpeg";
  let side=Math.min(1600,Math.max(w,h));
  const canvas=document.createElement("canvas");
  while(true){
   const ratio=Math.min(1,side/Math.max(w,h));
   canvas.width=Math.max(1,Math.round(w*ratio));canvas.height=Math.max(1,Math.round(h*ratio));
   const ctx=canvas.getContext("2d");
   if(!ctx)throw new Error("A câmera não pôde ser processada neste navegador.");
   if(type==="image/jpeg"){ctx.fillStyle="#fff";ctx.fillRect(0,0,canvas.width,canvas.height);}
   ctx.drawImage(image,0,0,canvas.width,canvas.height);
   const blob=await canvasBlob(canvas,type,.84);
   if(blob.size<=768*1024){canvas.width=1;canvas.height=1;return blob;}
   if(side<=256)throw new Error("Escolha uma foto mais leve.");
   side=Math.max(256,Math.floor(side*.75));
  }
 }finally{URL.revokeObjectURL(objectUrl);}
}
export async function uploadPhoto(api,file){
 const data=await api.uploadPhoto(await preparePhoto(file));
 if(!managedPhoto(data?.url))throw new Error("Foto enviada, mas a resposta não pôde ser confirmada. Consulte a biblioteca.");
 return data;
}
/** A named textarea keeps the nonsecret draft compatible with session recovery. */
export function createPhotoEditor({api,name,value="",limit=12,single=false,onChange,onBusy,onError}){
 const root=element("fieldset","","photo-editor wide"),legend=element("legend",single?"Foto":"Fotos e galeria");
 const backing=document.createElement("textarea");backing.name=name;backing.hidden=true;backing.value=String(value||"");
 const note=element("p",single?"Envie ou escolha a imagem usada na vitrine.":"Adicione até "+limit+" fotos. A primeira será a capa.","admin-note");
 const tools=element("div","","photo-tools"),picker=document.createElement("input");
 picker.type="file";picker.accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/*";picker.multiple=!single;picker.hidden=true;
 const upload=action(single?"Enviar foto":"Adicionar fotos",()=>picker.click(),"btn btn--primary");
 const library=action("Escolher da biblioteca",()=>void showLibrary());
 const feedback=element("p","","photo-feedback");feedback.setAttribute("role","status");
 const cards=element("div","","photo-cards"),choices=element("div","","photo-library");choices.hidden=true;
 const details=element("details","","photo-address"),summary=element("summary","Usar endereço de imagem (opcional)"),url=document.createElement("input");
 url.type="text";url.placeholder="https://...";url.setAttribute("aria-label","Endereço de imagem HTTPS");details.append(summary,url);
 let busy=false;
 const items=()=>single?(backing.value.trim()?[{url:backing.value.trim(),altText:""}]:[]):parsePhotoLines(backing.value);
 const set=value=>{
  backing.value=single?value[0]?.url||"":serializePhotos(value);
  backing.dispatchEvent(new Event("input",{bubbles:true}));
 };
 const add=item=>{
  if(!photoReference(item.url))throw new Error("Endereço de imagem inválido.");
  const next=items();
  if(single){set([item]);return;}
  if(next.some(photo=>photo.url===item.url))return;
  if(next.length>=limit)throw new Error("Limite de "+limit+" fotos atingido.");
  set([...next,item]);
 };
 const fail=error=>{
  feedback.textContent=error?.message||"Não foi possível carregar as fotos.";
  onError?.(error);
 };
 function render(){
  const current=items();cards.replaceChildren();
  upload.disabled=busy||(!single&&current.length>=limit);
  for(const [index,item] of current.entries()){
   const row=element("div","","photo-row"),visual=previewImage(item.url,"Prévia "+(index+1)),content=element("div","","photo-row-content");
   content.append(element("strong",single?"Foto atual":index===0?"Foto "+(index+1)+" · Capa":"Foto "+(index+1)));
   if(!single){
    const alt=document.createElement("input");alt.type="text";alt.value=item.altText;alt.maxLength=180;
    alt.placeholder="Descrição da foto (opcional)";alt.setAttribute("aria-label","Descrição da foto "+(index+1));
    alt.addEventListener("change",()=>{const next=items();if(next[index]?.url===item.url){next[index].altText=alt.value;set(next);}});
    content.append(alt);
   }
   const controls=element("div","","photo-tools");
   if(index>0)controls.append(action("Subir",()=>{const next=items();[next[index-1],next[index]]=[next[index],next[index-1]];set(next);}));
   if(index<current.length-1)controls.append(action("Descer",()=>{const next=items();[next[index+1],next[index]]=[next[index],next[index+1]];set(next);}));
   controls.append(action("Remover do cadastro",()=>{if(confirm("Retirar esta foto do cadastro? A foto enviada continuará na biblioteca."))set(items().filter(x=>x.url!==item.url));},"btn btn--ghost"));
   content.append(controls);row.append(visual,content);cards.append(row);
  }
  if(!current.length)cards.append(element("p","Nenhuma foto selecionada.","admin-note"));
 }
 function setBusy(state){
  busy=state;root.dataset.uploading=state?"true":"false";
  library.disabled=state;picker.disabled=state;
  if(root.isConnected)onBusy?.(state);
  render();
 }
 async function showLibrary(page=0){
  choices.hidden=false;choices.replaceChildren(element("p","Carregando fotos...","admin-note"));
  try{
   const response=await api.get("/admin/media?page="+page+"&size=24");
   if(!root.isConnected)return;
   const grid=element("div","","photo-choice-grid");
   for(const item of response.content||[]){
    const b=action("Usar foto",()=>{try{add(item);choices.hidden=true;feedback.textContent="Foto selecionada.";}catch(error){fail(error);}});
    const box=element("div","","photo-choice");box.append(previewImage(item.url),b);grid.append(box);
   }
   choices.replaceChildren(action("Fechar biblioteca",()=>{choices.hidden=true;},"btn btn--ghost"),grid);
   if(!response.content?.length)choices.append(element("p","Nenhuma foto disponível. Envie uma foto primeiro.","admin-note"));
   if(page>0)choices.append(action("Anterior",()=>void showLibrary(page-1)));
   if(!response.last)choices.append(action("Próxima",()=>void showLibrary(page+1)));
  }catch(error){if(root.isConnected)fail(error);}
 }
 picker.addEventListener("change",async()=>{
  const files=Array.from(picker.files||[]);picker.value="";
  if(!files.length||busy)return;
  if(!single&&files.length+items().length>limit){fail(new Error("Selecione no máximo "+(limit-items().length)+" fotos adicionais."));return;}
  setBusy(true);
  try{
   for(const [i,file] of files.entries()){
    feedback.textContent="Preparando e enviando foto "+(i+1)+" de "+files.length+"...";
    const info=await uploadPhoto(api,file);
    if(!root.isConnected)return;
    add(info);
   }
   feedback.textContent="Foto(s) adicionada(s). Salve o cadastro para publicar as mudanças.";
  }catch(error){if(root.isConnected)fail(error);}
  finally{setBusy(false);}
 });
 details.append(action("Adicionar endereço",()=>{try{add({url:url.value.trim(),altText:""});url.value="";}catch(error){fail(error);}}));
 backing.addEventListener("input",()=>{render();onChange?.();});
 tools.append(upload,library,picker);root.append(legend,note,backing,tools,feedback,cards,choices,details);render();
 return root;
}
