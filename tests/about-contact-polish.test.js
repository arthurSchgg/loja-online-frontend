import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {officialStoreLinks} from "../assets/js/official-contact.js";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const about=read("conheca-a-loja.html");
const contact=read("contato.html");
const institutional=read("assets/js/institutional.js");
const contactScript=read("assets/js/public-extra.js");
const contactComponent=read("src/components/Contact.tsx");
const institutionalCss=read("assets/css/institutional.css");
const contactCss=read("assets/css/public-extra.css");

test("Floratta editorial stamp uses a neutral SVG instead of the green iOS emoji",()=>{
 assert.doesNotMatch(about,/carinho em cada escolha\s*✳/);
 assert.match(about,/carinho em cada escolha <svg class="chapter-story__stamp-icon"/);
 assert.match(about,/stroke="currentColor"/);
 assert.match(about,/aria-hidden="true" focusable="false"/);
 assert.match(institutionalCss,/\.chapter-story__stamp-icon\{width:16px;height:16px/);
 assert.match(institutionalCss,/\.chapter-story__stamp\{display:inline-flex;align-items:center/);
});

test("the about page no longer shows a harsh boxed API failure in the story",()=>{
 assert.match(institutional,/function storyNote\(target,message,retry=false\)/);
 assert.match(institutional,/storyNote\(story,"Nossa história está temporariamente indisponível/);
 assert.match(institutional,/else storyPreview\(story\)/);
 assert.doesNotMatch(institutional,/status\(story,"Não foi possível carregar a história oficial/);
 assert.match(institutionalCss,/\.institutional-story-note\{/);
 assert.match(about,/id="official-story"/);
});

test("no official contact is fabricated when API or store settings are empty",()=>{
 assert.deepEqual(officialStoreLinks({}),[]);
 assert.deepEqual(officialStoreLinks({whatsapp:"",instagramUrl:"",email:""}),[]);
 assert.match(institutional,/const links=officialStoreLinks\(store\)/);
 assert.match(institutional,/contactNote\(contacts,"Os canais oficiais estão temporariamente indisponíveis\.",true\)/);
 assert.match(contactScript,/const channels=officialStoreLinks\(store\)/);
 assert.match(contactComponent,/query.isError \? "Canais temporariamente indisponíveis" : "Canais em atualização"/);
 assert.match(contactComponent,/Nenhum contato não confirmado será exibido/);
 assert.match(contactScript,/const fields=\[/);
 assert.match(contactCss,/\.contact-empty\{/);
 assert.match(contact,/id="contact-links"/);
});

test("the contact page uses a professional vector arrow and safe retry action",()=>{
 assert.match(contactComponent,/import \{ ArrowUpRight \} from "lucide-react"/);
 assert.match(contactComponent,/<ArrowUpRight aria-hidden="true"/);
 assert.doesNotMatch(contactComponent,/channel\.label\+" ↗"/);
 assert.match(contactComponent,/onClick=\{\(\) => void query.refetch\(\)\}/);
 assert.match(contactCss,/\.contact-channel svg\{/);
 assert.match(contactComponent,/rel=\{channel.external \? "noopener noreferrer" : undefined\}/);
});
