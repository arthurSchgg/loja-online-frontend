/** Catálogo ilustrativo; nunca confundir esses valores com preços reais da loja. */
export const FAMILIES = ["Floral","Cítrico","Amadeirado","Oriental"];
export const SIZES = [30,50,100];
const sample = [
 ["aurora-de-petalas","Aurora de Pétalas","Floral","Feminino","Delicadeza luminosa para manhãs especiais.","Bergamota|Pera","Peônia|Rosa branca","Almíscar|Cedro",129,198,289,"#ecd0d7",true],
 ["ambar-de-seda","Âmbar de Seda","Oriental","Unissex","Uma lembrança quente, sofisticada e envolvente.","Cardamomo|Pimenta rosa","Âmbar|Flor de laranjeira","Sândalo|Baunilha",149,229,329,"#e8cab4",true],
 ["jardim-secreto","Jardim Secreto","Floral","Unissex","Verde e poético, como um jardim depois da chuva.","Folha de figo|Chá verde","Jasmim|Frésia","Musgo|Cedro",139,209,309,"#d6e1d3",false],
 ["brisa-de-capri","Brisa de Capri","Cítrico","Unissex","A liberdade de um verão à beira-mar.","Limão-siciliano|Mandarina","Néroli|Flor de laranjeira","Vetiver|Madeira clara",119,189,279,"#e6e4bd",true],
 ["noite-de-veludo","Noite de Veludo","Oriental","Unissex","Um rastro intrigante de pétalas e especiarias.","Pimenta rosa|Ameixa","Íris|Rosa escura","Patchouli|Baunilha",159,249,359,"#ddd0de",true],
 ["madeira-do-sol","Madeira do Sol","Amadeirado","Masculino","Força serena de madeiras sob o sol.","Toranja|Alecrim","Cedro|Lavanda","Âmbar branco|Vetiver",139,219,319,"#dacfc0",false],
 ["iris-de-inverno","Íris de Inverno","Floral","Unissex","A poesia tranquila dos dias frios.","Pera|Bergamota","Íris|Violeta","Almíscar branco|Madeira de cashmere",145,225,325,"#d8e2e8",false],
 ["costa-dourada","Costa Dourada","Cítrico","Unissex","Mandarina e luz dourada no fim da tarde.","Mandarina|Gengibre","Flor de laranjeira|Magnólia","Madeira suave|Âmbar leve",129,199,299,"#eee0bd",false]
];
export const PERFUMES = sample.map(([id,name,family,gender,description,top,heart,base,p30,p50,p100,theme,bestseller])=>({
 id,name,family,gender,description,top:top.split("|"),heart:heart.split("|"),base:base.split("|"),
 prices:{30:p30,50:p50,100:p100},theme,bestseller,available:true,
 image:"assets/images/perfumes/"+id+".svg"
}));
export const money = value => new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(value);
export function byId(id){return PERFUMES.find(p=>p.id===id)||null;}
export function price(p,size=50){return Number(p.prices[Number(size)]??p.prices[50]);}
export function filterPerfumes({query="",family="",gender="",size="",min=0,max=Infinity,sort="featured"}={}){
 let out=PERFUMES.filter(p=>{
  const haystack=(p.name+" "+p.family+" "+p.description+" "+p.top.join(" ")+" "+p.heart.join(" ")).toLocaleLowerCase("pt-BR");
  return (!query||haystack.includes(query.toLocaleLowerCase("pt-BR"))) &&(!family||p.family===family)&&(!gender||p.gender===gender)&&(!size||Object.hasOwn(p.prices,String(size)))&&price(p,size||50)>=Number(min)&&price(p,size||50)<=Number(max);
 });
 if(sort==="price-asc")out.sort((a,b)=>price(a,size||50)-price(b,size||50));
 if(sort==="price-desc")out.sort((a,b)=>price(b,size||50)-price(a,size||50));
 if(sort==="name")out.sort((a,b)=>a.name.localeCompare(b.name,"pt-BR"));
 if(sort==="new")out.reverse();
 return out;
}
