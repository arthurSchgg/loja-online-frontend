import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createRequestGuard} from "../admin/request-guard.js";

test("a later module request invalidates an earlier response",async()=>{
 const gate=createRequestGuard();
 let resolveOlder;
 const older=new Promise(resolve=>{resolveOlder=resolve;});
 const first=gate.begin();
 const stale=older.then(data=>gate.isCurrent(first)?data:null);
 const second=gate.begin();
 resolveOlder(["products that no longer belong to this view"]);
 assert.equal(await stale,null);
 assert.equal(gate.isCurrent(second),true);
});

test("logout invalidates pending private reads, even if they complete later",async()=>{
 const gate=createRequestGuard();
 let deliver;
 const asyncResult=new Promise(resolve=>deliver=resolve);
 const token=gate.begin();
 const rendered=asyncResult.then(response=>gate.isCurrent(token)?response:null);
 gate.invalidate();
 deliver({sensitive:"admin-only"});
 assert.equal(await rendered,null);
 assert.equal(gate.isCurrent(token),false);
});

test("closing a dialog invalidates old tool results and reopening starts anew",()=>{
 const gate=createRequestGuard();
 const first=gate.begin();
 gate.invalidate();
 const next=gate.begin();
 assert.equal(gate.isCurrent(first),false);
 assert.equal(gate.isCurrent(next),true);
 assert.equal(gate.isCurrent("2"),false);
 assert.equal(gate.isCurrent(NaN),false);
});

test("admin page uses request guards at the session, module and dialog boundaries",()=>{
 const source=readFileSync(new URL("../admin/admin.js",import.meta.url),"utf8");
 assert.match(source,/recordsGate\.invalidate\(\);toolGate\.invalidate\(\)/);
 assert.match(source,/moduleName!==requestedModule/);
 assert.match(source,/sessionUser!==requestedSession/);
 assert.match(source,/tool\.addEventListener\("close",\(\)=>toolGate\.invalidate\(\)\)/);
 assert.match(source,/if\(!isActive\(\)\)return/);
 assert.match(source,/if\(requestedModule==="store"&&!dirty\)buildForm\(result\)/);
 assert.match(source,/moreButton\.disabled=true/);
 assert.match(source,/saveGate\.invalidate\(\)/);
 assert.match(source,/input\.addEventListener\("input",\(\)=>\{dirty=true;saveGate\.invalidate\(\);\}\)/);
 assert.match(source,/if\(!isCurrent\(\)\)return/);
});
