/** Lightweight progressive motion, without third-party executable CDN scripts.
 * All content remains visible if JavaScript, observers, or animations are unavailable.
 * No scroll hijacking; no timers running for offscreen/hidden pages.
 */
export const motionAllowed = (reducedMotion = false, saveData = false) =>
 !reducedMotion && !saveData;

export function safeThemeColor(value) {
 return typeof value === "string" && /^#[\da-f]{6}$/i.test(value) ? value : null;
}

export function revealDelay(index = 0) {
 return Math.min(Math.max(0, index) * 65, 260);
}

/** Small transform-only image movement tied to the viewport, never the document layout. */
export function imageScrollOffset(centerY, viewportHeight, limit = 14) {
 if(!Number.isFinite(centerY)||!Number.isFinite(viewportHeight)||viewportHeight<=0) return 0;
 return Math.max(-limit,Math.min(limit,(viewportHeight / 2 - centerY) / viewportHeight * limit * 2));
}

export function setupMotion({win = globalThis.window, doc = globalThis.document} = {}) {
 if (!win || !doc) return () => {};
 const preference = win.matchMedia?.("(prefers-reduced-motion: reduce)");
 const saveData = win.navigator?.connection?.saveData === true;
 const canAnimate = motionAllowed(preference?.matches === true, saveData);
 // CSS motion also respects the user's data-saving preference.
 if (saveData) doc.documentElement.dataset.motion = "off";
 const animationAvailable = typeof win.Element?.prototype?.animate === "function" ||
  typeof doc.documentElement?.animate === "function";
 const cleanups = [];
 let revealObserver, stageObserver, mutationObserver, imageObserver, raf = 0;
 const once = new WeakSet();
 const observedImages = new WeakSet();
 const visibleImages = new Set();
 // Product cards keep their elegant hover/reveal, but do not repaint every image on scroll.
 const imageSelector = "[data-parallax], .collection-tile img, .editorial-visual img";
 const revealSelector = "[data-reveal], .section-heading, .product-card, .family-tile, .collection-tile, .editorial-copy, .quiz-box";
 const matchingNodes = (node,selector) => node instanceof win.Element
  ? [...(node.matches(selector)?[node]:[]),...node.querySelectorAll(selector)] : [];
 // Gentle image depth is available on mobile too. Previously it was entirely
 // disabled below 769px, which made touch devices look static.
 const imageMotion = canAnimate && "IntersectionObserver" in win;
 const observeImages = node => {
  if(!imageObserver || !(node instanceof win.Element)) return;
  const candidates = matchingNodes(node,imageSelector);
  for(const image of candidates){
   if(observedImages.has(image)) continue;
   observedImages.add(image);
   imageObserver.observe(image);
  }
 };
 if(imageMotion){
  imageObserver = new win.IntersectionObserver(entries=>{
   for(const entry of entries){
    if(entry.isIntersecting) visibleImages.add(entry.target);
    else {
     visibleImages.delete(entry.target);
     entry.target.style.removeProperty("--motion-shift");
    }
   }
   schedule();
  }, {rootMargin:"60px 0px 60px 0px", threshold:0});
  observeImages(doc.body);
 }

 // Native Web Animations only run for elements in view; nothing is hidden by default.
 let observeReveal=()=>{};
 if (canAnimate && animationAvailable && "IntersectionObserver" in win) {
  revealObserver = new win.IntersectionObserver(entries => {
   for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    revealObserver.unobserve(entry.target);
    const el = entry.target;
    if (!el.isConnected || el.closest("[hidden]")||preference?.matches) continue;
    const index = [...(el.parentElement?.children ?? [])].indexOf(el);
    el.animate([
     {opacity: 0, transform: "translate3d(0, 20px, 0) scale(.988)"},
     {opacity: 1, transform: "translate3d(0, 0, 0) scale(1)"}
    ], {duration: 720, delay: revealDelay(index), easing: "cubic-bezier(.22,1,.36,1)"});
   }
  }, {threshold: 0.12, rootMargin: "0px 0px -4% 0px"});
  observeReveal = node => {
   const candidates = matchingNodes(node,revealSelector);
   for (const el of candidates) {
    if (once.has(el)) continue;
    once.add(el);
    revealObserver.observe(el);
   }
  };
  observeReveal(doc.body);
 }
 if ("MutationObserver" in win && (revealObserver||imageObserver)) {
  mutationObserver = new win.MutationObserver(changes => {
   // Filtering/pagination removes many nodes. Unobserve them so the observers
   // don't keep detached cards and images alive for the rest of the session.
   for(const change of changes)for(const child of change.removedNodes){
    for(const el of matchingNodes(child,revealSelector))if(!el.isConnected){
     revealObserver?.unobserve(el);once.delete(el);
    }
    for(const el of matchingNodes(child,imageSelector))if(!el.isConnected){
     imageObserver?.unobserve(el);observedImages.delete(el);visibleImages.delete(el);
    }
   }
   for (const change of changes)for (const child of change.addedNodes) {
    observeReveal(child);
    observeImages(child);
   }
   schedule();
  });
  mutationObserver.observe(doc.body, {childList: true, subtree: true});
 }

 if (canAnimate && animationAvailable) {
  doc.querySelectorAll("[data-hero-copy]").forEach((el, index) => el.animate([
   {opacity: 0, transform: "translate3d(0, 22px, 0)"},
   {opacity: 1, transform: "translate3d(0, 0, 0)"}
  ], {duration: 820, delay: 70 + index * 105, easing: "cubic-bezier(.22,1,.36,1)"}));
  doc.querySelector("[data-hero-bottle]")?.animate([
   {opacity: .9, transform: "translate3d(0, 20px, 0) scale(.985)"},
   {opacity: 1, transform: "translate3d(0, 0, 0) scale(1)"}
  ], {duration: 1000, delay: 120, easing: "cubic-bezier(.22,1,.36,1)"});
 }

 const stages = [...doc.querySelectorAll("[data-theme-stage]")];
 if ("IntersectionObserver" in win && stages.length) {
  stageObserver = new win.IntersectionObserver(entries => {
   for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    const theme = safeThemeColor(entry.target.dataset.theme);
    if (!theme) continue;
    doc.body.style.setProperty("--theme-wash", theme);
    if (entry.target.dataset.paint === "true") doc.body.style.backgroundColor = theme;
   }
  }, {threshold: 0.35});
  stages.forEach(el => stageObserver.observe(el));
 }

 // Subtle position indicator and optional limited editorial parallax. Scroll stays native.
 const progress = doc.createElement("span");
 progress.className = "scroll-progress";
 progress.setAttribute("aria-hidden", "true");
 doc.body.append(progress);

 const tick = () => {
  raf = 0;
  if (doc.visibilityState === "hidden") return;
  const scrollable = Math.max(1, doc.documentElement.scrollHeight - win.innerHeight);
  const ratio = Math.min(1, Math.max(0, win.scrollY / scrollable));
  progress.style.transform = "scaleX(" + ratio + ")";
  if(preference?.matches || saveData){
   for(const el of visibleImages)el.style.removeProperty("--motion-shift");
   return;
  }
  const measurements=[];
  const height=win.innerHeight,limit=win.innerWidth<=768?8:20;
  // Batch geometry reads before style writes to avoid repeated forced layout.
  for(const el of visibleImages){
   if(!el.isConnected){visibleImages.delete(el);continue;}
   const bounds=el.getBoundingClientRect();
   measurements.push([el,imageScrollOffset(bounds.top+bounds.height/2,height,limit)]);
  }
  for(const [el,offset] of measurements){
   el.style.setProperty("--motion-shift",offset.toFixed(2)+"px");
  }
 };
 const schedule = () => {if (!raf&&doc.visibilityState!=="hidden") raf = win.requestAnimationFrame(tick);};
 win.addEventListener("scroll", schedule, {passive: true});
 win.addEventListener("resize", schedule, {passive: true});
 doc.addEventListener("visibilitychange", schedule);
 win.addEventListener("pageshow",schedule);
 cleanups.push(() => {
  win.removeEventListener("scroll", schedule);
  win.removeEventListener("resize", schedule);
  doc.removeEventListener("visibilitychange", schedule);
  win.removeEventListener("pageshow",schedule);
 });
 schedule();
 const destroy = () => {
  if (raf) win.cancelAnimationFrame(raf);
  mutationObserver?.disconnect();
  revealObserver?.disconnect();
  imageObserver?.disconnect();
  for(const el of visibleImages)el.style.removeProperty("--motion-shift");
  visibleImages.clear();
  stageObserver?.disconnect();
  for (const cleanup of cleanups) cleanup();
  progress.remove();
 };
 const pagehide=event=>{
  if(event.persisted){
   // Back/forward cache preserves the DOM and listeners. Resume on pageshow.
   if(raf){win.cancelAnimationFrame(raf);raf=0;}
  }else destroy();
 };
 win.addEventListener("pagehide",pagehide);
 cleanups.push(()=>win.removeEventListener("pagehide",pagehide));
 return destroy;
}

if (typeof window !== "undefined" && typeof document !== "undefined") setupMotion();
