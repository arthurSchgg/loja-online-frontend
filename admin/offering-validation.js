/** Match administrative OfferingRequest limits; server is authoritative. */
import {photoReference} from "./photo-editor.js";
export function validateOfferingFields(data){
 if(!data||typeof data.title!=="string"||!data.title.trim()||data.title.length>180)
  throw new Error("Título do serviço é obrigatório e deve ter até 180 caracteres.");
 if(typeof data.description!=="string"||data.description.length>4000)
  throw new Error("Descrição do serviço deve ter até 4.000 caracteres.");
 if(!["CANDLE","WORKSHOP","RENTAL"].includes(data.type))
  throw new Error("Tipo de serviço inválido.");
 if(data.price!==null&&data.price!==undefined){
  const amount=Number(data.price);
  if(!Number.isFinite(amount)||amount<0||!/^[0-9]{1,10}(?:\.[0-9]{1,2})?$/.test(String(data.price)))
   throw new Error("Valor do serviço deve ter até duas casas decimais.");
 }
 if(data.imageUrl&&!photoReference(data.imageUrl))throw new Error("Escolha uma foto da biblioteca ou URL HTTPS válida.");
 return data;
}
