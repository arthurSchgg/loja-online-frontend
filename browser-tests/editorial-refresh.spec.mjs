import {test,expect} from "@playwright/test";

test("demo | refined hero, sticky navigation and back-to-top remain usable",async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 await page.goto("/index.html");
 await expect(page.locator(".hero-title-line")).toHaveCount(2);
 await expect(page.getByRole("link",{name:"Descubra a coleção"})).toBeVisible();
 await page.getByRole("link",{name:"Descubra a coleção"}).click();
 const top=page.getByRole("button",{name:"Voltar ao topo"});
 await expect(top).toBeVisible();
 await expect(page.locator(".site-header")).toHaveAttribute("data-scrolled","true");
 await expect.poll(async()=> (await page.locator(".site-header").boundingBox())?.y).toBeGreaterThanOrEqual(-2);
 await expect.poll(async()=> (await page.locator(".site-header").boundingBox())?.y).toBeLessThan(50);
 await top.click();
 await expect.poll(()=>page.evaluate(()=>window.scrollY)).toBeLessThan(10);
 await expect(top).toBeHidden();
});

test("motion | mobile reduced-motion navigation and card controls stay available",async({page})=>{
 await page.setViewportSize({width:375,height:812});
 await page.emulateMedia({reducedMotion:"reduce"});
 await page.goto("/index.html");
 await expect(page.locator(".hero-title-line").first()).toHaveCSS("opacity","1");
 await expect(page.locator(".hero-frame-outline")).toBeVisible();
 const toggle=page.getByRole("button",{name:"Abrir menu"});
 await toggle.click();
 await expect(page.locator("#mobile-links")).toBeVisible();
 await expect(page.locator("#mobile-links .menu-index")).toHaveCount(6);
 await page.keyboard.press("Escape");
 await expect(toggle).toBeFocused();
 await expect(page.locator("#mobile-links")).toBeHidden();
 await expect(page.locator(".product-card .product-visual-action").first()).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
});

test("demo | sans-serif typography and squared buttons are consistent",async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 for(const path of ["/index.html","/catalogo.html","/conheca-a-loja.html"]){
  await page.goto(path);
  await expect(page.locator("h1").first()).toHaveCSS("font-family",/DM Sans/);
  if(path!=="/catalogo.html")await expect(page.locator(".btn--primary").first()).toHaveCSS("border-top-left-radius","9px");
  await expect(page.locator(".icon-button--search")).toHaveCSS("border-top-left-radius","9px");
 }
});
