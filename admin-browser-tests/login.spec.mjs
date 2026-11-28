import {test,expect} from "@playwright/test";

async function serveAuth(page,authenticated){
 const requests=[];
 await page.route("**/api/v1/**",async route=>{
  const req=route.request(),url=new URL(req.url()),path=url.pathname;
  requests.push({path,method:req.method()});
  let body={},status=200;
  if(path==="/api/v1/auth/csrf")body={headerName:"X-CSRF-TOKEN",token:"mock-token"};
  else if(path==="/api/v1/auth/me")body={authenticated,username:"gestora"};
  else if(path==="/api/v1/auth/login")body={};
  else if(path==="/api/v1/admin/brands")body=[];
  else{body={message:"Rota não prevista no teste"};status=404;}
  await route.fulfill({status,contentType:"application/json",body:JSON.stringify(body)});
 });
 return requests;
}

test("admin | login POST does not unlock workspace when session is still unauthenticated",async({page})=>{
 const requests=await serveAuth(page,false);
 await page.goto("/admin.html");
 await expect(page.locator("#admin-workspace")).toBeHidden();
 await page.locator("#admin-username").fill("gestora");
 await page.locator("#admin-password").fill("senha-de-teste");
 await page.getByRole("button",{name:"Entrar com segurança"}).click();
 await expect(page.locator("#admin-status")).toContainText("Não foi possível confirmar a sessão");
 await expect(page.locator("#admin-workspace")).toBeHidden();
 await expect(page.locator("#admin-password")).toHaveValue("");
 expect(requests.some(r=>r.path==="/api/v1/auth/login"&&r.method==="POST")).toBe(true);
 expect(requests.some(r=>r.path.startsWith("/api/v1/admin/"))).toBe(false);
});

test("admin | verified session unlocks administrative workspace",async({page})=>{
 await serveAuth(page,true);
 await page.goto("/admin.html");
 await expect(page.locator("#admin-workspace")).toBeVisible();
 await expect(page.locator("#admin-user")).toContainText("gestora");
});

test("admin | React dashboard displays indicators and clears them when switching modules",async({page})=>{
 await page.route("**/api/v1/**",route=>{
  const path=new URL(route.request().url()).pathname;
  const fixtures={
   "/api/v1/auth/csrf":{headerName:"X-CSRF-TOKEN",token:"fixture-token"},
   "/api/v1/auth/me":{authenticated:true,username:"gestora"},
   "/api/v1/admin/products":{content:[{id:1,stockQuantity:2,price:null},{id:2,stockQuantity:6,price:100,effectivePrice:80}],last:true},
   "/api/v1/admin/brands":[],
   "/api/v1/admin/categories":[]
  };
  return route.fulfill({status:fixtures[path]===undefined?404:200,contentType:"application/json",body:JSON.stringify(fixtures[path]??{})});
 });
 await page.goto("/admin.html");
 await page.locator("#admin-module").selectOption("dashboard");
 await expect(page.locator(".dashboard-card").first()).toContainText("2");
 await expect(page.locator(".dashboard-card").nth(1)).toContainText("1");
 await page.getByRole("button",{name:"Gerenciar produtos"}).click();
 await expect(page.locator("#admin-module")).toHaveValue("products");
 await expect(page.locator(".dashboard-card")).toHaveCount(0);
 await expect(page.locator("#edit-form")).toBeVisible();
});
