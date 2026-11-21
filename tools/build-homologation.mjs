/**
 * Homologation-only package: public LIVE pages and administrative pages under
 * one HTTPS origin. Never deploy dist-hml as a standalone public CDN.
 * Both artifacts remain separately built and validated for production.
 */
import {cpSync,existsSync,mkdirSync,readFileSync,readdirSync,rmSync,statSync} from "node:fs";
import {join,resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {createHash} from "node:crypto";

const root=resolve(fileURLToPath(new URL("..",import.meta.url)));
const combined=join(root,"dist-hml");
if(process.env.API_BASE_URL && process.env.API_BASE_URL!=="/api/v1")
 throw Error("Homologação exige API_BASE_URL=/api/v1 na mesma origem.");
if(process.env.ALLOW_EXTERNAL_PUBLIC_API==="true")
 throw Error("Homologação local não permite API externa.");
process.env.API_BASE_URL="/api/v1";
process.env.SITE_MODE="live";
process.env.ALLOW_EXTERNAL_PUBLIC_API="false";
delete process.env.PUBLIC_STOREFRONT_URL;
await import("./build-release.mjs");
await import("./build-admin.mjs");

const publicDir=join(root,"dist"),adminDir=join(root,"dist-admin");
function digest(path){return createHash("sha256").update(readFileSync(path)).digest("hex");}
function overlay(src,dest){
 for(const entry of readdirSync(src,{withFileTypes:true})){
  const from=join(src,entry.name),to=join(dest,entry.name);
  if(entry.isSymbolicLink())throw Error("Symlinks não são aceitos no bundle HML.");
  if(entry.isDirectory()){
   if(existsSync(to)&&!statSync(to).isDirectory())throw Error("Conflito de caminho HML: "+entry.name);
   mkdirSync(to,{recursive:true});overlay(from,to);
  }else if(entry.isFile()){
   if(existsSync(to)){
    if(!statSync(to).isFile()||digest(from)!==digest(to))
     throw Error("Artefatos público/admin conflitantes: "+entry.name);
   }else cpSync(from,to);
  }else throw Error("Tipo de arquivo não aceito: "+entry.name);
 }
}
rmSync(combined,{recursive:true,force:true});
mkdirSync(combined,{recursive:true});
overlay(publicDir,combined);
overlay(adminDir,combined);
for(const file of ["index.html","catalogo.html","contato.html","admin.html",
                   "admin-experiences.html","reset-password.html","confirm-email.html",
                   "assets/js/config.js","admin/admin.js"]){
 if(!existsSync(join(combined,file)))throw Error("Arquivo obrigatório ausente no HML: "+file);
}
const config=readFileSync(join(combined,"assets/js/config.js"),"utf8");
if(!config.includes('mode:"live"')||!config.includes('apiBaseUrl:"/api/v1"')||
   !config.includes("allowExternalPublicApi:false"))
 throw Error("HML deve usar modo live e API sob mesma origem.");
if(existsSync(join(publicDir,"admin.html"))||existsSync(join(publicDir,"admin")))
 throw Error("Artefato público de produção não pode conter administração.");
console.log("PASS: dist-hml/ contém vitrine live e painel no mesmo domínio para homologação local.");
console.log("Atenção: dist-hml NÃO deve ser enviado para hospedagem pública/CDN.");
