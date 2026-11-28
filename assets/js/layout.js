import {PERFUMES,byId,money,price} from "./data.js";
import {addItem,changeQuantity,totalCount,readBag} from "./cart.js";
import {isLive} from "./config.js";
import {UI_ICONS} from "./ui-icons.js";
import {mountShell} from "../modern/storefront.js";
export const escapeHtml=value=>String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let bag=[];
// Never read stale demonstration items when actual products are served by the API.
try{if(!isLive)bag=readBag(window.sessionStorage);}catch{}
const demoNotice="Coleção ilustrativa, preços fictícios. Sem pagamento ou pedido real. Consulte a loja pelo canal oficial após confirmação de preço e disponibilidade.";
export function productCard(p){
 return {id:p.id,name:p.name,category:p.family+" · "+p.gender,description:p.description,image:p.image,theme:p.theme,price:money(price(p)),state:"demo"};
}
let updateBagCount=()=>{};
function renderShell(){
 updateBagCount=mountShell({live:isLive,count:totalCount(bag),openBag});
 const drawer=document.getElementById("cart-dialog");
 if(drawer)drawer.innerHTML='<div class="drawer-inner"><div class="drawer-head"><h2 id="bag-heading">Sua sacola</h2><button type="button" class="icon-button icon-button--close" data-close-cart aria-label="Fechar sacola">'+UI_ICONS.close+'</button></div><div class="drawer-items" id="cart-items"></div><div class="drawer-footer"><strong id="bag-total"></strong><small>'+escapeHtml(demoNotice)+'</small><button class="btn btn--primary btn--full" type="button" id="copy-bag">Copiar resumo ilustrativo</button></div></div>';
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
 if(isLive)drawer?.remove();
 renderBag();
}
function saveBag(){if(isLive)return;try{window.sessionStorage.setItem("katia-demo-bag",JSON.stringify(bag));}catch{}renderBag();}
function renderBag(){
 const count=totalCount(bag);
 updateBagCount(count);
 const el=document.getElementById("cart-items");if(!el)return;
 el.innerHTML=bag.length?bag.map(x=>{const p=byId(x.id);if(!p)return "";return '<div class="drawer-item"><img src="'+p.image+'" alt=""><div><strong>'+escapeHtml(p.name)+'</strong><small>'+x.size+' ml · '+money(price(p,x.size))+' (fictício)</small><div class="qty-control"><button type="button" data-cart-change="-1" data-id="'+p.id+'" data-size="'+x.size+'" aria-label="Diminuir quantidade">'+UI_ICONS.minus+'</button><span>'+x.qty+'</span><button type="button" data-cart-change="1" data-id="'+p.id+'" data-size="'+x.size+'" aria-label="Aumentar quantidade">'+UI_ICONS.plus+'</button></div></div></div>';}).join(""):'<p class="muted">Sua sacola de interesse está vazia.</p>';
 const total=bag.reduce((sum,x)=>{const p=byId(x.id);return sum+(p?price(p,x.size)*x.qty:0);},0);
 document.getElementById("bag-total").textContent="Subtotal ilustrativo: "+money(total);
}
export function openBag(){if(isLive)return;const dialog=document.getElementById("cart-dialog");if(dialog&&!dialog.open)dialog.showModal();}
export function toast(message){const toastEl=document.getElementById("toast");if(!toastEl)return;toastEl.textContent=message;toastEl.hidden=false;window.clearTimeout(toastEl._timer);toastEl._timer=window.setTimeout(()=>toastEl.hidden=true,3600);}
renderShell();
