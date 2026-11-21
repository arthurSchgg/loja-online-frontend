/**
 * Cloudflare Pages Function: public Spring Boot API proxy.
 * Administrative routes/auth/session/CSRF are NEVER proxied.
 * The browser keeps same-origin /api/v1 and never receives DB or admin credentials.
 */
const GET_ROUTES=[
 /^\/products(?:\/[0-9]+(?:\/(?:whatsapp|related))?)?$/,
 /^\/brands$/, /^\/categories$/, /^\/store$/,
 /^\/experiences(?:\/[0-9]+)?$/,
 /^\/offerings(?:\/[0-9]+(?:\/whatsapp)?)?$/,
 /^\/content-sections$/, /^\/campaigns$/
];
const POST_ROUTES=[/^\/whatsapp\/confirm$/, /^\/experiences\/[0-9]+\/evaluate$/];
const SHORT_CACHE=new Set(["/brands","/categories","/store","/content-sections"]);
const problem=(status,title)=>new Response(JSON.stringify({title}),{
 status,
 headers:{"Content-Type":"application/problem+json; charset=utf-8",
          "Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}
});

export async function onRequest(context){
 const request=context.request;
 const method=request.method.toUpperCase();
 const incoming=new URL(request.url);
 const prefix="/api/v1";
 if(!incoming.pathname.startsWith(prefix+"/"))return problem(404,"Rota não encontrada.");
 const path=incoming.pathname.slice(prefix.length);
 if(!(method==="GET"&&GET_ROUTES.some(re=>re.test(path)))&&
    !(method==="POST"&&POST_ROUTES.some(re=>re.test(path))))
  return problem(404,"Rota pública não encontrada.");
 if(method==="POST"&&!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type")||""))
  return problem(415,"Envie JSON válido.");
 let origin;
 try{
  origin=new URL(context.env?.PUBLIC_API_ORIGIN||"");
  if(origin.protocol!=="https:"||!/^lojinha-da-katia-api(?:-[a-z0-9]+)?\.onrender\.com$/.test(origin.hostname)||
     origin.username||origin.password||origin.port||origin.pathname!=="/"||origin.search||origin.hash)
   throw new Error("Invalid upstream");
 }catch{return problem(503,"A API da loja ainda não foi configurada.");}

 const upstream=new URL(prefix+path+incoming.search,origin);
 const headers=new Headers({Accept:"application/json"});
 let body;
 if(method==="POST"){
  if(Number(request.headers.get("content-length")||0)>12000)return problem(413,"Requisição muito grande.");
  try{
   body=await request.text();
   if(new TextEncoder().encode(body).byteLength>12000)return problem(413,"Requisição muito grande.");
  }catch{return problem(400,"Corpo inválido.");}
  headers.set("Content-Type","application/json");
 }
 const upstreamDeadline=AbortSignal.timeout(18000);
 const upstreamSignal=typeof AbortSignal.any==="function"
  ?AbortSignal.any([upstreamDeadline,request.signal]):upstreamDeadline;
 try{
  const fetchImpl=context.fetchImpl||globalThis.fetch;
  const response=await fetchImpl(upstream.toString(),{method,headers,body,redirect:"manual",signal:upstreamSignal});
  if(response.status>=300&&response.status<400)return problem(502,"Resposta inesperada da API.");
  const contentType=response.headers.get("content-type")||"";
  if(!/^application\/(?:json|problem\+json)(?:\s*;|$)/i.test(contentType))
   return problem(502,"Resposta inválida da API.");
  return new Response(response.body,{
   status:response.status,
   headers:{"Content-Type":contentType,
    "Cache-Control":method==="GET"&&response.status===200&&!incoming.search&&SHORT_CACHE.has(path)
     ?"public, max-age=30, must-revalidate":"no-store",
    "X-Content-Type-Options":"nosniff"}
  });
 }catch(error){
  if(upstreamDeadline.aborted||error?.name==="TimeoutError")
   return problem(504,"A API demorou a responder. Tente novamente.");
  return problem(502,"Não foi possível conectar à API.");
 }
}
