/** Explicit public release build. A production artifact cannot silently be demo. */
import {readFileSync,existsSync} from "node:fs";
import {spawnSync} from "node:child_process";
import {resolve,join} from "node:path";
import {fileURLToPath} from "node:url";

const raw=String(process.env.API_BASE_URL??"").trim();
if(!raw)throw new Error("API_BASE_URL é obrigatório para build:release.");
if(raw.startsWith("/")&&!raw.startsWith("//")){
 if(raw.includes("?")||raw.includes("#")||raw.includes("\\"))
  throw new Error("Caminho público de API não pode conter query, fragmento ou barra invertida.");
}else{
 let url;
 try{url=new URL(raw);}catch{throw new Error("API_BASE_URL deve ser caminho absoluto /api/... ou URL HTTPS.");}
 if(url.protocol!=="https:"||!url.hostname||url.username||url.password||url.search||url.hash)
  throw new Error("API externa exige HTTPS sem credenciais, query ou fragmento.");
 if(process.env.ALLOW_EXTERNAL_PUBLIC_API!=="true")
  throw new Error("API pública externa exige ALLOW_EXTERNAL_PUBLIC_API=true.");
}
// Cloudflare Pages builds run independently of GitHub-hosted Actions runners.
// A successful Pages build must include real syntax/asset checks and Node tests.
// No opt-out flag: avoid publishing unvalidated source when Actions has no runner.
const rootDir=resolve(fileURLToPath(new URL("..",import.meta.url)));
function qualityGate(script){
 const cli=process.env.npm_execpath;
 const command=cli?process.execPath:(process.platform==="win32"?"npm.cmd":"npm");
 const args=cli?[cli,"run",script]:["run",script];
 const execution=spawnSync(command,args,{
  cwd:rootDir,stdio:"inherit",shell:!cli&&process.platform==="win32",
  env:{...process.env,CI:"true"}
 });
 if(execution.error||execution.status!==0)
  throw new Error("Release quality gate failed: npm run "+script+(execution.error?" — "+execution.error.message:""));
}
qualityGate("check");
qualityGate("test");

process.env.SITE_MODE="live";
process.env.API_BASE_URL=raw;
await import("./build.mjs");
const root=resolve(fileURLToPath(new URL("..",import.meta.url)));
const file=join(root,"dist","assets/js/config.js");
if(!existsSync(file)||!readFileSync(file,"utf8").includes('mode:"live"'))
 throw new Error("O artefato de release precisa estar em SITE_MODE=live.");
for(const forbidden of ["admin.html","admin-experiences.html","reset-password.html","confirm-email.html","admin"]){
 if(existsSync(join(root,"dist",forbidden)))throw new Error("Área administrativa presente no build público.");
}
console.log("Release build PASS — modo live, API explícita e admin excluído.");
