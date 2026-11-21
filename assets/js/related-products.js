/** Related suggestions only from published API products.
 * No invented inventory, price or recommendation if brand/category do not match.
 */
export function relatedCatalogProducts(product,candidates,limit=4){
 if(!product||!Array.isArray(candidates))return [];
 const ownerId=Number(product.id);
 const brandId=Number(product.brand?.id);
 const categories=new Set((Array.isArray(product.categories)?product.categories:[])
  .map(c=>Number(c?.id)).filter(id=>Number.isSafeInteger(id)&&id>0));
 const ranked=[];
 const seen=new Set();
 candidates.forEach((item,index)=>{
  const id=Number(item?.id);
  if(!Number.isSafeInteger(id)||id<1||id===ownerId||item.published===false||seen.has(id))return;
  seen.add(id);
  const sameBrand=Number.isSafeInteger(brandId)&&brandId>0&&Number(item.brand?.id)===brandId;
  const categoryMatch=(Array.isArray(item.categories)?item.categories:[])
   .some(cat=>categories.has(Number(cat?.id)));
  const score=(sameBrand?2:0)+(categoryMatch?1:0);
  if(score)ranked.push({item,index,score});
 });
 return ranked.sort((a,b)=>b.score-a.score||a.index-b.index)
  .slice(0,Math.min(8,Math.max(0,Number(limit)||0))).map(row=>row.item);
}
