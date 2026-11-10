import test from "node:test";
import assert from "node:assert/strict";
import {createPaginator} from "../assets/js/pagination.js";

test("a failed API fetch does not skip pages on retry", async () => {
 const requested = [];
 let fails = true;
 const pager = createPaginator(async page => {
  requested.push(page);
  if (fails) {fails = false; throw new Error("Offline");}
  return {items:[{id:page+1}],hasNext:true};
 });
 await assert.rejects(() => pager.next(),/Offline/);
 assert.equal(pager.page,0);
 assert.deepEqual((await pager.next()).items,[{id:1}]);
 assert.equal(pager.page,1);
 assert.deepEqual(requested,[0,0]);
});
test("no extra fetch happens once the last page is consumed", async () => {
 const requested = [];
 const pager = createPaginator(async page => {
  requested.push(page);
  return {items:[{id:123}],hasNext:false};
 });
 assert.equal(pager.hasNext,true);
 assert.deepEqual((await pager.next()).items,[{id:123}]);
 assert.equal(pager.hasNext,false);
 assert.deepEqual((await pager.next()).items,[]);
 assert.deepEqual(requested,[0]);
});
test("invalid API pages cannot advance pagination", async () => {
 const pager = createPaginator(async () => ({content:[],last:false}));
 await assert.rejects(()=>pager.next(),/Página inválida/);
 assert.equal(pager.page,0);
});
