/** These tests must talk to the REAL local HTTPS gateway, never intercept /api.
 * Do not save traces, screenshots or logs containing local staging credentials.
 */
import {test,expect} from "@playwright/test";

test("hml | public live pages use the real same-origin API",async({page})=>{
 const errors=[];
 page.on("pageerror",error=>errors.push(error.message));
 await page.goto("/");
 await expect(page.locator("main")).toBeVisible();
 await page.goto("/catalogo.html");
 await expect(page.locator("main")).toBeVisible();
 const api=await page.evaluate(async()=>{
  const [store,catalog]=await Promise.all([
   fetch("/api/v1/store",{credentials:"omit"}),
   fetch("/api/v1/products?page=0&size=12",{credentials:"omit"})
  ]);
  return {storeStatus:store.status,catalogStatus:catalog.status,
    storeType:store.headers.get("content-type"),
    catalogContent:(await catalog.json()).content};
 });
 expect(api.storeStatus).toBe(200);
 expect(api.catalogStatus).toBe(200);
 expect(api.storeType).toContain("application/json");
 expect(Array.isArray(api.catalogContent)).toBe(true);
 expect(errors).toEqual([]);
});

test("hml | a real session controls access to admin and quizzes",async({page})=>{
 const username=process.env.HML_ADMIN_USERNAME;
 const password=process.env.HML_ADMIN_PASSWORD;
 test.skip(!username||!password,"Set staging-only HML_ADMIN_USERNAME and HML_ADMIN_PASSWORD to run login.");
 await page.goto("/admin.html");
 await expect(page.locator("#login-panel")).toBeVisible();
 await expect(page.locator("#admin-workspace")).toBeHidden();
 await page.locator("#admin-username").fill(username);
 await page.locator("#admin-password").fill(password);
 await page.getByRole("button",{name:"Entrar com segurança"}).click();
 await expect(page.locator("#admin-workspace")).toBeVisible();
 await expect(page.locator("#admin-user")).toContainText(username);
 await page.goto("/admin-experiences.html");
 await expect(page.locator("#experiences-workspace")).toBeVisible();
 await page.goto("/admin.html");
 await expect(page.locator("#admin-workspace")).toBeVisible();
 await page.locator("#logout").click();
 await expect(page.locator("#login-panel")).toBeVisible();
 await expect(page.locator("#admin-workspace")).toBeHidden();
 const status=await page.evaluate(async()=>(
  await fetch("/api/v1/admin/brands",{credentials:"same-origin",cache:"no-store"})
 ).status);
 expect(status).toBe(401);
});
