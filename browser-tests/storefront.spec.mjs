import {test,expect} from "@playwright/test";

const product = {
 id:7, name:"Velas de Teste", description:"Produto fictício para validar o fluxo",
 price:89.90, effectivePrice:79.90, available:true, published:true,
 brand:{id:2,name:"Marca Teste"}, categories:[{id:1,name:"Presentes"}],
 images:[{url:"https://example.invalid/cover.jpg",position:0,altText:"Capa de teste"}],
};

function collectPageErrors(page){
 const errors=[];
 page.on("pageerror",error=>errors.push(error.message));
 return errors;
}

async function expectNoHorizontalOverflow(page, width){
 const measured=await page.evaluate(()=>({
  viewport:document.documentElement.clientWidth,
  document:document.documentElement.scrollWidth,
  body:document.body.scrollWidth,
 }));
 expect(measured.viewport).toBe(width);
 expect(measured.document,"document overflow at "+width+"px").toBeLessThanOrEqual(width+2);
}

async function mockPublicBackend(page,{status=200}={}){
 await page.route("**/api/v1/**",async route=>{
  const req=route.request(),url=new URL(req.url()),path=url.pathname;
  if(status!==200){
   return route.fulfill({status,contentType:"application/json",body:'{"message":"Serviço indisponível"}'});
  }
  let output;
  if(path==="/api/v1/products"){
   const query=(url.searchParams.get("q")||"").toLocaleLowerCase("pt-BR");
   const visible=!query || product.name.toLocaleLowerCase("pt-BR").includes(query);
   output={content:visible?[product]:[],last:true};
  }else if(path==="/api/v1/products/7")output=product;
  else if(path==="/api/v1/categories")output=[{id:1,name:"Presentes"}];
  else if(path==="/api/v1/store")output={displayName:"Loja de Teste",whatsapp:null,instagramUrl:null,email:null};
  else if(path==="/api/v1/offerings"||path==="/api/v1/experiences")output=[];
  else if(path==="/api/v1/whatsapp/confirm"&&req.method()==="POST"){
   const body=req.postDataJSON();
   expect(body).toMatchObject({type:"PRODUCT",id:7,expectedPrice:79.9});
   output={url:"https://wa.me/5547999999999?text=Consulta",message:"Consulta confirmada"};
  }else return route.fulfill({status:404,contentType:"application/json",body:"{}"});
  return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(output)});
 });
}

for(const width of [320,375,430,768,1024,1440]){
 test("demo | home responsive at "+width+"px",async({page})=>{
  await page.setViewportSize({width,height:850});
  const errors=collectPageErrors(page);
  await page.goto("/index.html");
  await expect(page.locator(".hero h1")).toBeVisible();
  await expect(page.locator("#featured-grid .product-card")).toHaveCount(4);
  await expect(page.locator("#site-header .brand")).toBeVisible();
  await expectNoHorizontalOverflow(page,width);
  if(width<=1024){
   const toggle=page.locator("[data-mobile-toggle]"),menu=page.locator("#mobile-links");
   await expect(toggle).toBeVisible();
   await toggle.click();
   await expect(menu).toBeVisible();
   await expect(toggle).toHaveAttribute("aria-expanded","true");
   await page.keyboard.press("Escape");
   await expect(menu).toBeHidden();
   await expect(toggle).toBeFocused();
  }
  expect(errors).toEqual([]);
 });
}

test("demo | product filters and product detail remain interactive",async({page})=>{
 const errors=collectPageErrors(page);
 await page.goto("/catalogo.html");
 await expect(page.locator("#catalog-grid .product-card")).toHaveCount(8);
 await page.locator("#search").fill("produto-que-nao-existe");
 await expect(page.locator("#catalog-grid .product-card")).toHaveCount(0);
 await page.locator("#search").fill("");
 await expect(page.locator("#catalog-grid .product-card")).toHaveCount(8);
 await page.locator("#family").selectOption("Floral");
 const count=await page.locator("#catalog-grid .product-card").count();
 expect(count).toBeGreaterThan(0);
 expect(count).toBeLessThan(8);
 await page.locator("#catalog-grid .product-card a").first().click();
 await expect(page).toHaveURL(/produto\.html\?id=/);
 await expect(page.locator("#product-img")).toBeVisible();
 await page.locator("#add-selected").click();
 await expect(page.locator("#cart-dialog")).toBeVisible();
 expect(errors).toEqual([]);
});

test("demo | quiz and reduced-motion preference work without errors",async({page})=>{
 await page.emulateMedia({reducedMotion:"reduce"});
 const errors=collectPageErrors(page);
 await page.goto("/index.html");
 await page.locator('#quiz-form input[value="Floral"]').check();
 await page.locator('#quiz-form button[type="submit"]').click();
 await expect(page.locator("#quiz-result")).toBeVisible();
 await expect(page.locator("#quiz-result")).toContainText("Floral");
 expect(await page.evaluate(()=>matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(true);
 expect(errors).toEqual([]);
});

test("live | published product, categories, no demo basket and confirmed WhatsApp",async({page})=>{
 const errors=collectPageErrors(page);
 await mockPublicBackend(page);
 await page.goto("/index.html");
 await expect(page.locator("#featured-grid .product-card")).toHaveCount(1);
 await expect(page.locator("#featured-grid")).toContainText(product.name);
 await expect(page.locator("#newsletter-form")).toHaveCount(0);
 await expect(page.locator("[data-open-cart]")).toHaveCount(0);
 await expect(page.locator("#familias .family-tile")).toHaveCount(1);
 await page.goto("/catalogo.html");
 await expect(page.locator("#catalog-grid .product-card")).toHaveCount(1);
 await expect(page.locator("#catalog-grid")).toContainText("R$");
 await page.locator('#search').fill("sem resultados");
 await expect(page.locator("#catalog-grid .product-card")).toHaveCount(0);
 await page.locator('#search').fill("");
 await expect(page.locator("#catalog-grid .product-card")).toHaveCount(1);
 await page.locator("#catalog-grid [data-confirm-product]").click();
 await expect(page.locator("#whatsapp-confirm-dialog")).toBeVisible();
 await page.locator("#send-confirm").click();
 await expect(page.locator("#confirmed-link a")).toHaveAttribute("href",/^https:\/\/wa\.me\/5547999999999/);
 expect(errors).toEqual([]);
});

test("live | failed public API never falls back to fictitious products",async({page})=>{
 const errors=collectPageErrors(page);
 await mockPublicBackend(page,{status:503});
 await page.goto("/catalogo.html");
 await expect(page.locator("#catalog-grid .product-card")).toHaveCount(0);
 await expect(page.locator("#catalog-grid [data-api-status]")).toContainText("Não foi possível");
 expect(errors).toEqual([]);
});
