import "./layout.js";
import {isLive} from "./config.js";
import {fetchContentSections} from "./api.js";
const el=(tag,text)=>{const e=document.createElement(tag);e.textContent=text;return e;};
async function showOwnerPolicy(){
 const target=document.getElementById("privacy-owner-content"),fallback=document.getElementById("privacy-operational-notice");
 if(!isLive||!target||!fallback)return;
 try{
  const sections=await fetchContentSections();
  const policy=sections.find(x=>["politica-de-privacidade","privacidade","privacy"].includes(x.slug)&&typeof x.body==="string"&&x.body.trim());
  if(!policy)return;
  const title=el("h2",policy.title),body=el("p",policy.body);body.className="privacy-actual-body";
  target.replaceChildren(title,body);target.hidden=false;fallback.hidden=true;
 }catch{/* Retain the accurate operational notice when the API is unavailable. */}
}
void showOwnerPolicy();
