/** Decorative editorial photos are remote product photographs. If a third-party
 * CDN refuses the image, show a neutral note instead of a broken image or
 * falsely substituting an unrelated product. No tracking or external JS.
 */
function installEditorialImageFallback(doc=globalThis.document){
 if(!doc)return;
 const replace=img=>{
  if(!(img instanceof HTMLImageElement)||!img.matches("[data-editorial-photo]"))return;
  const note=doc.createElement("span");
  note.className="editorial-photo-placeholder";
  note.setAttribute("role","status");
  note.textContent="Fotografia temporariamente indisponível";
  img.replaceWith(note);
 };
 doc.addEventListener("error",event=>replace(event.target),true);
 doc.querySelectorAll("img[data-editorial-photo]").forEach(img=>{
  if(img.complete&&img.naturalWidth===0)replace(img);
 });
}
installEditorialImageFallback();
export {installEditorialImageFallback};
