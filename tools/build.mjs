import {cpSync,existsSync,rmSync,mkdirSync,readFileSync,readdirSync,statSync} from "node:fs";
import {join,resolve,dirname} from "node:path";
const root=resolve(new URL("..",import.meta.url).pathname);
const dist=join(root,"dist");rmSync(dist,{recursive:true,force:true});mkdirSync(dist,{recursive:true});
const pages=["index.html","catalogo.html","produto.html","privacidade.html"];
for(const file of pages)cpSync(join(root,file),join(dist,file));
cpSync(join(root,"assets"),join(dist,"assets"),{recursive:true});
for(const page of pages){
 const html=readFileSync(join(dist,page),"utf8");
 const paths=[...html.matchAll(/(?:src|href)="(assets\/[^"]+)"/g)].map(m=>m[1]);
 for(const path of paths)if(!existsSync(join(dist,path)))throw Error("Missing public asset: "+path+" in "+page);
}
for(const forbidden of ["admin.html","assets/admin.js","assets/js/admin.js"]){
 if(existsSync(join(dist,forbidden)))throw Error("Admin content found in public artifact: "+forbidden);
}
console.log("Public static build PASS: "+pages.join(", ")+"; admin excluded; no checkout.");
