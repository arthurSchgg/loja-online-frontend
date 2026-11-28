import {test,expect} from "@playwright/test";
function errorsOn(page){const errors=[];page.on("pageerror",e=>errors.push(e.message));return errors;}
for(const width of [320,375,768,1440]){
 test("demo | public pages and links work at "+width+"px",async({page})=>{
  await page.setViewportSize({width,height:850});const errors=errorsOn(page);
  for(const path of ["/viva-sua-experiencia.html","/contato.html"]){
   await page.goto(path);await expect(page.locator("main h1")).toBeVisible();
   expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width+2);
  }
  await expect(page.locator('.mobile-links a[href="contato.html"]')).toHaveCount(1);
  expect(errors).toEqual([]);
 });
}
test("live | experience submits questions and displays recommendations",async({page})=>{
 const errors=errorsOn(page);
 await page.route("**/api/v1/**",async route=>{
  const {pathname}=new URL(route.request().url());
  let body={};
  if(pathname==="/api/v1/experiences")body=[{id:12,title:"Meu momento",description:"Quiz de teste"}];
  if(pathname==="/api/v1/experiences/12")body={id:12,title:"Meu momento",questions:[{id:1,title:"Qual sensação?",options:[{id:2,label:"Calma"},{id:3,label:"Energia"}]}]};
  if(pathname==="/api/v1/experiences/12/evaluate"){
   expect(route.request().postDataJSON()).toEqual({answers:[{questionId:1,optionId:2}]});
   body={title:"Sereno",recommendations:[{id:5,name:"Produto publicado"}]};
  }
  await route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(body)});
 });
 await page.goto("/viva-sua-experiencia.html");
 await page.locator(".experience-card").getByRole("button",{name:"Começar",exact:false}).click();
 await expect(page.locator("#quiz-progress")).toHaveAttribute("value","0");
 await page.locator('input[name="q-1"][value="2"]').check();
 await expect(page.locator("#quiz-progress")).toHaveAttribute("value","1");
 await page.getByRole("button",{name:"Ver meu resultado"}).click();
 await expect(page.locator("#experience-result")).toContainText("Sereno");
 await expect(page.locator('#experience-result a[href="produto.html?productId=5"]')).toBeVisible();
 await page.getByRole("button",{name:"Escolher outra experiência"}).click();
 await expect(page.locator("#experience-result")).toHaveCount(0);
 await expect(page.locator("#experience-selection")).toBeVisible();
 expect(errors).toEqual([]);
});
test("live | contact only displays official valid links",async({page})=>{
 await page.route("**/api/v1/store",route=>route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({whatsapp:"5547999999999",instagramUrl:"https://www.instagram.com/exemplo/",email:"contato@exemplo.com",openingHours:"Seg-Sex",address:"Rua exemplo, 100",region:"Santa Catarina"})}));
 await page.goto("/contato.html");
 await expect(page.locator("#contact-links a")).toHaveCount(3);
 await expect(page.locator("#contact-info")).toContainText("Seg-Sex");
 await expect(page.locator("#contact-info")).toContainText("Rua exemplo, 100");
 await expect(page.locator("#contact-info")).toContainText("Santa Catarina");
});

for(const status of [200,502]){
test("live | local experience works with empty or failing API ("+status+")",async({page})=>{
 const writes=[];
 await page.route("**/api/v1/**",route=>{
  if(route.request().method()==="POST")writes.push(route.request().url());
  return route.fulfill({status,contentType:"application/json",body:status===200?"[]":"{}"});
 });
 await page.goto("/viva-sua-experiencia.html");
 await expect(page.locator("#experience-selection .content-preview-card")).toContainText("Qual é o seu estilo olfativo?");
 await page.getByRole("button",{name:"Começar quiz ilustrativo"}).click();
 await completeLocalQuiz(page,"#local-experience-form","#local-quiz-result");
 await page.goto("/index.html");
 await completeLocalQuiz(page,"#quiz-form","#quiz-result");
 expect(writes).toEqual([]);
});
}
async function completeLocalQuiz(page,formSelector,resultSelector){
 const form=page.locator(formSelector);
 await expect(form.getByRole("button",{name:"Próxima pergunta"})).toBeDisabled();
 for(let i=0;i<3;i++){
  await form.locator('input[value="Floral"]').check();
  await form.getByRole("button",{name:i===2?"Ver meu resultado":"Próxima pergunta"}).click();
 }
 await expect(page.locator(resultSelector)).toContainText("Floral");
 await expect(page.locator(resultSelector).getByRole("link")).toHaveAttribute("href","catalogo.html");
 await form.getByRole("button",{name:"Refazer quiz"}).click();
 await expect(form.getByRole("button",{name:"Próxima pergunta"})).toBeDisabled();
}

test("live | an official evaluation error offers the independent quiz",async({page})=>{
 await page.route("**/api/v1/**",route=>{
  const path=new URL(route.request().url()).pathname;
  const body=path.endsWith("/experiences")?[{id:12,title:"Perfil oficial"}]:{id:12,title:"Perfil oficial",questions:[{id:1,title:"Escolha",options:[{id:2,label:"Calma"}]}]};
  const failed=path.endsWith("/evaluate");
  return route.fulfill({status:failed?502:200,contentType:"application/json",body:JSON.stringify(failed?{}:body)});
 });
 await page.goto("/viva-sua-experiencia.html");
 await page.locator(".experience-card").getByRole("button",{name:"Começar",exact:false}).click();
 await page.locator('input[name="q-1"]').check();
 await page.getByRole("button",{name:"Ver meu resultado"}).click();
 await page.getByRole("button",{name:"Usar quiz ilustrativo"}).click();
 await completeLocalQuiz(page,"#local-experience-form","#local-quiz-result");
});
