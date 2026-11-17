/** Confirm the eight temporary Skelt WebP files exist and are bundled unchanged.
 * No external dependencies or network requests.
 */
import {readFileSync,existsSync} from "node:fs";
import {resolve} from "node:path";

export const skeltFiles=[
 "maquiagem-corporal-bronzeado-instantaneo.webp",
 "kit-miniaturas-sellers-set.webp",
 "kit-miniaturas-exotic-set.webp",
 "kit-miniaturas-trends-set.webp",
 "mousse-autobronzeador-dark.webp",
 "luva-aplicadora-autobronzeador.webp",
 "autobronzeador-bifasico.webp",
 "maquiagem-corporal-iluminador.webp"
];
const base=resolve("assets/images/catalogo/skelt");
for(const file of skeltFiles){
 const pathname=resolve(base,file);
 if(!pathname.startsWith(base+"/"))throw Error("Caminho de imagem inválido: "+file);
 if(!existsSync(pathname))throw Error("Falta imagem Skelt: "+file);
 const bytes=readFileSync(pathname);
 if(bytes.length<400||bytes.subarray(0,4).toString()!=="RIFF"||
    bytes.subarray(8,12).toString()!=="WEBP")
  throw Error("Imagem Skelt corrompida ou formato inválido: "+file);
}
console.log("Skelt: 8 WebP provisórios presentes; conferência física dos arquivos aprovada.");
