import test from "node:test";
import assert from "node:assert/strict";
import {experienceList,experienceDetail,experienceResult,id} from "../src/types/public-api.ts";

test("experience DTOs retain the API's numeric IDs and reject malformed options",()=>{
 assert.equal(id(1),1);
 assert.equal(id(true),null);
 assert.equal(id("2e3"),null);
 const list=experienceList([{id:7,title:"Sinta"},{id:false,title:"Invalid"}]);
 assert.equal(list.length,1);
 assert.equal(list[0].id,7);
 const raw={id:7,title:"Sinta",questions:[{id:1,title:"Qual?",options:[{id:2,label:"Calma"}]}]};
 assert.equal(experienceDetail(raw,7).questions[0].options[0].id,2);
 assert.throws(()=>experienceDetail(raw,8));
 assert.throws(()=>experienceDetail({...raw,questions:[{id:1,options:[{id:0}]}]},7));
 assert.throws(()=>experienceDetail({...raw,questions:[]},7));
 assert.deepEqual(experienceResult({title:"Calma",recommendations:[{id:2,name:"Produto"},{id:"bad",name:"Outro"}]}).recommendations,
 [{id:2,name:"Produto"},{id:null,name:"Outro"}]);
});
