import {cpSync,existsSync,rmSync,mkdirSync,readFileSync,writeFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {join,resolve,dirname} from "node:path";
const root=resolve(fileURLToPath(new URL("..",import.meta.url)));
const dist=join(root,"dist");rmSync(dist,{recursive:true,force:true});mkdirSync(dist,{recursive:true});
const pages=["index.html","catalogo.html","produto.html","privacidade.html"];
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
for(const page of pages){
 const html=readFileSync(join(dist,page),"utf8");
 const paths=[...html.matchAll(/(?:src|href)="(assets\/[^"]+)"/g)].map(m=>m[1]);
 for(const path of paths)if(!existsSync(join(dist,path)))throw Error("Missing public asset: "+path+" in "+page);
}
for(const forbidden of ["admin.html","admin-experiences.html","reset-password.html","confirm-email.html","admin","assets/admin.js","assets/js/admin.js"]){
 if(existsSync(join(dist,forbidden)))throw Error("Admin content found in public artifact: "+forbidden);
}
console.log("Public static build PASS: "+pages.join(", ")+"; admin excluded; no checkout.");
