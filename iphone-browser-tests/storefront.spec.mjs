import {test,expect} from "@playwright/test";

const product={
 id:901,name:"Perfume Âmbar de Teste",description:"Cadastro fictício para homologação do navegador",
 price:100,effectivePrice:90,priceStatus:"CONFIRMED",stockQuantity:2,
 available:true,published:true,brand:{id:91,name:"Marca de Teste"},
 categories:[{id:92,name:"Floral"}],
 images:[{url:"assets/images/brand/product-photo-pending.svg",position:0,altText:"Imagem de teste"}],
};
const pending={...product,id:902,name:"Perfume Rosa de Teste",price:null,effectivePrice:null,
 priceStatus:"ON_REQUEST",stockQuantity:0,available:false};

function errorsOn(page){
 const errors=[];
 page.on("pageerror",err=>errors.push(err.message));
 return errors;
}

async function noOverflow(page){
 const sizes=await page.evaluate(()=>({width:document.documentElement.clientWidth,
  scroll:document.documentElement.scrollWidth}));
 expect(sizes.width).toBe(393);
 expect(sizes.scroll).toBeLessThanOrEqual(sizes.width+2);
}

async function mockApi(page){
 // This suite exclusively exercises local fixtures; it never opens a real
 // WhatsApp conversation or connects to the production backend.
 await page.route("**/api/v1/**",async route=>{
  const request=route.request(),url=new URL(request.url());
  let body;
  if(url.pathname==="/api/v1/products"){
   const query=(url.searchParams.get("q")||"").toLocaleLowerCase("pt-BR");
   body={content:[product,pending].filter(p=>p.name.toLocaleLowerCase("pt-BR").includes(query)),last:true};
  }else if(url.pathname==="/api/v1/products/901")body=product;
  else if(url.pathname==="/api/v1/products/902")body=pending;
  else if(url.pathname==="/api/v1/categories")body=[{id:92,name:"Floral"}];
  else if(url.pathname==="/api/v1/store")body={displayName:"Loja de Teste"};
  else if(url.pathname==="/api/v1/whatsapp/confirm"&&request.method()==="POST"){
   expect(request.postDataJSON()).toMatchObject({type:"PRODUCT",id:901,expectedPrice:90});
   body={url:"https://wa.me/5500000000000?text=Teste",message:"Consulta fictícia confirmada"};
  }else body=[];
  return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(body)});
 });
}

test("iPhone 15 WebKit | touch menu, catalog, search and pending price",async({page})=>{
 const errors=errorsOn(page);
 await mockApi(page);
 await page.goto("/index.html",{waitUntil:"domcontentloaded"});
 expect(await page.evaluate(async()=> (await import("/assets/js/config.js")).isLive)).toBe(true);
 await expect(page.locator(".hero h1")).toBeVisible();
 await expect(page.locator("#featured-grid .product-card")).toHaveCount(2);
 await noOverflow(page);
 const toggle=page.locator("[data-mobile-toggle]"),menu=page.locator("#mobile-links");
 await toggle.tap();
 await expect(menu).toBeVisible();
 await expect(toggle).toHaveAttribute("aria-expanded","true");
 await menu.getByRole("link",{name:"Explore os Produtos",exact:true}).tap();
 await expect(page).toHaveURL(/catalogo\.html/);
 await expect(page.locator("#catalog-grid .product-card")).toHaveCount(2);
 await noOverflow(page);
 await page.locator("#search").fill("Rosa de Teste");
 await expect(page.locator("#catalog-grid .product-card")).toHaveCount(1);
 const card=page.locator("#catalog-grid .product-card").first();
 await expect(card).toContainText("Valor sob consulta");
 await expect(card.locator("[data-confirm-product]")).toHaveCount(0);
 await noOverflow(page);
 expect(errors).toEqual([]);
});

test("iPhone 15 WebKit | touch consultation, confirmed value and close dialog",async({page})=>{
 const errors=errorsOn(page);
 await mockApi(page);
 await page.goto("/catalogo.html",{waitUntil:"domcontentloaded"});
 await expect(page.locator("#catalog-grid .product-card")).toHaveCount(2);
 const action=page.locator('#catalog-grid [data-confirm-product="901"]');
 await action.tap();
 const dialog=page.locator("#whatsapp-confirm-dialog");
 await expect(dialog).toBeVisible();
 await expect(dialog.locator("#confirmed-link a")).toHaveCount(0);
 await noOverflow(page);
 await dialog.locator("#send-confirm").tap();
 await expect(dialog.locator("#confirmed-link a")).toHaveAttribute("href",/^https:\/\/wa\.me\/5500000000000\?/);
 await dialog.locator("#close-confirm").tap();
 await expect(dialog).toBeHidden();
 await action.tap();
 await expect(dialog.locator("#confirmed-link a")).toHaveCount(0);
 await dialog.locator("#close-confirm").tap();
 expect(errors).toEqual([]);
});
