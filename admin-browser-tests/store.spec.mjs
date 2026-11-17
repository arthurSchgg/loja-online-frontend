import {test,expect} from "@playwright/test";

test("admin | store details are saved through authenticated same-origin API",async({page})=>{
 let store={displayName:"Lojinha da Kátia",slogan:"",description:"",
  whatsapp:null,instagramUrl:null,email:null,openingHours:null,address:null,region:null};
 let sent=null;
 await page.route("**/api/v1/**",async route=>{
  const req=route.request(),pathname=new URL(req.url()).pathname;
  let status=200,body={};
  if(pathname==="/api/v1/auth/csrf")
   body={headerName:"X-CSRF-TOKEN",token:"staging-mock-token"};
  else if(pathname==="/api/v1/auth/me")
   body={authenticated:true,username:"gestora"};
  else if(pathname==="/api/v1/admin/brands")body=[];
  else if(pathname==="/api/v1/store")body=store;
  else if(pathname==="/api/v1/admin/store"&&req.method()==="PUT"){
   expect(req.headers()["x-csrf-token"]).toBe("staging-mock-token");
   sent=req.postDataJSON();store={...store,...sent};
   body=store;
  }else{status=404;body={message:"Endpoint não configurado no teste"};}
  await route.fulfill({status,contentType:"application/json",body:JSON.stringify(body)});
 });
 await page.goto("/admin.html");
 await expect(page.locator("#admin-workspace")).toBeVisible();
 await page.locator("#admin-module").selectOption("store");
 await expect(page.locator('#edit-form [name="displayName"]')).toHaveValue("Lojinha da Kátia");
 await page.locator('#edit-form [name="openingHours"]').fill("Seg a Sex, 9h–18h");
 await page.locator('#edit-form [name="address"]').fill("Rua exemplo, 100");
 await page.locator('#edit-form [name="region"]').fill("SC");
 await page.locator("#save-button").click();
 await expect.poll(()=>sent?.openingHours).toBe("Seg a Sex, 9h–18h");
 expect(sent.address).toBe("Rua exemplo, 100");
 expect(sent.region).toBe("SC");
 await expect(page.locator("#admin-status")).toContainText("Dados salvos");
});

test("admin | invalid institutional WhatsApp is rejected without any update request",async({page})=>{
 let updates=0;
 await page.route("**/api/v1/**",async route=>{
  const req=route.request(),path=new URL(req.url()).pathname;
  let body={},status=200;
  if(path==="/api/v1/auth/me")body={authenticated:true,username:"gestora"};
  else if(path==="/api/v1/auth/csrf")body={headerName:"X-CSRF-TOKEN",token:"test"};
  else if(path==="/api/v1/admin/brands")body=[];
  else if(path==="/api/v1/store")body={displayName:"Loja",slogan:""};
  else if(path==="/api/v1/admin/store"){updates++;body={};}
  else {status=404;body={message:"Not mocked"};}
  await route.fulfill({status,contentType:"application/json",body:JSON.stringify(body)});
 });
 await page.goto("/admin.html");
 await page.locator("#admin-module").selectOption("store");
 await expect(page.locator('#edit-form [name="displayName"]')).toHaveValue("Loja");
 await page.locator('#edit-form [name="whatsapp"]').fill("1234");
 await page.locator("#save-button").click();
 await expect(page.locator("#admin-status")).toContainText("WhatsApp");
 expect(updates).toBe(0);
});
