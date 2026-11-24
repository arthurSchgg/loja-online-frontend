import {test,expect} from "@playwright/test";

test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
test("admin on a phone: choose brand/category, upload photos, change cover, and save with CSRF",async({page})=>{
 const requests=[],errors=[],photos=[
  "/api/v1/media/e0ac23e2-f496-4f7d-b570-ef66b45db10d",
  "/api/v1/media/e0ac23e2-f496-4f7d-b570-ef66b45db10e"
 ];
 page.on("pageerror",e=>errors.push(e.message));
 const png=Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jJ0cAAAAASUVORK5CYII=","base64");
 let uploads=0,submitted;
 await page.route("**/api/v1/**",async route=>{
  const request=route.request(),path=new URL(request.url()).pathname,method=request.method();
  let body={},status=200;
  if(path.endsWith("/auth/csrf"))body={headerName:"X-CSRF-TOKEN",token:"mock-owner-csrf"};
  else if(path.endsWith("/auth/me"))body={authenticated:true,username:"gestora-teste"};
  else if(path.endsWith("/admin/brands"))body=[{id:7,name:"Marca de teste",active:true}];
  else if(path.endsWith("/admin/categories"))body=[{id:8,name:"Categoria de teste",active:true}];
  else if(path.endsWith("/admin/products")&&method==="GET")body={content:[],last:true};
  else if(path.endsWith("/admin/products")&&method==="POST"){submitted=request.postDataJSON();body={id:1,...submitted};status=201;}
  else if(path.endsWith("/admin/media")&&method==="POST"){
   expect(request.headers()["x-csrf-token"]).toBe("mock-owner-csrf");
   expect(request.headers()["content-type"]).toMatch(/^multipart\/form-data; boundary=/);
   body={url:photos[uploads++],used:false};status=201;
  }else if(path.includes("/admin/media/")){
   await route.fulfill({status:200,body:png,contentType:"image/png"});return;
  }else status=404;
  requests.push({path,method,status});
  await route.fulfill({status,contentType:"application/json",body:JSON.stringify(body)});
 });
 await page.goto("/admin.html");
 await expect(page.locator("#admin-workspace")).toBeVisible();
 await page.locator("#admin-module").selectOption("products");
 const form=page.locator("#edit-form");
 await form.locator('[name="name"]').fill("Produto fictício");
 await form.locator('[name="price"]').fill("50");
 await form.locator('select[aria-label="Marca"]').selectOption("7");
 await form.getByLabel("Categoria de teste",{exact:true}).check();
 await form.locator('input[type="file"]').setInputFiles([
  {name:"foto1.png",mimeType:"image/png",buffer:png},{name:"foto2.png",mimeType:"image/png",buffer:png}
 ]);
 await expect(form.locator(".photo-row")).toHaveCount(2);
 await form.locator(".photo-row").nth(1).getByRole("button",{name:"Subir",exact:true}).click();
 await expect(form.locator(".photo-row").first().locator("img")).toHaveAttribute("src",photos[1].replace("/media/","/admin/media/"));
 await form.locator('[name="published"]').check();
 await page.locator("#save-button").click();
 await expect.poll(()=>submitted?.images?.length).toBe(2);
 expect(submitted.brandId).toBe(7);
 expect(submitted.categoryIds).toEqual([8]);
 expect(submitted.images.map(x=>x.url)).toEqual([photos[1],photos[0]]);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 expect(errors).toEqual([]);
});
