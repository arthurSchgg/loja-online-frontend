import {cpSync,existsSync,rmSync,mkdirSync,readFileSync,writeFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {join,resolve,dirname} from "node:path";
const root=resolve(fileURLToPath(new URL("..",import.meta.url)));
const dist=join(root,"dist");rmSync(dist,{recursive:true,force:true});mkdirSync(dist,{recursive:true});
const pages=["index.html","catalogo.html","produto.html","conheca-a-loja.html","espaco-das-velas.html","viva-sua-experiencia.html","contato.html","privacidade.html"];
for(const file of pages)cpSync(join(root,file),join(dist,file));
cpSync(join(root,"assets"),join(dist,"assets"),{recursive:true});
// Build-time PUBLIC configuration, never secrets. Same-origin API is preferred.
const mode=process.env.SITE_MODE||"demo";
const apiBase=process.env.API_BASE_URL||"/api/v1";
if(!["demo","live"].includes(mode))throw Error("SITE_MODE must be demo or live");
if(!apiBase.startsWith("/")){
 const u=new URL(apiBase);if(u.protocol!=="https:")throw Error("External production API must use HTTPS");
 if(process.env.ALLOW_EXTERNAL_PUBLIC_API!=="true")throw Error("External public API requires explicit ALLOW_EXTERNAL_PUBLIC_API=true");
}
const configPath=join(dist,"assets/js/config.js");
let configSource=readFileSync(configPath,"utf8");
configSource=configSource.replace('mode:"demo"','mode:'+JSON.stringify(mode))
 .replace('apiBaseUrl:"/api/v1"','apiBaseUrl:'+JSON.stringify(apiBase))
 .replace('allowExternalPublicApi:false','allowExternalPublicApi:'+String(process.env.ALLOW_EXTERNAL_PUBLIC_API==="true"));
writeFileSync(configPath,configSource);
if(mode==="live"){
 // Pages Functions run ONLY for API paths; static HTML/images remain free CDN assets.
 writeFileSync(join(dist,"_routes.json"),JSON.stringify({
  version:1,include:["/api/v1/*"],exclude:[]
 },null,2)+"\\n");
}
for(const page of pages){
 let html=readFileSync(join(dist,page),"utf8");
 if(!html.includes('http-equiv="Content-Security-Policy"')||!html.includes("script-src 'self'"))
  throw Error("Public CSP missing or unsafe in "+page);
 // Only the explicitly configured external API origin may be used by a release build.
 if(mode==="live"&&!apiBase.startsWith("/")){
  const origin=new URL(apiBase).origin;
  html=html.replace("connect-src 'self';","connect-src 'self' "+origin+";");
  writeFileSync(join(dist,page),html);
 }
 const paths=[...html.matchAll(/(?:src|href)="(assets\/[^"]+)"/g)].map(m=>m[1]);
 for(const path of paths)if(!existsSync(join(dist,path)))throw Error("Missing public asset: "+path+" in "+page);
}
for(const forbidden of ["admin.html","admin-experiences.html","reset-password.html","confirm-email.html","admin","assets/admin.js","assets/js/admin.js"]){
 if(existsSync(join(dist,forbidden)))throw Error("Admin content found in public artifact: "+forbidden);
}
console.log("Public static build PASS: "+pages.join(", ")+"; admin excluded; no checkout.");
