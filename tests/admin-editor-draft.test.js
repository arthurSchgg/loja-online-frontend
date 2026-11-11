import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {captureEditorDraft,restoreEditorDraft} from "../admin/editor-draft.js";
const input=(name,value,type="text")=>({name,value,type,tagName:"INPUT",checked:Boolean(value)});
const form=(items)=>({elements:Object.assign(items,{namedItem(name){return this.find(x=>x.name===name)||null;}})});
test("captures only unsaved, non-secret editor fields",()=>{
 const draft=captureEditorDraft({moduleName:"products",editing:8,dirty:true,form:form([
  input("name","Produto"),input("published",true,"checkbox"),input("password","must-never-copy","password"),
  input("secret","hidden-value","hidden")
 ])});
 assert.deepEqual(draft,{moduleName:"products",editing:8,fields:{name:"Produto",published:true}});
 assert.equal(captureEditorDraft({moduleName:"products",dirty:false,form:form([])}),null);
 assert.equal(captureEditorDraft({moduleName:"security",dirty:true,form:form([])}),null);
});
test("restores editor selections but never passwords",()=>{
 const values=form([input("name",""),input("published",false,"checkbox"),input("password","","password")]);
 assert.equal(restoreEditorDraft({moduleName:"products",fields:{name:"Produto editado",published:true,password:"unsafe"}},values),true);
 assert.equal(values[0].value,"Produto editado");
 assert.equal(values[1].checked,true);
 assert.equal(values[2].value,"");
 assert.equal(restoreEditorDraft({moduleName:"unknown",fields:{}},values),false);
});
test("session expiry preserves draft; voluntary logout discards it",()=>{
 const source=readFileSync(new URL("../admin/admin.js",import.meta.url),"utf8");
 assert.match(source,/function showLogin\(\{preserveDraft=true\}=\{\}\)/);
 assert.match(source,/if\(draft\)pendingDraft=draft/);
 assert.match(source,/showLogin\(\{preserveDraft:false\}\)/);
 assert.match(source,/restoreEditorDraft\(draft,\$\("#edit-form"\)\)/);
});
