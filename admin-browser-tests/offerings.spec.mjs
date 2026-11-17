import {test,expect} from "@playwright/test";

test("admin | administrator updates candle options using same-origin API and CSRF",async({page})=>{
 const errors=[];page.on("pageerror",error=>errors.push(error.message));
 let options=[{kind:"AROMA",label:"Lavanda",position:0,active:true}];
 let submitted=null;
 await page.route("**/api/v1/**",async route=>{
  const req=route.request(),path=new URL(req.url()).pathname;
  let status=200,body={};
  if(path==="/api/v1/auth/csrf")body={headerName:"X-CSRF-TOKEN",token:"mock-only-csrf"};
  else if(path==="/api/v1/auth/me")body={authenticated:true,username:"gestora"};
  else if(path==="/api/v1/admin/brands")body=[];
  else if(path==="/api/v1/admin/offerings")body=[{id:5,title:"Vela teste",type:"CANDLE",price:50,available:true,published:false,options}];
  else if(path==="/api/v1/admin/offerings/5"&&req.method()==="GET")
   body={id:5,title:"Vela teste",type:"CANDLE",price:50,available:true,published:false,options};
  else if(path==="/api/v1/admin/offerings/5/options"&&req.method()==="PUT"){
   expect(req.headers()["x-csrf-token"]).toBe("mock-only-csrf");
   submitted=req.postDataJSON();options=submitted.options;body=options;
  }else{status=404;body={message:"Rota de teste não configurada"};}
  await route.fulfill({status,contentType:"application/json",body:JSON.stringify(body)});
 });
 await page.goto("/admin.html");
 await expect(page.locator("#admin-workspace")).toBeVisible();
 await page.locator("#admin-module").selectOption("offerings");
 await expect(page.locator("#admin-records")).toContainText("Vela teste");
 await page.getByRole("button",{name:"Aromas / cores"}).click();
 await expect(page.locator("#record-tool-dialog")).toBeVisible();
 await expect(page.locator("#record-tool-body textarea").first()).toHaveValue("Lavanda");
 await page.locator("#record-tool-body textarea").first().fill("Lavanda\nBaunilha");
 await page.getByRole("button",{name:"Salvar opções"}).click();
 await expect.poll(()=>submitted?.options?.length).toBe(2);
 expect(submitted.options).toEqual([
  {kind:"AROMA",label:"Lavanda",position:0,active:true},
  {kind:"AROMA",label:"Baunilha",position:1,active:true}
 ]);
 expect(errors).toEqual([]);
});
