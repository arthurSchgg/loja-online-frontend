import {PERFUMES,byId,money,price} from "./data.js";
import {addItem,changeQuantity,totalCount,readBag} from "./cart.js";
import {isLive} from "./config.js";
export const escapeHtml=value=>String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let bag=[];
// Never read stale demonstration items when actual products are served by the API.
try{if(!isLive)bag=readBag(window.sessionStorage);}catch{}
const demoNotice="Coleção ilustrativa, preços fictícios. Sem pagamento ou pedido real. Consulte a loja pelo canal oficial após confirmação de preço e disponibilidade.";
export function productCard(p){
 return '<article class="product-card" style="--card-theme:'+p.theme+'"><a href="produto.html?id='+encodeURIComponent(p.id)+'" aria-label="Ver '+escapeHtml(p.name)+'"><div class="product-visual"><span class="badge">Conceito</span><img src="'+p.image+'" alt="Ilustração de frasco: '+escapeHtml(p.name)+'" loading="lazy" width="320" height="420"></div></a><div class="product-card__meta"><small>'+escapeHtml(p.family)+' · '+escapeHtml(p.gender)+'</small><h3><a href="produto.html?id='+encodeURIComponent(p.id)+'">'+escapeHtml(p.name)+'</a></h3><p>'+escapeHtml(p.description)+'</p><div class="product-card__bottom"><strong>Ilustrativo: '+money(price(p))+'</strong><button type="button" class="icon-button" data-add="'+p.id+'" aria-label="Adicionar '+escapeHtml(p.name)+' à sacola demonstrativa">＋</button></div></div></article>';
}
function renderShell(){
 const header=document.getElementById("site-header");
 if(header)header.innerHTML='<div class="announcement">LOJINHA DA KÁTIA · MAIS DO QUE COMPRAR, É VIVER UMA EXPERIÊNCIA · CONCEITO</div><header class="site-header"><div class="container header-inner"><a class="brand" href="index.html" aria-label="Lojinha da Kátia, início"><img src="assets/images/brand/logo-katia.svg" class="brand-mark" alt=""><span><strong>Lojinha da Kátia</strong><small>Perfumaria & afeto</small></span></a><nav class="nav-links" aria-label="Menu principal"><a href="index.html">Início</a><a href="catalogo.html">Fragrâncias</a><a href="index.html#familias">Famílias</a><a href="index.html#quiz">Descubra seu aroma</a><a href="index.html#experiencias">Experiências</a></nav><div class="header-actions"><a class="icon-button" href="catalogo.html" aria-label="Ver catálogo">⌕</a><button class="icon-button" type="button" data-open-cart aria-label="Abrir sacola">♧ <span data-cart-count>0</span></button><button class="icon-button mobile-toggle" type="button" data-mobile-toggle aria-controls="mobile-links" aria-expanded="false" aria-label="Abrir menu">☰</button></div></div><nav id="mobile-links" class="mobile-links" aria-label="Menu móvel" hidden><a href="index.html">Início</a><a href="catalogo.html">Perfumes</a><a href="index.html#familias">Famílias olfativas</a><a href="index.html#quiz">Quiz</a><a href="index.html#experiencias">Experiências</a></nav></header>';
 const footer=document.getElementById("site-footer");
 if(footer)footer.innerHTML='<footer class="site-footer"><div class="container"><div class="footer-grid"><div><span class="eyebrow">NOSSA ESSÊNCIA</span><h3>Lojinha da Kátia</h3><p>Mais do que comprar, é viver uma experiência.</p><p>Fragrâncias, presentes e pequenos rituais que deixam boas lembranças.</p></div><nav aria-label="Institucional"><strong>Explore</strong><a href="catalogo.html">Fragrâncias</a><a href="index.html#quiz">Encontre seu perfume</a><a href="index.html#experiencias">Espaço das Velas</a></nav><nav aria-label="Informações"><strong>Informações</strong><a href="privacidade.html">Privacidade</a><a href="index.html#contato">Contato</a><a href="https://github.com/arthurSchgg/loja-online-frontend" rel="noopener noreferrer" target="_blank">Projeto</a></nav></div><div class="footer-end"><span>© Lojinha da Kátia · Conceito demonstrativo</span><span>Sem checkout, pagamento ou pedidos neste site</span></div></div></footer>';
 const drawer=document.getElementById("cart-dialog");
 if(drawer)drawer.innerHTML='<div class="drawer-inner"><div class="drawer-head"><h2 id="bag-heading">Sua sacola</h2><button type="button" class="icon-button" data-close-cart aria-label="Fechar sacola">✕</button></div><div class="drawer-items" id="cart-items"></div><div class="drawer-footer"><strong id="bag-total"></strong><small>'+escapeHtml(demoNotice)+'</small><button class="btn btn--primary btn--full" type="button" id="copy-bag">Copiar resumo ilustrativo</button></div></div>';
 const menuButton=document.querySelector("[data-mobile-toggle]");
 const mobileMenu=document.getElementById("mobile-links");
 if(menuButton&&mobileMenu){
  const setMenuOpen=open=>{
   mobileMenu.hidden=!open;
   menuButton.setAttribute("aria-expanded",String(open));
   menuButton.setAttribute("aria-label",open?"Fechar menu":"Abrir menu");
  };
  menuButton.addEventListener("click",()=>setMenuOpen(mobileMenu.hidden));
  mobileMenu.addEventListener("click",event=>{
   if(event.target.closest("a"))setMenuOpen(false);
  });
  document.addEventListener("keydown",event=>{
   if(event.key==="Escape"&&!mobileMenu.hidden){
    setMenuOpen(false);
    menuButton.focus();
   }
  });
  document.addEventListener("click",event=>{
   if(!mobileMenu.hidden&&!mobileMenu.contains(event.target)&&
      !menuButton.contains(event.target))setMenuOpen(false);
  });
  window.matchMedia?.("(min-width: 1025px)").addEventListener?.("change",event=>{
   if(event.matches)setMenuOpen(false);
  });
 }
 document.querySelector("[data-open-cart]")?.addEventListener("click",openBag);
 document.querySelector("[data-close-cart]")?.addEventListener("click",()=>drawer?.close());
 drawer?.addEventListener("click",e=>{if(e.target===drawer)drawer.close();});
 document.getElementById("copy-bag")?.addEventListener("click",async()=>{
  const text="Sacola de interesse (DEMONSTRAÇÃO — confirmar disponibilidade e preço real):\n"+bag.map(x=>{const p=byId(x.id);return p?p.name+" · "+x.size+"ml · "+x.qty+" un.":"";}).filter(Boolean).join("\n");
  try{await navigator.clipboard.writeText(text);toast("Resumo ilustrativo copiado.");}catch{toast("Não foi possível copiar. Tente novamente.");}
 });
 document.addEventListener("click",e=>{
  const add=e.target.closest("[data-add]");
  if(add&&!isLive){const item=byId(add.dataset.add);if(item){bag=addItem(bag,{id:item.id,size:Number(add.dataset.size||50),qty:1});saveBag();openBag();}}
  const edit=e.target.closest("[data-cart-change]");
  if(edit){bag=changeQuantity(bag,edit.dataset.id,Number(edit.dataset.size),Number(edit.dataset.cartChange));saveBag();}
 });
 if(isLive){
  // Distinguish the published catalog from demonstration/editorial concepts.
  const notice=document.querySelector(".announcement");
  if(notice)notice.textContent="LOJINHA DA KÁTIA · MAIS DO QUE COMPRAR, É VIVER UMA EXPERIÊNCIA";
  // The real storefront only offers server-validated WhatsApp consultation.
  // Do not display a fictitious basket or subtotal on live pages.
  document.querySelector("[data-open-cart]")?.remove();
  drawer?.remove();
  const footerLabel=footer?.querySelector(".footer-end span");
  if(footerLabel)footerLabel.textContent="© Lojinha da Kátia · Catálogo publicado";
 }
 renderBag();
}
function saveBag(){if(isLive)return;try{window.sessionStorage.setItem("katia-demo-bag",JSON.stringify(bag));}catch{}renderBag();}
function renderBag(){
 document.querySelectorAll("[data-cart-count]").forEach(x=>x.textContent=String(totalCount(bag)));
 const el=document.getElementById("cart-items");if(!el)return;
 el.innerHTML=bag.length?bag.map(x=>{const p=byId(x.id);if(!p)return "";return '<div class="drawer-item"><img src="'+p.image+'" alt=""><div><strong>'+escapeHtml(p.name)+'</strong><small>'+x.size+' ml · '+money(price(p,x.size))+' (fictício)</small><div class="qty-control"><button type="button" data-cart-change="-1" data-id="'+p.id+'" data-size="'+x.size+'" aria-label="Diminuir quantidade">−</button><span>'+x.qty+'</span><button type="button" data-cart-change="1" data-id="'+p.id+'" data-size="'+x.size+'" aria-label="Aumentar quantidade">＋</button></div></div></div>';}).join(""):'<p class="muted">Sua sacola de interesse está vazia.</p>';
 const total=bag.reduce((sum,x)=>{const p=byId(x.id);return sum+(p?price(p,x.size)*x.qty:0);},0);
 document.getElementById("bag-total").textContent="Subtotal ilustrativo: "+money(total);
}
export function openBag(){if(isLive)return;const dialog=document.getElementById("cart-dialog");if(dialog&&!dialog.open)dialog.showModal();}
export function toast(message){const toastEl=document.getElementById("toast");if(!toastEl)return;toastEl.textContent=message;toastEl.hidden=false;window.clearTimeout(toastEl._timer);toastEl._timer=window.setTimeout(()=>toastEl.hidden=true,3600);}
renderShell();
