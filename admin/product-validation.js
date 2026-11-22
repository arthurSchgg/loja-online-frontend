/** Friendly frontend checks for the backend's product publication contract.
 * Spring Boot remains the authority and repeats these validations.
 */
import {photoReference} from "./photo-editor.js";
export function validateProductImages(images,published){
 if(!Array.isArray(images)||images.length>12)
  throw new Error("O produto aceita no máximo 12 imagens.");
 if(published && images.length===0)
  throw new Error("Adicione pelo menos uma imagem antes de publicar. Você também pode salvar como rascunho.");
 const distinct=new Set();
 for(const image of images){
  const value=typeof image?.url==="string"?image.url.trim():"";
  if(!photoReference(value))throw new Error("Escolha uma foto da biblioteca ou um endereço HTTPS válido.");
  if(distinct.has(value))throw new Error("Não repita a mesma foto.");
  distinct.add(value);
 }
 return images;
}
