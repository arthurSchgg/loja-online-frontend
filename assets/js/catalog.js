import {FAMILIES,PERFUMES,filterPerfumes} from "./data.js";
import {isLive} from "./config.js";
import {productCard} from "./layout.js";
import {renderProductGrid} from "../modern/storefront.js";
const form=document.getElementById("filters"),grid=document.getElementById("catalog-grid"),result=document.getElementById("result-count");
// The header's magnifier deep-links to the real catalog search field.
if(location.hash==="#search"){
 const input=document.getElementById("search");
 if(input)requestAnimationFrame(()=>input.focus({preventScroll:true}));
}
if(!isLive&&form&&grid){
 const params=new URLSearchParams(location.search);if(FAMILIES.includes(params.get("familia")))form.elements.family.value=params.get("familia");
 function render(){
 const data=new FormData(form),filters=Object.fromEntries(data.entries());
 filters.min=0;filters.max=Number(filters.max||1000);
 const out=filterPerfumes(filters);result.textContent=out.length+" fragrâncias ilustrativas encontradas";
 renderProductGrid(grid,out.map(productCard),{title:"Nenhum perfume encontrado.",description:"Ajuste os filtros."});
 }
 form.addEventListener("input",render);form.addEventListener("change",render);render();
}
