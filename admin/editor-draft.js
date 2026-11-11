/** Preserve only the non-secret editor draft in tab memory across re-authentication.
 * Never persist to localStorage, sessionStorage, cookies or a URL.
 */
const safeModules=new Set(["brands","categories","products","offerings","content","campaigns","store"]);
export function captureEditorDraft({moduleName,editing,dirty,form}){
 if(!dirty||!safeModules.has(moduleName)||!form?.elements)return null;
 const fields={};
 for(const input of Array.from(form.elements)){
  if(!input.name||input.type==="password"||input.type==="hidden"||input.type==="file")continue;
  if(!["INPUT","SELECT","TEXTAREA"].includes(input.tagName))continue;
  fields[input.name]=input.type==="checkbox"?Boolean(input.checked):String(input.value);
 }
 return {moduleName,editing:Number.isSafeInteger(Number(editing))&&editing!==null?Number(editing):null,fields};
}
export function restoreEditorDraft(draft,form){
 if(!draft||!safeModules.has(draft.moduleName)||!form?.elements)return false;
 for(const [name,value] of Object.entries(draft.fields||{})){
  const input=form.elements.namedItem(name);
  if(!input||input.type==="password"||input.type==="file")continue;
  if(input.type==="checkbox")input.checked=value===true;
  else input.value=String(value);
 }
 return true;
}
