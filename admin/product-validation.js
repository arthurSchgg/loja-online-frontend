/** Friendly frontend checks for the backend's product publication contract.
 * Spring Boot remains the authority and repeats these validations.
 */
export function validateProductImages(images,published){
 if(!Array.isArray(images)||images.length>12)
  throw new Error("O produto aceita no máximo 12 imagens.");
 if(published && images.length===0)
  throw new Error("Adicione pelo menos uma imagem antes de publicar. Você também pode salvar como rascunho.");
 for(const image of images){
  const value=typeof image?.url==="string"?image.url.trim():"";
  if(/^assets\/images\/catalogo\/[a-z0-9-]+\/[a-z0-9-]+\.webp$/.test(value))continue;
  let url;
  try{url=new URL(value);}catch{throw new Error("Informe uma URL HTTPS ou arquivo WebP local do catálogo.");}
  if(url.protocol!=="https:"||!url.hostname||url.username||url.password||url.port||value.length>2048)
   throw new Error("Imagem deve ter URL HTTPS pública ou arquivo WebP do catálogo.");
 }
 return images;
}
