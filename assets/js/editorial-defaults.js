/** Editorial text only. Never a persisted product, service, campaign or contact. */
export const STORY_PREVIEW = Object.freeze({
 title:"Uma essência, muitas histórias",
 body:"A perfumaria é um convite para descobrir novos aromas, celebrar pequenos momentos e transformar escolhas em lembranças. Explore fragrâncias, ideias para presentear e o universo das velas."
});
export const SERVICE_PREVIEWS = Object.freeze([
 {type:"CANDLE",title:"Velas aromáticas",description:"Inspirações de aromas e acabamentos para criar uma atmosfera acolhedora.",symbol:"✽"},
 {type:"WORKSHOP",title:"Oficinas criativas",description:"Ideias para explorar a criatividade e descobrir o universo das fragrâncias.",symbol:"✦"},
 {type:"RENTAL",title:"Momentos especiais",description:"Inspirações para tornar encontros e celebrações mais memoráveis.",symbol:"◇"}
]);
export const CATEGORY_PREVIEWS = Object.freeze([
 {title:"Fragrâncias",description:"Descubra diferentes estilos de perfume.",symbol:"✿"},
 {title:"Presentes",description:"Inspirações para ocasiões especiais.",symbol:"✧"},
 {title:"Cuidados",description:"Pequenos rituais para o dia a dia.",symbol:"✺"},
 {title:"Velas",description:"Conheça o universo dos aromas para ambientes.",symbol:"◇"}
]);
export function previewCard({title,description,symbol},label="Inspiração ilustrativa"){
 const article=document.createElement("article");
 article.className="content-preview-card";article.dataset.reveal="";
 const icon=document.createElement("span");icon.className="content-preview-symbol";icon.textContent=symbol||"✧";icon.setAttribute("aria-hidden","true");
 const eyebrow=document.createElement("span");eyebrow.className="eyebrow";eyebrow.textContent=label;
 const heading=document.createElement("h3");heading.textContent=title;
 const copy=document.createElement("p");copy.textContent=description;
 article.append(icon,eyebrow,heading,copy);
 return article;
}
export function renderServicePreviews(grid,type="ALL"){
 const items=SERVICE_PREVIEWS.filter(item=>type==="ALL"||item.type===type);
 grid.replaceChildren(...items.map(item=>previewCard(item)));
}
