import test from "node:test";
import assert from "node:assert/strict";
import {validateOfferingFields} from "../admin/offering-validation.js";
const valid=()=>({title:"Vela personalizada",description:"",type:"CANDLE",price:null,imageUrl:"https://example.org/vela.jpg",published:false,available:true});
test("offering DTO allows consultation price and validates title/types",()=>{
 assert.deepEqual(validateOfferingFields(valid()),valid());
 assert.equal(validateOfferingFields({...valid(),price:15.9}).price,15.9);
 for(const patch of [{title:" "},{title:"x".repeat(181)},{description:"x".repeat(4001)},{type:"UNKNOWN"},
  {price:-1},{price:1.234},{price:Infinity},{imageUrl:"http://example.org/image.png"},
  {imageUrl:"javascript:alert(1)"},{imageUrl:"https://user:pass@example.org/image.png"}]){
  assert.throws(()=>validateOfferingFields({...valid(),...patch}));
 }
});
