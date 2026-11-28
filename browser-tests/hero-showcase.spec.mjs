import {test,expect} from "@playwright/test";

test("demo | cinematic perfume composition switches automatically every 30 seconds without selectors",async({page})=>{
 const videos=[];
 page.on("request",request=>{if(request.url().endsWith(".mp4"))videos.push(request.url());});
 await page.setViewportSize({width:1440,height:900});
 await page.clock.install();
 await page.goto("/index.html");
 const scene=page.locator("[data-hero-showcase]");
 await expect(scene).toBeVisible();
 await expect(page.locator("[data-hero-live]")).toBeHidden();
 await expect(scene.locator("[data-showcase-bottle] img")).toHaveCount(3);
 await expect(scene).toHaveAttribute("data-playing","true");
 await expect(scene.locator("[data-showcase-select]")).toHaveCount(0);
 await expect(scene).toHaveAttribute("data-active","0");
 await page.clock.fastForward(30000);
 await expect(scene).toHaveAttribute("data-active","1");
 await expect(scene.locator('[data-showcase-bottle="1"]')).toHaveAttribute("data-position","front");
 await expect(scene.locator("[data-showcase-title]")).toHaveText("Presença intensa");
 await page.clock.fastForward(30000);
 await expect(scene.locator('[data-showcase-bottle="2"]')).toHaveAttribute("data-position","front");
 await scene.getByRole("button",{name:"Pausar animação dos perfumes"}).click();
 await expect(scene.getByRole("button",{name:"Reproduzir animação dos perfumes"})).toHaveAttribute("aria-pressed","true");
 await page.clock.fastForward(30000);
 await expect(scene).toHaveAttribute("data-active","2");
 expect(videos).toEqual([]);
});

test("motion | reduced motion displays the static composition",async({page})=>{
 await page.emulateMedia({reducedMotion:"reduce"});
 await page.setViewportSize({width:375,height:812});
 await page.goto("/index.html");
 const scene=page.locator("[data-hero-showcase]");
 await expect(scene).toBeVisible();
 await expect(scene).toHaveAttribute("data-playing","false");
 await expect(scene.locator("[data-showcase-pause]")).toBeHidden();
 await expect(scene.locator("[data-showcase-select]")).toHaveCount(0);
 await expect(scene.locator('[data-showcase-bottle="0"]')).toHaveAttribute("data-position","front");
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
});
