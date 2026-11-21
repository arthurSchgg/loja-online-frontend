import {cpSync,rmSync,mkdirSync,existsSync,readFileSync,writeFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {join,resolve} from "node:path";
import {bundleBaseCss} from "./bundle-base-css.mjs";
const root=resolve(fileURLToPath(new URL("..",import.meta.url))),dest=join(root,"dist-admin");
rmSync(dest,{recursive:true,force:true});mkdirSync(dest,{recursive:true});
for(const page of ["admin.html","admin-experiences.html","reset-password.html","confirm-email.html"])cpSync(join(root,page),join(dest,page));
cpSync(join(root,"admin"),join(dest,"admin"),{recursive:true});
mkdirSync(join(dest,"assets/css"),{recursive:true});
for(const file of ["tokens.css","base.css","components.css"])cpSync(join(root,"assets/css",file),join(dest,"assets/css",file));
bundleBaseCss(dest);
mkdirSync(join(dest,"assets/images/brand"),{recursive:true});
cpSync(join(root,"assets/images/brand/logo-katia.svg"),join(dest,"assets/images/brand/logo-katia.svg"));
// HML keeps a local link. The standalone Render bundle points to the verified
// public storefront instead of a missing index.html on the API origin.
if(process.env.PUBLIC_STOREFRONT_URL){
 const url=new URL(process.env.PUBLIC_STOREFRONT_URL);
 if(url.protocol!=="https:"||url.username||url.password||url.search||url.hash||
    !["","/"].includes(url.pathname)||url.port)throw Error("PUBLIC_STOREFRONT_URL must be a public HTTPS origin.");
 const page=join(dest,"admin.html");
 writeFileSync(page,readFileSync(page,"utf8").replaceAll('href="index.html"','href="'+url.origin+'/"'));
}
for(const page of ["admin.html","admin-experiences.html","reset-password.html","confirm-email.html"]){
 const html=readFileSync(join(dest,page),"utf8");
 const entries=[...html.matchAll(/(?:src|href)="((?:assets|admin)\/[^"]+)"/g)].map(x=>x[1]);
 for(const entry of entries)if(!existsSync(join(dest,entry)))throw Error("Missing admin asset "+entry+" in "+page);
}
if(existsSync(join(dest,"assets/js/live.js")))throw Error("Public catalog copied into admin artifact");
if(existsSync(join(dest,"catalogo.html")))throw Error("Public catalog page in admin artifact");
console.log("Admin bundle PASS — only same-origin protected deployment; never CDN on separate host.");
