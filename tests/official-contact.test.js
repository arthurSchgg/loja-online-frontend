import test from "node:test";
import assert from "node:assert/strict";
import {officialStoreLinks} from "../assets/js/official-contact.js";

test("only configured official store channels become links",()=>{
 assert.deepEqual(officialStoreLinks(null),[]);
 assert.deepEqual(officialStoreLinks({whatsapp:null,instagramUrl:null,email:null}),[]);
 const links=officialStoreLinks({
  whatsapp:"+5547998887766",
  instagramUrl:"https://www.instagram.com/lojinha.teste/?utm=not-needed#tracking",
  email:"contato@example.com"
 });
 assert.deepEqual(links,[
  {label:"Conversar pelo WhatsApp",href:"https://wa.me/5547998887766",external:true},
  {label:"Conhecer o Instagram",href:"https://www.instagram.com/lojinha.teste/",external:true},
  {label:"Enviar e-mail",href:"mailto:contato@example.com",external:false}
 ]);
});
test("reject unsafe or invented contact destinations",()=>{
 const links=officialStoreLinks({
  whatsapp:"1234<script>",
  instagramUrl:"https://instagram.com.evil.example/steal",
  email:"attacker@example.com?subject=hidden"
 });
 assert.deepEqual(links,[]);
 assert.deepEqual(officialStoreLinks({instagramUrl:"javascript:alert(1)"}),[]);
 assert.deepEqual(officialStoreLinks({instagramUrl:"https://user:pass@instagram.com/"}),[]);
 assert.deepEqual(officialStoreLinks({instagramUrl:"http://instagram.com/"}),[]);
 assert.deepEqual(officialStoreLinks({whatsapp:"5547998887766"}),[
  {label:"Conversar pelo WhatsApp",href:"https://wa.me/5547998887766",external:true}
 ]);
});
