/** Sacola ilustrativa: somente IDs, tamanhos e quantidades; sem checkout/pagamento. */
export const MAX_QTY=9;
export function normalizedItem(id,size,qty=1){
 const s=Number(size),q=Number(qty);
 if(typeof id!=="string"||!id||![30,50,100].includes(s)||!Number.isInteger(q)||q<1||q>MAX_QTY)throw new RangeError("Item inválido");
 return {id,size:s,qty:q};
}
export function addItem(items,item){
 const next=items.map(x=>({...x}));const incoming=normalizedItem(item.id,item.size,item.qty??1);
 const prev=next.find(x=>x.id===incoming.id&&x.size===incoming.size);
 if(prev)prev.qty=Math.min(MAX_QTY,prev.qty+incoming.qty);else next.push(incoming);
 return next;
}
export function changeQuantity(items,id,size,delta){
 return items.map(x=>x.id===id&&x.size===size?{...x,qty:Math.min(MAX_QTY,Math.max(0,x.qty+delta))}:x).filter(x=>x.qty>0);
}
export function totalCount(items){return items.reduce((sum,x)=>sum+x.qty,0);}
export function readBag(storage){
 try{const parsed=JSON.parse(storage.getItem("katia-demo-bag")||"[]");
  return Array.isArray(parsed)?parsed.filter(x=>x&&typeof x.id==="string"&&[30,50,100].includes(x.size)&&Number.isInteger(x.qty)&&x.qty>0&&x.qty<=MAX_QTY).slice(0,30):[];
 }catch{return [];}
}
