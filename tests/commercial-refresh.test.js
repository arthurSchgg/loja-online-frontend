import test from "node:test";
import assert from "node:assert/strict";
import {setupCommercialRefresh} from "../assets/js/commercial-refresh.js";

test("commercial refresh runs only on a visible return, not while hidden",async()=>{
 const win=new EventTarget(),doc=new EventTarget();
 doc.hidden=false;
 let time=0,refreshes=0;
 const dispose=setupCommercialRefresh(async()=>{refreshes++;},{win,doc,now:()=>time,minimumAwayMs:30});
 const pause=()=>{doc.hidden=true;doc.dispatchEvent(new Event("visibilitychange"));};
 const resume=()=>{doc.hidden=false;doc.dispatchEvent(new Event("visibilitychange"));};
 pause();time=10;resume();
 assert.equal(refreshes,0);
 pause();time=50;
 assert.equal(refreshes,0);
 resume();await new Promise(resolve=>setImmediate(resolve));
 assert.equal(refreshes,1);
 const restored=new Event("pageshow");Object.defineProperty(restored,"persisted",{value:true});
 win.dispatchEvent(restored);await new Promise(resolve=>setImmediate(resolve));
 assert.equal(refreshes,2);
 dispose();win.dispatchEvent(restored);
 assert.equal(refreshes,2);
});
