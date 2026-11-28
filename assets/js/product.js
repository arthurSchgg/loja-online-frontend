import {byId,PERFUMES,price,money,SIZES} from "./data.js";
import {isLive} from "./config.js";
import {productCard,escapeHtml} from "./layout.js";
import {renderProductGrid} from "../modern/storefront.js";
if(!isLive){
const params=new URLSearchParams(location.search),p=byId(params.get("id")),host=document.getElementById("product-content"),related=document.getElementById("related-grid");
if(host){
 if(!p){host.innerHTML='<div class="container section"><h1>Fragrância não encontrada</h1><p>Explore nossa coleção demonstrativa.</p><a href="catalogo.html" class="btn btn--primary">Voltar ao catálogo</a></div>';document.title="Não encontrado | Lojinha da Kátia";}
 else{
  let selected=50;
  const list=arr=>arr.map(s=>"<span>"+escapeHtml(s)+"</span>").join("");
  host.innerHTML='<div class="container product-view"><div class="product-main-art" style="--product-theme:'+p.theme+'"><img id="product-img" src="'+p.image+'" alt="Ilustração de frasco '+escapeHtml(p.name)+'" width="400" height="530" title="Clique para ampliar" tabindex="0" role="button" aria-label="Ampliar imagem"></div><div class="product-detail"><span class="eyebrow">'+escapeHtml(p.family)+' · Coleção demonstrativa</span><h1>'+escapeHtml(p.name)+'</h1><p class="lead">'+escapeHtml(p.description)+'</p><div class="notes-grid"><div><strong>Notas de topo</strong>'+list(p.top)+'</div><div><strong>Notas de coração</strong>'+list(p.heart)+'</div><div><strong>Notas de fundo</strong>'+list(p.base)+'</div></div><div class="product-actions"><p class="eyebrow">Escolha seu volume</p><div id="size-choice" class="segmented" aria-label="Volume em mililitros">'+SIZES.map(s=>'<button type="button" data-size="'+s+'" aria-pressed="'+(s===50)+'">'+s+' ml</button>').join("")+'</div><h2 id="selected-price" style="font-family:var(--font-body);font-size:1.25rem;margin:25px 0">'+money(price(p))+' <small>(fictício)</small></h2><button class="btn btn--primary" id="add-selected" type="button" data-add="'+p.id+'" data-size="50">Adicionar à sacola</button> <button type="button" class="btn btn--ghost" id="sample">Sobre amostras</button><p class="muted" style="margin-top:22px">Não há avaliações verificadas nem amostras confirmadas nesta demonstração. A disponibilidade e o valor real dependem da loja.</p></div></div></div>';
  document.title=p.name+" | Lojinha da Kátia";
  document.getElementById("size-choice")?.addEventListener("click",e=>{const b=e.target.closest("[data-size]");if(!b)return;selected=Number(b.dataset.size);document.querySelectorAll("#size-choice button").forEach(x=>x.setAttribute("aria-pressed",String(Number(x.dataset.size)===selected)));document.getElementById("selected-price").innerHTML=money(price(p,selected))+" <small>(fictício)</small>";document.getElementById("add-selected").dataset.size=String(selected);});
  const img=document.getElementById("product-img");const zoom=()=>img.classList.toggle("zoomed");img.addEventListener("click",zoom);img.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();zoom();}});
  document.getElementById("sample")?.addEventListener("click",()=>alert("Amostras são ilustrativas nesta demonstração. Consulte disponibilidade com a loja."));
  if(related)renderProductGrid(related,PERFUMES.filter(x=>x.id!==p.id&&(x.family===p.family)).slice(0,4).map(productCard));
 }
}

} // end demo-only renderer; live product handled by live.js
