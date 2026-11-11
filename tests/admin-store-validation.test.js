import test from "node:test";
import assert from "node:assert/strict";
import {validateStoreFields} from "../admin/store-validation.js";
const base=()=>({
 displayName:"Loja teste",slogan:"",description:"",whatsapp:null,
 instagramUrl:"",email:"",openingHours:"",address:"",region:""
});
test("optional institutional details can stay blank until the owner supplies them",()=>{
 assert.equal(validateStoreFields(base()),true);
 assert.equal(validateStoreFields({...base(),openingHours:"Seg-Sex 9h às 18h",
  address:"Rua exemplo, 100",region:"Vale do Itajaí"}),true);
});
test("store admin rejects invalid lengths, channels and names",()=>{
 const invalid=[
  {displayName:" "},{displayName:"A".repeat(181)},
  {slogan:"x".repeat(241)},{description:"x".repeat(4001)},
  {openingHours:"x".repeat(501)},{address:"x".repeat(501)},
  {region:"x".repeat(181)},{whatsapp:"abc"},
  {whatsapp:"12345"},{instagramUrl:"http://instagram.com/loja"},
  {instagramUrl:"https://instagram.com.evil.example/loja"},
  {instagramUrl:"https://user:password@instagram.com/loja"},
  {email:"invalid@"},{email:"x".repeat(255)+"@example.com"}
 ];
 for(const fields of invalid)assert.throws(()=>validateStoreFields({...base(),...fields}),
  "Expected rejection for "+Object.keys(fields).join(","));
});
test("valid optional channels are permitted",()=>{
 assert.equal(validateStoreFields({...base(),whatsapp:"+5547999999999",
  instagramUrl:"https://www.instagram.com/lojinha/",email:"contato@example.com"}),true);
});
