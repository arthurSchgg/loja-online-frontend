import {test,expect} from "@playwright/test";

const services=[
 {id:42,type:"CANDLE",title:"Vela Lavanda - Ensaio",description:"Vela de teste da homologação.",
  imageUrl:null,price:59.90,published:true,available:true,
  options:[{kind:"AROMA",label:"Lavanda",active:true,position:0}]},
 {id:43,type:"WORKSHOP",title:"Oficina de Teste",description:"Exemplo indisponível.",
  imageUrl:null,price:null,published:true,available:false,options:[]},
 {id:44,type:"RENTAL",title:"Locação de Teste",description:"Sob consulta.",
  imageUrl:null,price:null,published:true,available:true,options:[]}
];
function errorsOn(page){
 const errors=[];page.on("pageerror",error=>errors.push(error.message));return errors;
}
async function assertNoOverflow(page,width){
 const actual=await page.evaluate(()=>document.documentElement.scrollWidth);
 expect(actual,"horizontal overflow").toBeLessThanOrEqual(width+2);
}
async function routeInstitutional(page,{broken=false,empty=false}={}){
 await page.route("**/api/v1/**",async route=>{
  if(broken)return route.fulfill({status:503,contentType:"application/json",body:'{"message":"Unavailable"}'});
  const req=route.request(),path=new URL(req.url()).pathname;
  let body;
  if(path==="/api/v1/store")body={displayName:"Loja de Teste",
   slogan:"Um cuidado em cada detalhe",description:"Apresentação oficial publicada para homologação.",
   whatsapp:"5547999999999",instagramUrl:"https://www.instagram.com/loja_teste/",email:"contato@exemplo.com"};
  else if(path==="/api/v1/content-sections")body=empty?[]:[
   {id:2,slug:"conheca-a-loja",title:"Nossa história publicada",body:"Texto oficial de teste.",imageUrl:null,published:true},
   {id:3,slug:"politica-de-privacidade",title:"Privado",body:"Não deve aparecer.",published:true}
  ];
  else if(path==="/api/v1/offerings")body=empty?[]:services;
  else if(path==="/api/v1/whatsapp/confirm"&&req.method()==="POST"){
   const submitted=req.postDataJSON();
   expect(submitted).toMatchObject({type:"OFFERING",id:42,expectedPrice:59.9,
    customizations:{AROMA:"Lavanda"}});
   body={url:"https://wa.me/5547999999999?text=Vela",message:"OK"};
  }else return route.fulfill({status:404,contentType:"application/json",body:"{}"});
  await route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(body)});
 });
}
for(const width of [320,375,768,1024,1440]){
 test("demo | dedicated pages responsive at "+width+"px",async({page})=>{
  await page.setViewportSize({width,height:850});
  const errors=errorsOn(page);
  await page.goto("/conheca-a-loja.html");
  await expect(page.locator("main h1")).toBeVisible();
  await expect(page.locator('nav a[href="conheca-a-loja.html"][aria-current="page"]')).toHaveCount(2);
  await expect(page.locator("#official-story [data-demo-only]")).toBeVisible();
  await assertNoOverflow(page,width);
  await page.goto("/espaco-das-velas.html");
  await expect(page.locator("main h1")).toBeVisible();
  await expect(page.locator("#candle-offerings .offering-card")).toHaveCount(3);
  await expect(page.locator("[data-confirm-offering]")).toHaveCount(0);
  await assertNoOverflow(page,width);
  if(width===375){
   const toggle=page.locator("[data-mobile-toggle]");
   await toggle.click();
   await expect(page.locator('#mobile-links a[href="conheca-a-loja.html"]')).toBeVisible();
   await expect(page.locator('#mobile-links a[href="espaco-das-velas.html"]')).toBeVisible();
  }
  expect(errors).toEqual([]);
 });
}
test("demo | candle photography honors reduced-motion preference",async({page})=>{
 await page.emulateMedia({reducedMotion:"reduce"});
 await page.goto("/espaco-das-velas.html");
 await expect(page.locator(".chapter-hero__art .editorial-cutout-shell")).toHaveCSS("animation-name","none");
});
test("live | about page reads official story and validated contact channels",async({page})=>{
 const errors=errorsOn(page);
 await routeInstitutional(page);
 await page.goto("/conheca-a-loja.html");
 await expect(page.locator("#official-story .official-story-entry")).toHaveCount(1);
 await expect(page.locator("#official-story")).toContainText("Nossa história publicada");
 await expect(page.locator("#official-story")).not.toContainText("Não deve aparecer");
 await expect(page.locator("#about-summary")).toHaveText("Apresentação oficial publicada para homologação.");
 await expect(page.locator('#about-contacts a[href^="https://wa.me/"]')).toHaveCount(1);
 await expect(page.locator("#about-contacts a")).toHaveCount(3);
 await expect(page.locator('[data-demo-only]')).toHaveCount(0);
 expect(errors).toEqual([]);
});
test("live | candles display published services, filter and confirm WhatsApp",async({page})=>{
 const errors=errorsOn(page);
 await routeInstitutional(page);
 await page.goto("/espaco-das-velas.html");
 await expect(page.locator("#candle-offerings .offering-card")).toHaveCount(3);
 await expect(page.locator("#offering-filters")).toBeVisible();
 await page.locator('[data-offering-filter="WORKSHOP"]').click();
 await expect(page.locator("#candle-offerings .offering-card")).toHaveCount(1);
 await expect(page.locator("#candle-offerings")).toContainText("Indisponível");
 await expect(page.locator('#candle-offerings [data-confirm-offering]')).toHaveCount(0);
 await page.locator('[data-offering-filter="CANDLE"]').click();
 await expect(page.locator("#candle-offerings .offering-card")).toHaveCount(1);
 await page.locator('[data-confirm-offering="42"]').click();
 await expect(page.locator("#whatsapp-confirm-dialog")).toBeVisible();
 await page.locator('#confirm-options select[data-option-kind="AROMA"]').selectOption("Lavanda");
 await page.locator("#send-confirm").click();
 await expect(page.locator("#confirmed-link a")).toHaveAttribute("href",/^https:\/\/wa\.me\/5547999999999/);
 expect(errors).toEqual([]);
});
test("live | API failure or empty catalog hides illustrative offerings",async({page})=>{
 const errors=errorsOn(page);
 await routeInstitutional(page,{broken:true});
 await page.goto("/espaco-das-velas.html");
 await expect(page.locator("#candle-offerings .offering-card")).toHaveCount(0);
 await expect(page.locator("#candle-offerings [data-api-error]")).toBeVisible();
 await expect(page.locator("[data-confirm-offering]")).toHaveCount(0);
 await page.goto("/conheca-a-loja.html");
 await expect(page.locator("#official-story .official-story-entry")).toHaveCount(0);
 await expect(page.locator("#official-story .institutional-story-note")).toContainText("temporariamente indisponível");
 await expect(page.locator("#official-story").getByRole("button",{name:"Tentar novamente"})).toBeVisible();
 expect(errors).toEqual([]);
});

test("live | editorial examples fill unpublished sections without creating commercial offers",async({page})=>{
 await routeInstitutional(page,{empty:true});
 await page.goto("/espaco-das-velas.html");
 await expect(page.locator("#candle-offerings .content-preview-card")).toHaveCount(3);
 await expect(page.locator("#offering-filters")).toBeVisible();
 await page.getByRole("button",{name:"Oficinas",exact:true}).click();
 await expect(page.locator("#candle-offerings .content-preview-card")).toHaveCount(1);
 await expect(page.locator("#candle-offerings")).toContainText("Oficinas criativas");
 await expect(page.locator("[data-confirm-offering]")).toHaveCount(0);
 await page.goto("/conheca-a-loja.html");
 await expect(page.locator("#official-story .story-preview")).toContainText("Uma essência, muitas histórias");
 await expect(page.locator("#official-story .official-story-entry")).toHaveCount(0);
});
