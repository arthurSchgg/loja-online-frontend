/** GSAP/ScrollTrigger + Lenis are enhancements, not hard dependencies.
 * Motion must be simplified if user requests reduced motion.
 */
const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if(!reduced){
 const gsap=window.gsap,ScrollTrigger=window.ScrollTrigger;
 if(gsap){
  if(ScrollTrigger)gsap.registerPlugin(ScrollTrigger);
  gsap.fromTo("[data-hero-copy]",{opacity:0,y:38},{opacity:1,y:0,duration:1.1,stagger:.15,ease:"power3.out"});
  gsap.fromTo("[data-hero-bottle]",{opacity:0,y:70,scale:.92},{opacity:1,y:0,scale:1,duration:1.6,ease:"power3.out",delay:.25});
  if(ScrollTrigger){
   gsap.utils.toArray("[data-reveal]").forEach(el=>{gsap.fromTo(el,{opacity:0,y:24},{opacity:1,y:0,duration:.9,ease:"power2.out",scrollTrigger:{trigger:el,start:"top 89%",once:true}});});
   gsap.utils.toArray("[data-parallax]").forEach(el=>{gsap.to(el,{yPercent:-9,ease:"none",scrollTrigger:{trigger:el,start:"top bottom",end:"bottom top",scrub:true}});});
  }
 }
 if(window.Lenis){
  const lenis=new window.Lenis({duration:1.2,autoRaf:true,smoothWheel:true});
  window.addEventListener("pagehide",()=>lenis.destroy(),{once:true});
 }
}
const stages=[...document.querySelectorAll("[data-theme-stage]")];
if("IntersectionObserver" in window&&stages.length){
 const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting){const theme=entry.target.dataset.theme;document.body.style.setProperty("--theme-wash",theme);if(entry.target.dataset.paint==="true")document.body.style.backgroundColor=theme;}}},{threshold:.35});
 stages.forEach(s=>observer.observe(s));
}
