import test from "node:test";
import assert from "node:assert/strict";
import {validateProductImages} from "../admin/product-validation.js";

const cover={url:"https://example.com/products/vela.jpg",position:0,altText:"Vela"};
test("published products require at least one valid cover image",()=>{
 assert.deepEqual(validateProductImages([cover],true),[cover]);
 assert.throws(()=>validateProductImages([],true),/pelo menos uma imagem/);
 assert.deepEqual(validateProductImages([],false),[]);
});
test("image limit and HTTPS-only backend contract are explained in admin UI",()=>{
 assert.throws(()=>validateProductImages(Array.from({length:13},()=>cover),false),/máximo 12/);
 for(const url of ["", "/uploads/relative.jpg", "http://example.com/cover.jpg",
  "https://user:password@example.com/photo.jpg", "javascript:alert(1)", "https://"]){
  assert.throws(()=>validateProductImages([{url}],true),/HTTPS/);
 }
 assert.throws(()=>validateProductImages([{url:"https://example.com/"+"a".repeat(2049)}],false),/HTTPS/);
});
