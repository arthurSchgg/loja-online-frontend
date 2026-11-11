import {test,expect} from "@playwright/test";

const quiz={id:9,title:"Perfil de teste",description:"Quiz para homologação",published:true,
 results:[{id:1,key:"floral",title:"Floral",description:"",productIds:[2]}],
 questions:[{id:2,title:"Qual aroma?",position:0,options:[
  {id:3,label:"Rosa",resultKey:"floral",position:0},
  {id:4,label:"Lavanda",resultKey:"floral",position:1}]}]};
async function mockAdmin(page,{authenticated=true,editStatus=200}={}){
 await page.route("**/api/v1/**",async route=>{
  const request=route.request(),path=new URL(request.url()).pathname;
  let status=200,body={};
  if(path==="/api/v1/auth/me")body={authenticated,username:"admin-teste"};
  else if(path==="/api/v1/auth/csrf")body={headerName:"X-CSRF-TOKEN",token:"fake-test-token"};
  else if(path==="/api/v1/admin/experiences")body=[{id:9,title:quiz.title,questions:quiz.questions}];
  else if(path==="/api/v1/admin/experiences/9"){
   status=editStatus;body=status===200?quiz:{message:"Sessão encerrada"};
  }else if(path==="/api/v1/admin/experiences/9"&&request.method()==="PUT")body=quiz;
  else{status=404;body={message:"Mock endpoint não configurado"};}
  await route.fulfill({status,contentType:"application/json",body:JSON.stringify(body)});
 });
}
test("admin | anonymous session keeps quiz workspace hidden",async({page})=>{
 await mockAdmin(page,{authenticated:false});
 await page.goto("/admin-experiences.html");
 await expect(page.locator("#experiences-workspace")).toBeHidden();
 await expect(page.locator("#experiences-status")).toContainText("Sessão");
});
test("admin | authenticated user loads complete quiz without leaking result keys on public UI",async({page})=>{
 await mockAdmin(page);
 await page.goto("/admin-experiences.html");
 await expect(page.locator("#experiences-workspace")).toBeVisible();
 await expect(page.getByRole("button",{name:"Editar quiz"})).toBeVisible();
 await page.getByRole("button",{name:"Editar quiz"}).click();
 await expect(page.locator("#create-heading")).toContainText("Editar experiência #9");
 await expect(page.locator('#quiz-results [name="key"]')).toHaveValue("floral");
 await expect(page.locator('#quiz-questions [name="resultKey"]').first()).toHaveValue("floral");
});
test("admin | authorization loss clears current quiz and hides private UI",async({page})=>{
 await mockAdmin(page,{editStatus:401});
 await page.goto("/admin-experiences.html");
 await expect(page.locator("#experiences-workspace")).toBeVisible();
 await page.getByRole("button",{name:"Editar quiz"}).click();
 await expect(page.locator("#experiences-workspace")).toBeHidden();
 await expect(page.locator("#available-experiences")).toBeEmpty();
 await expect(page.locator("#experiences-status")).toContainText("Sessão expirada");
});
