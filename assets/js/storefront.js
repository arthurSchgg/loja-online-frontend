import {PERFUMES,FAMILIES,money} from "./data.js";
import {isLive} from "./config.js";
import {productCard,escapeHtml,toast} from "./layout.js";
import {mountStudioPreview,renderProductGrid} from "../modern/storefront.js";
mountStudioPreview();
// Demo pages retain an explicit disclaimer; the live site reads real catalog data.
if(!isLive){const disclaimer=document.querySelector(".hero-copy > p.muted");if(disclaimer)disclaimer.textContent="Conceito demonstrativo · valores fictícios";}
const grid=document.getElementById("featured-grid");if(!isLive&&grid)renderProductGrid(grid,PERFUMES.filter(p=>p.bestseller).slice(0,4).map(productCard));
const quiz=document.getElementById("quiz-form");
if(!isLive)quiz?.addEventListener("submit",e=>{
 e.preventDefault();
 const family=new FormData(quiz).get("family");const target=FAMILIES.includes(family)?family:"Floral";
 const match=PERFUMES.find(p=>p.family===target);const box=document.getElementById("quiz-result");
 if(box){box.hidden=false;box.innerHTML='<strong>Seu universo: '+escapeHtml(target)+'</strong><p>Conheça '+escapeHtml(match.name)+' — '+money(match.prices[50])+' (valor fictício).</p><a class="text-link" href="catalogo.html?familia='+encodeURIComponent(target)+'">Explorar essa família</a>';}
});
const news=document.getElementById("newsletter-form");
news?.addEventListener("submit",e=>{e.preventDefault();toast("Demonstração: nenhum e-mail foi enviado ou armazenado.");news.reset();});
