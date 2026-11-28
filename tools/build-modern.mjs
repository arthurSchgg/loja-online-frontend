import { build } from "vite";
import { resolve } from "node:path";

// Static MPA deployment retains existing routes and same-origin API contracts.
// Bundle all runtime dependencies locally; the CSP stays script-src 'self'.
export async function buildModern(root, destination, admin = false) {
 await build({
  configFile:false,
  root,
  publicDir:false,
  build:{
   target:"es2022",
   outDir:resolve(destination,admin?"admin/modern":"assets/modern"),
   emptyOutDir:true,
   sourcemap:false,
   lib:{entry:admin?{dashboard:resolve(root,"src/admin/dashboard.tsx")}:{storefront:resolve(root,"src/storefront.tsx"),"public-extra":resolve(root,"src/public-extra.tsx")},formats:["es"],fileName:(_format,name)=>name+".js"},
   minify:"esbuild",
   rollupOptions:{onwarn(warning,handler){if(warning.code!=="MODULE_LEVEL_DIRECTIVE")handler(warning);}}
  },
  define:{"process.env.NODE_ENV":JSON.stringify("production")}
 });
}
