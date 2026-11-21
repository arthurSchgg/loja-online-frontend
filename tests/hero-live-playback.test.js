import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {heroMotionAllowed,setupHeroLivePhoto} from "../assets/js/hero-live-photo.js";

const css=readFileSync(new URL("../assets/css/pages.css",import.meta.url),"utf8");

function harness({reducedMotion=false,saveData=false,failPlayback=false,withPoster=false}={}){
 class Emitter {
  listeners=new Map();
  addEventListener(type,handler){const list=this.listeners.get(type)||[];list.push(handler);this.listeners.set(type,list);}
  removeEventListener(type,handler){this.listeners.set(type,(this.listeners.get(type)||[]).filter(fn=>fn!==handler));}
  emit(type){for(const handler of this.listeners.get(type)||[])handler({type,target:this});}
 }
 const video=Object.assign(new Emitter(),{
  src:"",dataset:{src:"assets/images/brand/hero-live-motion.mp4"},
  paused:true,loadCount:0,playCount:0,pauseCount:0,
  load(){this.loadCount++;},
  pause(){this.pauseCount++;if(!this.paused){this.paused=true;this.emit("pause");}},
  play(){
   this.playCount++;
   if(failPlayback)return Promise.reject(new Error("Autoplay prevented"));
   this.paused=false;this.emit("playing");return Promise.resolve();
  }
 });
 const control=Object.assign(new Emitter(),{
  hidden:true,attrs:{},
  setAttribute(name,value){this.attrs[name]=value;}
 });
 const poster=withPoster?Object.assign(new Emitter(),{complete:false,naturalWidth:0}):null;
 const frame={dataset:{},querySelector(selector){
  if(selector==="[data-hero-video]")return video;
  if(selector==="[data-hero-toggle]")return control;
  if(selector==="[data-hero-bottle]")return poster;
  return null;
 }};
 const preference=Object.assign(new Emitter(),{matches:reducedMotion});
 const connection=Object.assign(new Emitter(),{saveData,effectiveType:"4g"});
 const documentElement={dataset:{motion:"on"}};
 const doc=Object.assign(new Emitter(),{
  hidden:false,documentElement,
  querySelector(selector){return selector==="[data-hero-live]"?frame:null;}
 });
 const observerState={intersection:null,motion:null};
 const win=Object.assign(new Emitter(),{
  navigator:{connection},
  matchMedia:()=>preference,
  IntersectionObserver:class{
   constructor(callback){this.callback=callback;observerState.intersection=this;}
   observe(){}
   disconnect(){}
   trigger(isIntersecting){this.callback([{target:frame,isIntersecting}]);}
  },
  MutationObserver:class{
   constructor(callback){this.callback=callback;observerState.motion=this;}
   observe(){}
   disconnect(){}
   trigger(){this.callback([]);}
  }
 });
 return {video,control,poster,frame,preference,connection,doc,win,observerState};
}
const settle=()=>new Promise(resolve=>setImmediate(resolve));

test("video waits until the priority poster has loaded",async()=>{
 const h=harness({withPoster:true});
 const dispose=setupHeroLivePhoto({win:h.win,doc:h.doc});
 h.observerState.intersection.trigger(true);
 assert.equal(h.video.src,"");
 h.poster.complete=true;h.poster.naturalWidth=900;h.poster.emit("load");
 await settle();
 assert.equal(h.video.loadCount,1);
 assert.equal(h.frame.dataset.liveReady,"true");
 dispose();
});

test("Live Photo remains lazy until an eligible visible intersection",async()=>{
 const h=harness();
 const dispose=setupHeroLivePhoto({win:h.win,doc:h.doc});
 assert.equal(h.video.src,"");
 assert.equal(h.video.loadCount,0);
 assert.equal(h.control.hidden,true);
 h.observerState.intersection.trigger(true);
 await settle();
 assert.equal(h.video.src,"assets/images/brand/hero-live-motion.mp4");
 assert.equal(h.video.loadCount,1);
 assert.equal(h.video.playCount,1);
 assert.equal(h.frame.dataset.liveReady,"true");
 assert.equal(h.frame.dataset.liveActive,"true");
 dispose();
});

