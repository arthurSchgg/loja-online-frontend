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
    const headline = document.querySelectorAll<HTMLElement>("[data-hero-copy]");
    if (headline.length) {
      gsap.timeline({ defaults: { duration: 0.72, ease: "power3.out" } })
        .fromTo(headline, { opacity: 0, y: 24 }, { opacity: 1, y: 0, stagger: 0.10, clearProps: "opacity,transform" });
    }
    // Move an inner layer only, leaving native image parallax and video intact.
    const visual = document.querySelector<HTMLElement>(".hero-live-frame, .chapter-hero__art");
    if (visual) {
      gsap.fromTo(visual, { opacity: 0.86, scale: 0.975 }, {
        opacity: 1, scale: 1, duration: 1.1, ease: "power2.out", clearProps: "opacity,transform"
      });
    }
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
