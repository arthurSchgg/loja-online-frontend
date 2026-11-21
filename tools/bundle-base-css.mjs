import {readFileSync,writeFileSync} from "node:fs";
import {join} from "node:path";

/** The source remains independently editable. The built CSS removes the
 * @import waterfall without changing the cascade or the design tokens. */
export function bundleBaseCss(output){
 const basePath=join(output,"assets/css/base.css");
 const tokens=readFileSync(join(output,"assets/css/tokens.css"),"utf8");
 const base=readFileSync(basePath,"utf8");
 const dependency='@import url("./tokens.css");';
 if(!base.includes(dependency))throw new Error("Expected base CSS token dependency.");
 writeFileSync(basePath,base.replace(dependency,tokens));
}
