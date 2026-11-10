import test from "node:test";import assert from "node:assert/strict";
import {addItem,changeQuantity,totalCount,normalizedItem,readBag} from "../assets/js/cart.js";
test("adds distinct volumes and increments same item",()=>{
 let bag=addItem([],{id:"p1",size:50});bag=addItem(bag,{id:"p1",size:50});bag=addItem(bag,{id:"p1",size:100});
 assert.equal(bag.length,2);assert.equal(totalCount(bag),3);
});
test("bounded quantities, removes when zero",()=>{
 let bag=addItem([],{id:"p1",size:30,qty:9});bag=addItem(bag,{id:"p1",size:30});assert.equal(totalCount(bag),9);
 bag=changeQuantity(bag,"p1",30,-9);assert.equal(totalCount(bag),0);
});
test("rejects malformed data; safe fallback on broken storage",()=>{
 assert.throws(()=>normalizedItem("x",25));assert.deepEqual(readBag({getItem:()=>"{bad"}),[]);
});
