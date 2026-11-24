/** Same-origin admin client. Session cookie stays HttpOnly; CSRF stays in memory.
 * NO localStorage/sessionStorage for credentials or tokens.
 */
export class AdminApiError extends Error{
 constructor(message,status=0){super(message);this.name="AdminApiError";this.status=status;}
}
export function adminOriginAllowed(locationInfo=globalThis.location){
 if(!locationInfo)return false;
 const host=String(locationInfo.hostname||"").toLowerCase();
 return String(locationInfo.protocol)==="https:"||(["localhost","127.0.0.1"].includes(host)&&String(locationInfo.protocol)==="http:");
}
/** Restrict admin client paths to explicit same-origin API routes.
 * This is defense in depth; Spring Security remains the authority.
 */
export function validateAdminPath(path){
 const pathname=typeof path==="string"?path.split("?")[0]:"";
 if(typeof path!=="string"||
    !/^\/(?:auth|admin|store)(?:\/[A-Za-z0-9._~%+-]+)*(?:\?[A-Za-z0-9_.~%=&,+*-]*)?$/.test(path)||
    pathname.includes("..")||pathname.includes("//")||/%(?:2e|2f|5c|00)/i.test(pathname))
  throw new AdminApiError("Caminho de API inválido.");
 return path;
}
export class AdminApi{
 #csrf=null;
 constructor(fetchImpl){this.fetchImpl=fetchImpl??globalThis.fetch.bind(globalThis);}
 async #fetch(path,{method="GET",body,csrf=false}={}){
  validateAdminPath(path);
  if(typeof globalThis.location!=="undefined"&&!adminOriginAllowed(globalThis.location))
   throw new AdminApiError("Painel exige HTTPS na mesma origem da API.");
  const headers={Accept:"application/json"};
  if(csrf){if(!this.#csrf)await this.refreshCsrf();headers[this.#csrf.headerName]=this.#csrf.token;}
  let requestBody;
  if(body instanceof URLSearchParams){requestBody=body;headers["Content-Type"]="application/x-www-form-urlencoded";}
  else if(typeof FormData!=="undefined"&&body instanceof FormData){requestBody=body;}
  else if(body!==undefined){requestBody=JSON.stringify(body);headers["Content-Type"]="application/json";}
  let response;
  const deadline=new AbortController();
  const timer=setTimeout(()=>deadline.abort(),25000);
  try{response=await this.fetchImpl("/api/v1"+path,{method,headers,body:requestBody,
    signal:deadline.signal,credentials:"same-origin",cache:"no-store",redirect:"error",referrerPolicy:"same-origin"});}
  catch{
   if(method!=="GET")throw new AdminApiError("Não foi possível confirmar a operação. Recarregue os dados antes de repetir uma gravação.");
   throw new AdminApiError("Servidor indisponível. Tente novamente.");
  }
  finally{clearTimeout(timer);}
  if(!response.ok){
   if(response.status===401)this.#csrf=null;
   const map={400:"Confira os dados.",401:"Sessão expirada ou credenciais inválidas.",403:"Ação não autorizada ou CSRF inválido.",404:"Recurso não encontrado.",409:"Não foi possível salvar. Confira os vínculos e os dados informados.",413:"Foto grande demais; selecione uma imagem menor.",429:"Muitas tentativas; tente mais tarde."};
   if(response.status===409&&path.startsWith("/admin/media"))map[409]=method==="DELETE"?"A foto continua vinculada a um cadastro. Retire o vínculo antes de excluí-la.":"Não foi possível guardar a foto. Confira o formato e o espaço na biblioteca.";
   throw new AdminApiError(map[response.status]||"Não foi possível concluir a operação.",response.status);
  }
  if(response.status===204)return null;
  try{return await response.json();}catch{throw new AdminApiError("Resposta inválida do servidor.",response.status);}
 }
 async refreshCsrf(){
  const data=await this.#fetch("/auth/csrf");
  if(data?.headerName!=="X-CSRF-TOKEN"||typeof data.token!=="string"||!data.token||data.token.length>4096)
   throw new AdminApiError("Falha na proteção CSRF");
  this.#csrf={headerName:data.headerName,token:data.token};return data;
 }
 async me(){return this.#fetch("/auth/me");}
 async login(username,password,otp=""){
  if(!username||!password)throw new AdminApiError("Informe usuário e senha.");
  await this.refreshCsrf();
  await this.#fetch("/auth/login",{method:"POST",body:new URLSearchParams({username,password,otp}),csrf:true});
  // Spring session fixation rotates the session ID; always refresh CSRF afterwards.
  this.#csrf=null;await this.refreshCsrf();
  return this.me();
 }
 async logout(){
  try{await this.refreshCsrf();return await this.#fetch("/auth/logout",{method:"POST",csrf:true});}
  finally{this.#csrf=null;}
 }
 async postAuth(path,payload){
  const publicFlows=["/auth/password-reset/request","/auth/password-reset/confirm","/auth/email-change/confirm"];
  if(!publicFlows.includes(path))throw new AdminApiError("Ação de recuperação não permitida.");
  await this.refreshCsrf();
  return this.#fetch(path,{method:"POST",body:payload,csrf:true});
 }
 async get(path){return this.#fetch(path);}
 async uploadPhoto(blob){
  const body=new FormData();
  body.append("file",blob,blob.type==="image/png"?"foto.png":"foto.jpg");
  return this.write("POST","/admin/media",body);
 }
 async write(method,path,payload){
  if(!["POST","PUT","PATCH","DELETE"].includes(method)||!path.startsWith("/admin/"))throw new AdminApiError("Rota de escrita não autorizada.");
  await this.refreshCsrf();
  return this.#fetch(path,{method,body:payload,csrf:true});
 }
}
