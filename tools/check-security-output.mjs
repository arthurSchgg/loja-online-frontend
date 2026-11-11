/** Verify release artifacts never include executable third-party CDN scripts,
 * or administrative pages inside the publicly hosted output.
 */
import {readFileSync,existsSync} from "node:fs";
import {join,resolve} from "node:path";
import {fileURLToPath} from "node:url";

const root=resolve(fileURLToPath(new URL("..",import.meta.url)));
const publicRoot=join(root,"dist"),adminRoot=join(root,"dist-admin");
const publics=["index.html","catalogo.html","produto.html","conheca-a-loja.html","espaco-das-velas.html","privacidade.html"];
const admins=["admin.html","admin-experiences.html","reset-password.html","confirm-email.html"];

for(const [directory,pages] of [[publicRoot,publics],[adminRoot,admins]]){
 if(!existsSync(directory))throw Error("Bundle not found: "+directory);
 for(const page of pages){
  const html=readFileSync(join(directory,page),"utf8");
  if(!html.includes('http-equiv="Content-Security-Policy"') ||
     !html.includes("script-src 'self'")||!html.includes("object-src 'none'"))
   throw Error("Missing CSP in "+page);
  if(/<script\b[^>]*\bsrc="https?:\/\//i.test(html))
   throw Error("Executable CDN script in "+page);
 }
}
for(const page of admins)if(existsSync(join(publicRoot,page)))
 throw Error("Administrative page leaked into public bundle: "+page);
if(existsSync(join(publicRoot,"admin")))throw Error("Admin directory in public bundle");
console.log("Security artifact inspection PASS: CSP in public/admin pages, no CDN scripts, separate bundles.");
