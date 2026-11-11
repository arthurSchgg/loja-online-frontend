/** Validations aligned with Spring Boot DTOs. Backend always revalidates. */
export function parseCategoryIds(raw){
 const value=String(raw??"").trim();
 if(!value)return [];
 const parts=value.split(",").map(x=>x.trim());
 if(parts.some(x=>!/^\d+$/.test(x)||!Number.isSafeInteger(Number(x))||Number(x)<1))
  throw new Error("Informe IDs de categorias positivos separados por vírgula (ex.: 1,2,3).");
 const ids=parts.map(Number);
 if(new Set(ids).size!==ids.length)throw new Error("Não repita a mesma categoria.");
 return ids;
}
export function validateProductFields({name,description,price,brandId,categoryIds,images,published}){
 if(typeof name!=="string"||!name.trim()||name.length>180)throw new Error("Informe um nome de produto com até 180 caracteres.");
 if(typeof description==="string"&&description.length>4000)throw new Error("Descrição limitada a 4.000 caracteres.");
 const amount=Number(price);
 if(price===null||price===""||!Number.isFinite(amount)||amount<0||
    !/^\d{1,10}(?:\.\d{1,2})?$/.test(String(price)))
  throw new Error("Informe um preço válido com até duas casas decimais.");
 if(!Number.isSafeInteger(Number(brandId))||Number(brandId)<1)
  throw new Error("Informe um ID de marca positivo.");
 if(!Array.isArray(categoryIds)||categoryIds.some(x=>!Number.isSafeInteger(x)||x<1))
  throw new Error("Categorias inválidas.");
 return true;
}
export function validateStockMovement({type,quantity,reason}){
 const amount=Number(quantity);
 if(!["ENTRY","EXIT","ADJUSTMENT"].includes(type)||quantity===""||
    !Number.isSafeInteger(amount)||amount<0||amount>2147483647||
    (type!=="ADJUSTMENT"&&amount===0))
  throw new Error("Quantidade inválida para a movimentação.");
 if(typeof reason!=="string"||!reason.trim()||reason.trim().length>500)
  throw new Error("Informe uma justificativa de até 500 caracteres.");
 return {type,quantity:amount,reason:reason.trim()};
}
export function validatePromotion({price,basePrice,startsAt,endsAt}){
 const amount=Number(price),base=Number(basePrice);
 if(price===""||!Number.isFinite(amount)||amount<=0||!/^\d{1,10}(?:\.\d{1,2})?$/.test(String(price)))
  throw new Error("Preço promocional inválido.");
 if(!Number.isFinite(base)||base<=0||amount>=base)
  throw new Error("Preço promocional deve ser menor que o preço base do produto.");
 const begins=new Date(startsAt),ends=new Date(endsAt);
 if(!startsAt||!endsAt||!Number.isFinite(begins.getTime())||!Number.isFinite(ends.getTime())||
    begins>=ends)
  throw new Error("Período inválido: o fim deve ser posterior ao início.");
 return {promotionalPrice:amount,startsAt:begins.toISOString(),endsAt:ends.toISOString()};
}
