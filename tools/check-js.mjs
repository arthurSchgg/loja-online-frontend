import {readdirSync} from "node:fs";
import {join,resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {spawnSync} from "node:child_process";
const root=resolve(fileURLToPath(new URL("..",import.meta.url)));
let count=0;
function check(path){
 const result=spawnSync(process.execPath,["--check",path],{stdio:"inherit"});
 if(result.error||result.status!==0)throw Error("JavaScript syntax check failed: "+path);
 count++;
}
function walk(directory){
 for(const entry of readdirSync(directory,{withFileTypes:true})){
  const path=join(directory,entry.name);
  if(entry.isDirectory())walk(path);
  else if(entry.isFile()&&/\.(?:js|mjs)$/.test(entry.name))check(path);
 }
}
for(const name of ["assets/js","admin","functions","tools","scripts","tests",
 "browser-tests","admin-browser-tests","homologation-tests","iphone-browser-tests"])walk(join(root,name));
for(const entry of readdirSync(root))if(/^playwright.*\.mjs$/.test(entry))check(join(root,entry));
console.log("JavaScript syntax PASS: "+count+" files.");
