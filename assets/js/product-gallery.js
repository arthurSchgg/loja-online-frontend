/** Validated image sequence for the public product gallery.
 * Protects DOM attributes from untrusted URLs and does not infer inventory.
 * Product images always come from the API; only a known local fallback is used.
 */
export function safeProductPhotoUrl(raw,{origin="https://example.invalid"}={}){
 if(typeof raw!=="string"||!raw.trim()||raw.length>2048)return null;
 try{
  const url=new URL(raw,origin);
  if(url.protocol==="https:"||(url.origin===origin&&url.protocol==="http:"))return url.href;
 }catch{}
 return null;
}
export function productGalleryImages(product,{origin="https://example.invalid",fallback="assets/images/brand/product-photo-pending.svg"}={}){
 const seen=new Set();
 const images=Array.isArray(product?.images)?product.images:[];
 const ranked=images.map((item,index)=>({item,index,position:Number(item?.position)}))
  .sort((a,b)=>(Number.isFinite(a.position)?a.position:a.index)-(Number.isFinite(b.position)?b.position:b.index));
 const result=[];
 for(const {item} of ranked){
  if(result.length>=12)break;
  const url=safeProductPhotoUrl(item?.url,{origin});
  if(!url||seen.has(url))continue;
  seen.add(url);
  result.push({
   url,
   alt:String(item?.altText||product?.name||"Imagem do produto").slice(0,220)
  });
 }
 if(!result.length){
  const url=safeProductPhotoUrl(fallback,{origin});
  if(url)result.push({url,alt:String(product?.name||"Imagem do produto").slice(0,220)});
 }
 return result;
}
