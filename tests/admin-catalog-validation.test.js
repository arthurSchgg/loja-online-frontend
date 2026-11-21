import test from "node:test";
import assert from "node:assert/strict";
import {parseCategoryIds,validateProductFields,validateStockMovement,validatePromotion,localDateTimeInput} from "../admin/catalog-validation.js";
test("category IDs require positive unique integers and do not silently discard typos",()=>{
 assert.deepEqual(parseCategoryIds(" 1, 2,3 "),[1,2,3]);
 assert.deepEqual(parseCategoryIds(""),[]);
 for(const value of ["1,,3","0","-1","abc","1,abc,2","1,1","1.5","99999999999999999999"])
  assert.throws(()=>parseCategoryIds(value));
});
test("product fields match backend price and brand constraints",()=>{
 const good={name:"Perfume",description:"",price:90.25,brandId:2,categoryIds:[1],images:[],published:false};
 assert.equal(validateProductFields(good),true);
 for(const invalid of [{price:NaN},{price:-3},{price:0},{price:1.234},{price:null},{price:1e15},{brandId:0},{brandId:-1},{name:"  "},{name:"x".repeat(181)},{description:"x".repeat(4001)}])
  assert.throws(()=>validateProductFields({...good,...invalid}));
 assert.equal(validateProductFields({...good,price:null,priceStatus:"ON_REQUEST"}),true);
 assert.throws(()=>validateProductFields({...good,price:30,priceStatus:"ON_REQUEST"}));
});
test("stock reason and quantities meet StockMovementRequest rules",()=>{
 assert.deepEqual(validateStockMovement({type:"ENTRY",quantity:"2",reason:" Reposição "}),
  {type:"ENTRY",quantity:2,reason:"Reposição"});
 assert.deepEqual(validateStockMovement({type:"ADJUSTMENT",quantity:"0",reason:"Balanço"}).quantity,0);
 for(const invalid of [{quantity:""},{quantity:"-1"},{quantity:"1.5"},{quantity:"2147483648"},{quantity:"0"},
   {reason:" "},{reason:"x".repeat(501)},{type:"UNKNOWN"}])
  assert.throws(()=>validateStockMovement({type:"ENTRY",quantity:"2",reason:"OK",...invalid}));
});
test("promotion must have valid prices, discount and ordered dates",()=>{
 const good={price:"79.90",basePrice:100,startsAt:"2026-12-01T10:00",endsAt:"2026-12-02T10:00"};
 const payload=validatePromotion(good);
 assert.equal(payload.promotionalPrice,79.9);
 // datetime-local represents the operator's local timezone, not UTC.
 assert.equal(payload.startsAt,new Date(good.startsAt).toISOString());
 assert.equal(localDateTimeInput(payload.startsAt),good.startsAt);
 assert.equal(localDateTimeInput(payload.endsAt),good.endsAt);
 for(const invalid of [{price:"100"},{price:"101"},{price:"0"},{price:""},{price:"70.123"},
   {basePrice:null},{startsAt:""},{endsAt:"2026-12-01T09:00"},{endsAt:"invalid"}])
  assert.throws(()=>validatePromotion({...good,...invalid}));
});
