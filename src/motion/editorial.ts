import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/** Progressive editorial motion: no hidden default content or scroll capture. */
export function setupEditorialMotion() {
  if (document.documentElement.dataset.motion === "off" ||
      matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (connection?.saveData) return () => {};
  const media = gsap.matchMedia();
  media.add("(prefers-reduced-motion: no-preference)", () => {
    const headline = document.querySelectorAll<HTMLElement>("[data-hero-copy]:not(h1:has(.hero-title-line))");
    const titleLines = document.querySelectorAll<HTMLElement>(".hero-title-line");
    if (headline.length) {
      gsap.timeline({ defaults: { duration: 0.72, ease: "power3.out" } })
        .fromTo(headline, { opacity: 0.1, y: 18 }, { opacity: 1, y: 0, stagger: 0.08, clearProps: "opacity,transform" });
    }
    if (titleLines.length) {
      gsap.fromTo(titleLines, { opacity: .3, y: 25, clipPath: "inset(0 0 22% 0)" }, {
        opacity: 1, y: 0, clipPath: "inset(0 0 0% 0)", duration: 1.05,
        stagger: .15, ease: "power4.out", clearProps: "opacity,transform,clipPath"
      });
    }
    // Move an inner layer only, leaving native image parallax and video intact.
    const visual = document.querySelector<HTMLElement>(".hero-live-frame, .chapter-hero__art");
    if (visual) {
      gsap.fromTo(visual, { opacity: 0.7, scale: 0.965, clipPath: "inset(5% 3% 5% 3% round 30px)" }, {
        opacity: 1, scale: 1, clipPath: "inset(0% 0% 0% 0% round 30px)", duration: 1.15, ease: "power3.out", clearProps: "opacity,transform,clipPath"
      });
    }
    const frameOutline = document.querySelector<HTMLElement>(".hero-frame-outline");
    if (frameOutline) {
      gsap.fromTo(frameOutline, { opacity: .25, scale: .955 }, {
        opacity: 1, scale: 1, duration: 1.25, ease: "power3.out"
      });
      gsap.to(frameOutline, {
        y: 35, rotation: 3, ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: .75 }
      });
    }
    // Only the accent words move here; the section's entrance remains managed
    // by the native observer, so card reorders never compete with this timeline.
    document.querySelectorAll<HTMLElement>(".section-heading h2 em, .intro h2 em, .editorial-copy h2 em")
      .forEach(accent => gsap.fromTo(accent, { opacity: .68, y: 8 }, {
        opacity: 1, y: 0, duration: .75, ease: "power2.out", clearProps: "opacity,transform",
        scrollTrigger: { trigger: accent, start: "top 90%", once: true }
      }));
    document.querySelectorAll<HTMLElement>(".editorial-visual__float, .chapter-story .editorial-cutout-shell")
      .forEach(element => {
        gsap.fromTo(element, { y: 14 }, {
          y: -14, ease: "none",
          scrollTrigger: { trigger: element, start: "top bottom", end: "bottom top", scrub: 0.5 }
        });
      });
  });
  return () => media.revert();
}
