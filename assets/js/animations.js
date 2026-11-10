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

export function setupMotion({win = globalThis.window, doc = globalThis.document} = {}) {
 if (!win || !doc) return () => {};
 const preference = win.matchMedia?.("(prefers-reduced-motion: reduce)");
 const canAnimate = motionAllowed(preference?.matches === true, win.navigator?.connection?.saveData === true);
 const animationAvailable = typeof win.Element?.prototype?.animate === "function" ||
  typeof doc.documentElement?.animate === "function";
 const cleanups = [];
 let revealObserver, stageObserver, mutationObserver, raf = 0;
 const once = new WeakSet();

 // Native Web Animations only run for elements in view; nothing is hidden by default.
 const revealSelector = "[data-reveal], .section-heading, .product-card, .family-tile, .collection-tile, .editorial-copy, .quiz-box";
 if (canAnimate && animationAvailable && "IntersectionObserver" in win) {
  revealObserver = new win.IntersectionObserver(entries => {
   for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    revealObserver.unobserve(entry.target);
    const el = entry.target;
    if (!el.isConnected || el.closest("[hidden]")) continue;
    const index = [...(el.parentElement?.children ?? [])].indexOf(el);
    el.animate([
     {opacity: 0, transform: "translate3d(0, 24px, 0)"},
     {opacity: 1, transform: "translate3d(0, 0, 0)"}
    ], {duration: 760, delay: revealDelay(index), easing: "cubic-bezier(.22,1,.36,1)"});
   }
  }, {threshold: 0.12, rootMargin: "0px 0px -4% 0px"});
  const observe = node => {
   if (!(node instanceof win.Element)) return;
   const candidates = [...(node.matches(revealSelector) ? [node] : []), ...node.querySelectorAll(revealSelector)];
   for (const el of candidates) {
    if (once.has(el)) continue;
    once.add(el);
    revealObserver.observe(el);
   }
  };
  observe(doc.body);
  if ("MutationObserver" in win) {
   mutationObserver = new win.MutationObserver(changes => {
    for (const change of changes)
     for (const child of change.addedNodes) observe(child);
   });
   mutationObserver.observe(doc.body, {childList: true, subtree: true});
  }
 }

 if (canAnimate && animationAvailable) {
  doc.querySelectorAll("[data-hero-copy]").forEach((el, index) => el.animate([
   {opacity: 0, transform: "translate3d(0, 30px, 0)"},
   {opacity: 1, transform: "translate3d(0, 0, 0)"}
  ], {duration: 920, delay: 90 + index * 130, easing: "cubic-bezier(.22,1,.36,1)"}));
  doc.querySelector("[data-hero-bottle]")?.animate([
   {opacity: 0, transform: "translate3d(0, 36px, 0) scale(.96)"},
   {opacity: 1, transform: "translate3d(0, 0, 0) scale(1)"}
  ], {duration: 1150, delay: 180, easing: "cubic-bezier(.22,1,.36,1)"});
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
 const parallax = canAnimate && win.matchMedia?.("(min-width: 769px)")?.matches
  ? [...doc.querySelectorAll("[data-parallax]")] : [];
 const tick = () => {
  raf = 0;
  if (doc.visibilityState === "hidden") return;
  const scrollable = Math.max(1, doc.documentElement.scrollHeight - win.innerHeight);
  const ratio = Math.min(1, Math.max(0, win.scrollY / scrollable));
  progress.style.transform = "scaleX(" + ratio + ")";
  for (const el of parallax) {
   const bounds = el.getBoundingClientRect();
   if (bounds.bottom < 0 || bounds.top > win.innerHeight) continue;
   const relative = (win.innerHeight / 2 - (bounds.top + bounds.height / 2)) /
    Math.max(win.innerHeight, 1);
   el.style.transform = "translate3d(0," + Math.max(-18, Math.min(18, relative * 24)).toFixed(2) + "px,0)";
  }
 };
 const schedule = () => {if (!raf) raf = win.requestAnimationFrame(tick);};
 win.addEventListener("scroll", schedule, {passive: true});
 win.addEventListener("resize", schedule, {passive: true});
 doc.addEventListener("visibilitychange", schedule);
 cleanups.push(() => {
  win.removeEventListener("scroll", schedule);
  win.removeEventListener("resize", schedule);
  doc.removeEventListener("visibilitychange", schedule);
 });
 schedule();
 const destroy = () => {
  if (raf) win.cancelAnimationFrame(raf);
  mutationObserver?.disconnect();
  revealObserver?.disconnect();
  stageObserver?.disconnect();
  for (const cleanup of cleanups) cleanup();
  progress.remove();
 };
 win.addEventListener("pagehide", destroy, {once: true});
 return destroy;
}

if (typeof window !== "undefined" && typeof document !== "undefined") setupMotion();
