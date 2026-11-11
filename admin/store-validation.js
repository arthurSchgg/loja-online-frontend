/** Validate institutional details before sending them to the administrator API.
 * Blank values are allowed: the owner has not necessarily provided every channel.
 */
export function validateStoreFields(data){
 if(!data||typeof data.displayName!=="string"||!data.displayName.trim()||data.displayName.length>180)
  throw new Error("Informe o nome da loja com até 180 caracteres.");
 for(const [name,max,label] of [
  ["slogan",240,"Slogan"],["description",4000,"Descrição"],
  ["openingHours",500,"Horários"],["address",500,"Endereço"],
  ["region",180,"Região de atendimento"]]){
  const value=data[name];
  if(value!==null&&value!==undefined&&(typeof value!=="string"||value.length>max))
   throw new Error(label+" deve ter até "+max+" caracteres.");
 }
 const phone=String(data.whatsapp??"").trim();
 if(phone&&!/^\\+?[0-9]{10,15}$/.test(phone))
  throw new Error("WhatsApp deve conter DDI, DDD e telefone com apenas dígitos.");
 const social=String(data.instagramUrl??"").trim();
 if(social){
  let url;
  try{url=new URL(social);}catch{throw new Error("Informe uma URL válida do Instagram.");}
  if(social.length>2048||url.protocol!=="https:"||url.username||url.password||url.port||url.hash||
     !["instagram.com","www.instagram.com"].includes(url.hostname.toLowerCase()))
   throw new Error("Informe uma URL HTTPS válida do Instagram oficial.");
 }
 const email=String(data.email??"").trim();
 if(email&&(email.length>254||! /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)))
  throw new Error("E-mail de contato inválido.");
 return true;
}