test("manual pause freezes the rendered video frame and resumes without reloading",async()=>{
 const h=harness();
 const dispose=setupHeroLivePhoto({win:h.win,doc:h.doc});
 h.observerState.intersection.trigger(true);
 await settle();
 h.control.emit("click");
 assert.equal(h.video.paused,true);
 assert.equal(h.frame.dataset.liveReady,"true");
 assert.equal(h.frame.dataset.liveActive,"false");
 assert.equal(h.control.hidden,false);
 assert.equal(h.control.attrs["aria-pressed"],"true");
 assert.equal(h.control.attrs["aria-label"],"Reproduzir animação da fotografia");
 h.control.emit("click");
 await settle();
 assert.equal(h.video.paused,false);
 assert.equal(h.video.loadCount,1);
 assert.equal(h.control.attrs["aria-label"],"Pausar animação da fotografia");
 dispose();
});

test("motion preferences and Save-Data keep the poster and never fetch video",()=>{
 for(const preferences of [{reducedMotion:true},{saveData:true}]){
  const h=harness(preferences);
  const dispose=setupHeroLivePhoto({win:h.win,doc:h.doc});
  h.observerState.intersection.trigger(true);
  assert.equal(h.video.src,"");
  assert.equal(h.video.playCount,0);
  assert.equal(h.frame.dataset.liveReady,"false");
  assert.equal(h.control.hidden,true);
  dispose();
 }
 assert.equal(heroMotionAllowed({connectionType:"2g"}),false);
});

test("changing data-motion immediately pauses and restores the poster",async()=>{
 const h=harness();
 const dispose=setupHeroLivePhoto({win:h.win,doc:h.doc});
 h.observerState.intersection.trigger(true);
 await settle();
 h.doc.documentElement.dataset.motion="off";
 h.observerState.motion.trigger();
 assert.equal(h.video.paused,true);
 assert.equal(h.frame.dataset.liveReady,"false");
 assert.equal(h.control.hidden,true);
 h.doc.documentElement.dataset.motion="on";
 h.observerState.motion.trigger();
 await settle();
 assert.equal(h.video.paused,false);
 assert.equal(h.video.loadCount,1);
 dispose();
});

test("scrolling out pauses expensive playback without losing the decoded frame",async()=>{
 const h=harness();
 const dispose=setupHeroLivePhoto({win:h.win,doc:h.doc});
 h.observerState.intersection.trigger(true);
 await settle();
 h.observerState.intersection.trigger(false);
 assert.equal(h.video.paused,true);
 assert.equal(h.frame.dataset.liveReady,"true");
 assert.equal(h.control.hidden,true);
 h.observerState.intersection.trigger(true);
 await settle();
 assert.equal(h.video.paused,false);
 dispose();
});

test("a failed or blocked video stays a static photo and never causes a retry loop",async()=>{
 const h=harness({failPlayback:true});
 const dispose=setupHeroLivePhoto({win:h.win,doc:h.doc});
 h.observerState.intersection.trigger(true);
 await settle();
 assert.equal(h.video.playCount,1);
 assert.equal(h.frame.dataset.liveReady,"false");
 assert.equal(h.control.hidden,true);
 h.video.emit("error");
 h.observerState.intersection.trigger(false);
 h.observerState.intersection.trigger(true);
 assert.equal(h.video.playCount,1);
 assert.equal(h.frame.dataset.liveActive,"false");
 dispose();
});

test("photo crossfades on decoded frames, handles hidden controls and uses portrait mobile framing",()=>{
 assert.match(css,/\.hero-live-frame\[data-live-ready="true"\] > video\.hero-live-video/);
 assert.match(css,/\.hero-live-toggle\[hidden\]\{display:none!important\}/);
 assert.match(css,/aspect-ratio:4\/5/);
 assert.match(css,/@media\(max-width:560px\)/);
 assert.match(css,/prefers-reduced-motion:reduce/);
});
