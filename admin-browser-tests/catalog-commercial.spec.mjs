import {test,expect} from "@playwright/test";

test("admin | manual availability is not overwritten by zero stock and consultation price is explicit",async({page})=>{
 let submitted=null;
 const product={id:12,name:"Produto de homologação",description:"",
  price:90,effectivePrice:90,priceStatus:"CONFIRMED",available:false,manualAvailable:true,
  published:true,stockQuantity:0,brand:{id:1,name:"Marca"},categories:[],
  images:[{url:"https://example.invalid/photo.webp",altText:"Foto",position:0}]};
 await page.route("**/api/v1/**",async route=>{
  const req=route.request(),path=new URL(req.url()).pathname;
  let body={},status=200;
  if(path==="/api/v1/auth/csrf")body={headerName:"X-CSRF-TOKEN",token:"mock-token"};
  else if(path==="/api/v1/auth/me")body={authenticated:true,username:"gestora"};
  else if(path==="/api/v1/admin/brands")body=[{id:1,name:"Marca",active:true}];
  else if(path==="/api/v1/admin/categories")body=[];
  else if(path==="/api/v1/admin/products")body={content:[product],last:true};
  else if(path==="/api/v1/admin/products/12"&&req.method()==="PUT"){
   submitted=req.postDataJSON();body={...product,...submitted};
  }else status=404;
  await route.fulfill({status,contentType:"application/json",body:JSON.stringify(body)});
 });
 await page.goto("/admin.html");
 await expect(page.locator("#admin-workspace")).toBeVisible();
 await page.locator("#admin-module").selectOption("products");
 await page.getByRole("button",{name:"Editar",exact:true}).click();
 const form=page.locator("#edit-form");
 await expect(form.locator('[name="available"]')).toBeChecked();
 await form.locator('[name="priceStatus"]').selectOption("ON_REQUEST");
 await expect(form.locator('[name="price"]')).toBeDisabled();
 await page.locator("#save-button").click();
 await expect.poll(()=>submitted?.priceStatus).toBe("ON_REQUEST");
 expect(submitted.price).toBeNull();
 expect(submitted.available).toBe(true);
});
