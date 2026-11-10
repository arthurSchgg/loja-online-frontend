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
export class AdminApi{
 #csrf=null;
 constructor(fetchImpl=globalThis.fetch){this.fetchImpl=fetchImpl;}
 async #fetch(path,{method="GET",body,csrf=false}={}){
  if(!path.startsWith("/")||path.includes(".."))throw new AdminApiError("Caminho inválido.");
  const headers={Accept:"application/json"};
  if(csrf){if(!this.#csrf)await this.refreshCsrf();headers[this.#csrf.headerName]=this.#csrf.token;}
  let requestBody;
  if(body instanceof URLSearchParams){requestBody=body;headers["Content-Type"]="application/x-www-form-urlencoded";}
  else if(body!==undefined){requestBody=JSON.stringify(body);headers["Content-Type"]="application/json";}
  let response;
  try{response=await this.fetchImpl("/api/v1"+path,{method,headers,body:requestBody,credentials:"same-origin",cache:"no-store"});}
  catch{throw new AdminApiError("Servidor indisponível.");}
  if(!response.ok){
   if(response.status===401)this.#csrf=null;
   const map={400:"Confira os dados.",401:"Sessão expirada ou credenciais inválidas.",403:"Ação não autorizada ou CSRF inválido.",404:"Recurso não encontrado.",409:"Conflito de dados; recarregue antes de salvar.",429:"Muitas tentativas; tente mais tarde."};
   throw new AdminApiError(map[response.status]||"Não foi possível concluir a operação.",response.status);
  }
  if(response.status===204)return null;
  try{return await response.json();}catch{throw new AdminApiError("Resposta inválida do servidor.",response.status);}
 }
 async refreshCsrf(){
  const data=await this.#fetch("/auth/csrf");if(!data?.headerName||!data.token)throw new AdminApiError("Falha na proteção CSRF");
  this.#csrf={headerName:data.headerName,token:data.token};return data;
 }
 async me(){return this.#fetch("/auth/me");}
 async login(username,password){
  if(!username||!password)throw new AdminApiError("Informe usuário e senha.");
  await this.refreshCsrf();
  await this.#fetch("/auth/login",{method:"POST",body:new URLSearchParams({username,password}),csrf:true});
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
 async write(method,path,payload){
  if(!["POST","PUT","PATCH","DELETE"].includes(method)||!path.startsWith("/admin/"))throw new AdminApiError("Rota de escrita não autorizada.");
  await this.refreshCsrf();
  return this.#fetch(path,{method,body:payload,csrf:true});
 }
}
