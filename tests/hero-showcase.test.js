import test from "node:test";
import assert from "node:assert/strict";
import {showcasePosition,SHOWCASE_INTERVAL_MS} from "../assets/js/hero-showcase.js";

test("perfumery showcase has one front position for each composition",()=>{
 for(let active=0;active<3;active++){
  const positions=[0,1,2].map(index=>showcasePosition(index,active));
  assert.equal(positions[active],"front");
  assert.equal(new Set(positions).size,3);
 }
});
test("the composition advances every thirty seconds",()=>{
 assert.equal(SHOWCASE_INTERVAL_MS,30000);
});
