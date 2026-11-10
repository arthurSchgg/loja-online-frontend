import test from "node:test";
import assert from "node:assert/strict";
import {validateExperienceDraft,validateRecommendations,normalizeAdminExperience,removedResultKeys} from "../admin/experiences.js";
const draft=()=>({
 title:"Qual sua essência?",description:"Quiz",published:false,
 results:[{key:"floral",title:"Floral",description:""}],
 questions:[{title:"Que aroma você prefere?",options:[
  {label:"Flores",resultKey:"floral"},{label:"Rosas",resultKey:"floral"}
 ]}]
});
test("quiz DTO includes validated profile keys and ordered questions",()=>{
 const data=validateExperienceDraft(draft());
 assert.equal(data.published,false);
 assert.equal(data.questions[0].position,0);
 assert.deepEqual(data.questions[0].options.map(o=>o.position),[0,1]);
 assert.equal(data.results[0].key,"floral");
});
test("quiz rejects unknown profile, duplicate profile and missing options",()=>{
 const x=draft();x.questions[0].options[0].resultKey="unknown";
 assert.throws(()=>validateExperienceDraft(x),/perfil cadastrado/);
 const y=draft();y.results.push(y.results[0]);
 assert.throws(()=>validateExperienceDraft(y),/Chaves/);
 const z=draft();z.questions[0].options.pop();
 assert.throws(()=>validateExperienceDraft(z),/2 a 8/);
});
test("recommendations accept up to 3 distinct product IDs",()=>{
 assert.deepEqual(validateRecommendations({experienceId:2,resultKey:"floral",ids:"3, 5, 7"}),
  {experienceId:2,resultKey:"floral",productIds:[3,5,7]});
 assert.deepEqual(validateRecommendations({experienceId:2,resultKey:"floral",ids:""}).productIds,[]);
 assert.throws(()=>validateRecommendations({experienceId:2,resultKey:"floral",ids:"1,2,3,4"}),/máximo 3/);
 assert.throws(()=>validateRecommendations({experienceId:2,resultKey:"floral",ids:"1,1"}),/repetição/);
 assert.throws(()=>validateRecommendations({experienceId:0,resultKey:"floral",ids:"1"}),/ID/);
});

test("admin edit requires complete result keys and returns update-safe draft",()=>{
 const quiz={id:4,title:"Perfil",description:"",published:true,
  results:[{id:1,key:"floral",title:"Floral",description:"",productIds:[8]}],
  questions:[{id:2,title:"Aroma",position:0,options:[
   {id:3,label:"Rosa",position:0,resultKey:"floral"},
   {id:4,label:"Flor",position:1,resultKey:"floral"}]}]};
 const normalized=normalizeAdminExperience(quiz);
 assert.equal(normalized.id,4);
 assert.equal(normalized.questions[0].options[0].resultKey,"floral");
 assert.throws(()=>normalizeAdminExperience({...quiz,questions:[{...quiz.questions[0],options:[{label:"Sem chave"}]}]}),/chaves/);
 assert.throws(()=>normalizeAdminExperience({...quiz,results:undefined}),/completo/);
});

test("removing or renaming result keys requires a destructive-change confirmation",()=>{
 assert.deepEqual(removedResultKeys(["floral","wood"],["floral"]),["wood"]);
 assert.deepEqual(removedResultKeys(["floral"],["flowers"]),["floral"]);
 assert.deepEqual(removedResultKeys(["floral"],["floral","wood"]),[]);
});
