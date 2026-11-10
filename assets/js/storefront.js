import {PERFUMES,FAMILIES,money} from "./data.js";
import {productCard,escapeHtml,toast} from "./layout.js";
const grid=document.getElementById("featured-grid");if(grid)grid.innerHTML=PERFUMES.filter(p=>p.bestseller).slice(0,4).map(productCard).join("");
const quiz=document.getElementById("quiz-form");
quiz?.addEventListener("submit",e=>{
 e.preventDefault();
 const family=new FormData(quiz).get("family");const target=FAMILIES.includes(family)?family:"Floral";
 const match=PERFUMES.find(p=>p.family===target);const box=document.getElementById("quiz-result");
 if(box){box.hidden=false;box.innerHTML='<strong>Seu universo: '+escapeHtml(target)+'</strong><p>Conheça '+escapeHtml(match.name)+' — '+money(match.prices[50])+' (valor fictício).</p><a class="text-link" href="catalogo.html?familia='+encodeURIComponent(target)+'">Explorar essa família</a>';}
});
const news=document.getElementById("newsletter-form");
news?.addEventListener("submit",e=>{e.preventDefault();toast("Demonstração: nenhum e-mail foi enviado ou armazenado.");news.reset();});
