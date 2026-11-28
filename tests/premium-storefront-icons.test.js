import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {UI_ICONS} from "../assets/js/ui-icons.js";

const source = path => readFileSync(new URL("../"+path,import.meta.url),"utf8");
const shell=source("src/components/Shell.tsx");
const live=source("assets/js/live.js");
const base=source("assets/css/base.css");
const components=source("assets/css/components.css");

test("public action icons are original outline SVGs, not font-dependent glyphs",()=>{
 for(const name of ["search","bag","menu","close","plus","minus"]){
  const markup=UI_ICONS[name];
  assert.match(markup,/^<svg class="ui-icon"/);
  assert.match(markup,/viewBox="0 0 24 24"/);
  assert.match(markup,/aria-hidden="true"/);
  assert.match(markup,/stroke="currentColor"/);
  assert.match(markup,/<\/svg>$/);
 }
 assert.equal(Object.keys(UI_ICONS).length,6);
 assert.doesNotMatch(shell,/[⌕♧☰✕＋−]/u);
 assert.doesNotMatch(live,/✕/u);
});

test("header actions have accessible labels, deliberate search link and mobile menu state",()=>{
 assert.match(shell,/href="catalogo.html#search" aria-label="Buscar produtos no catálogo"/);
 assert.match(shell,/data-open-cart\s+aria-label=\{count === 0 \? "Abrir sacola demonstrativa"/);
 assert.match(shell,/data-mobile-toggle aria-controls="mobile-links" aria-expanded=\{open\}/);
 assert.match(shell,/aria-label=\{open \? "Fechar menu" : "Abrir menu"\}/);
 assert.match(shell,/event.key === "Escape"/);
 assert.match(source("assets/js/catalog.js"),/location.hash==="#search"/);
 assert.match(base,/\.header-actions \.icon-button[^\n]*width:44px;height:44px/);
 assert.match(base,/\.mobile-toggle\[aria-expanded="true"\]/);
 assert.match(base,/@media\(max-width:560px\)/);
});

test("demo bag has visual count, touch-size controls and no appearance in live mode",()=>{
 assert.match(shell,/className="cart-count" data-cart-count hidden=\{count === 0\}/);
 assert.match(shell,/count === 1 \? "item" : "itens"/);
 assert.match(shell,/!live && <button[^>]+data-open-cart/);
 assert.match(source("assets/js/layout.js"),/if\(isLive\)drawer\?\.remove\(\)/);
 assert.match(components,/\.qty-control button\{width:44px;height:44px/);
 assert.match(components,/\.drawer\{height:100dvh/);
});

test("all editorial CTAs use inline text-safe vectors instead of iPad emoji arrows",()=>{
 for(const page of ["index.html","contato.html","viva-sua-experiencia.html"]){
  const html=source(page);
  assert.doesNotMatch(html,/↗/);
  assert.match(html,/class="cta-icon" viewBox="0 0 24 24" aria-hidden="true"/);
 }
 assert.match(components,/\.cta-icon\{/);
 assert.match(base,/prefers-reduced-motion:reduce/);
 assert.doesNotMatch(live,/↗/);
});
