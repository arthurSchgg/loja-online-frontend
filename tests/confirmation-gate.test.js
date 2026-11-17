import test from "node:test";
import assert from "node:assert/strict";
import {createConfirmationGate} from "../assets/js/confirmation-gate.js";

test("only the newest confirmation attempt can publish a link",()=>{
 const gate=createConfirmationGate();
 const old=gate.begin();
 const latest=gate.begin();
 assert.equal(gate.isCurrent(old),false);
 assert.equal(gate.isCurrent(latest),true);
});

test("changing customization invalidates previously confirmed selection",()=>{
 const gate=createConfirmationGate();
 const earlier=gate.begin();
 gate.invalidate();
 assert.equal(gate.isCurrent(earlier),false);
 assert.equal(gate.isCurrent(gate.begin()),true);
});

test("closing or reopening the dialog invalidates late asynchronous responses",async()=>{
 const gate=createConfirmationGate();
 let release;
 const pending=new Promise(resolve=>{release=resolve;});
 const beforeClose=gate.begin();
 const result=pending.then(url=>gate.isCurrent(beforeClose)?url:null);
 gate.invalidate();
 const afterReopen=gate.begin();
 release("https://wa.me/5547999999999");
 assert.equal(await result,null);
 assert.equal(gate.isCurrent(afterReopen),true);
 assert.equal(gate.isCurrent(NaN),false);
});
