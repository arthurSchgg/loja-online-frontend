import {test,expect} from "@playwright/test";

test("demo | studio loads the 3D bundle only on demand and can be closed",async({page})=>{
 const requested=[];
 page.on("request",request=>requested.push(request.url()));
 await page.goto("/index.html");
 const toggle=page.getByRole("button",{name:"Explorar em 3D"});
 await expect(toggle).toBeVisible();
 expect(requested.some(url=>/\/FragranceStudio-.*\.js$/.test(url))).toBe(false);
 await toggle.click();
 await expect(page.getByRole("button",{name:"Fechar experiência 3D"})).toHaveAttribute("aria-expanded","true");
 await expect(page.locator("#studio-angle")).toBeVisible({timeout:15000});
 expect(requested.some(url=>/\/FragranceStudio-.*\.js$/.test(url))).toBe(true);
 await page.getByRole("button",{name:"Girar para a direita"}).click();
 await expect(page.locator("#studio-angle")).toHaveValue("40");
 await page.getByRole("button",{name:"âmbar",exact:true}).click();
 await expect(page.getByRole("button",{name:"âmbar",exact:true})).toHaveAttribute("aria-pressed","true");
 await page.getByRole("button",{name:"Reiniciar visualização"}).click();
 await expect(page.locator("#studio-angle")).toHaveValue("25");
 await page.getByRole("button",{name:"Fechar experiência 3D"}).click();
 await expect(page.locator("#studio-angle")).toHaveCount(0);
 await expect(toggle).toHaveAttribute("aria-expanded","false");
});
