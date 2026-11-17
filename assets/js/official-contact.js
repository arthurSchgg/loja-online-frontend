/** Validated public contact channels; no default or invented addresses. */
export function officialStoreLinks(store){
 if(!store||typeof store!=="object")return [];
 const links=[];
 const rawPhone=String(store.whatsapp??"").trim();
 if(/^\+?[0-9]{10,15}$/.test(rawPhone)){
  links.push({label:"Conversar pelo WhatsApp",href:"https://wa.me/"+rawPhone.replace(/^\+/,""),external:true});
 }
 const rawInstagram=String(store.instagramUrl??"").trim();
 if(rawInstagram){
  try{
   const url=new URL(rawInstagram);
   if(url.protocol==="https:"&&!url.username&&!url.password&&!url.port&&
      ["instagram.com","www.instagram.com"].includes(url.hostname.toLowerCase())){
    links.push({label:"Conhecer o Instagram",href:url.origin+url.pathname,external:true});
   }
  }catch{}
 }
 const email=String(store.email??"").trim();
 if(email.length<=254&&/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(email)){
  links.push({label:"Enviar e-mail",href:"mailto:"+email,external:false});
 }
 return links;
}
