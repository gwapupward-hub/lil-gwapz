import fs from 'node:fs';
import { chromium } from 'playwright';

const base=process.env.BASE_URL||'http://127.0.0.1:4173';
fs.mkdirSync('artifacts/stage-2.1',{recursive:true});
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
const page=await context.newPage();
await page.addInitScript(()=>{
  window.__stage21cls=0;
  window.__stage21shifts=[];
  window.__stage21samples=[];
  window.__stage21mutations=[];
  new PerformanceObserver(list=>{
    for(const e of list.getEntries()){
      if(e.hadRecentInput) continue;
      window.__stage21cls+=e.value;
      window.__stage21shifts.push({value:e.value,startTime:e.startTime,sources:(e.sources||[]).map(s=>({node:s.node?{tag:s.node.tagName||'',id:s.node.id||'',className:typeof s.node.className==='string'?s.node.className:'',text:(s.node.textContent||'').trim().slice(0,120)}:null,previousRect:s.previousRect?{x:s.previousRect.x,y:s.previousRect.y,width:s.previousRect.width,height:s.previousRect.height}:null,currentRect:s.currentRect?{x:s.currentRect.x,y:s.currentRect.y,width:s.currentRect.width,height:s.currentRect.height}:null}))});
    }
  }).observe({type:'layout-shift',buffered:true});
  const rect=sel=>{const el=document.querySelector(sel);if(!el)return null;const r=el.getBoundingClientRect();return {y:r.y,h:r.height,w:r.width,display:getComputedStyle(el).display}};
  const started=performance.now();
  const timer=setInterval(()=>{
    const t=performance.now()-started;
    window.__stage21samples.push({t,ready:document.readyState,header:rect('.site-header'),intro:rect('.browse-intro'),controls:rect('.gallery-controls'),moods:rect('#mood-filters'),secondary:rect('.secondary-filters'),mobileButton:rect('#mobile-filter-open'),result:rect('#result-count'),grid:rect('#browse-grid')});
    if(t>400)clearInterval(timer);
  },5);
  new MutationObserver(ms=>{
    for(const m of ms){
      const el=m.target?.nodeType===1?m.target:null;
      if(!el)continue;
      if(el.closest?.('.gallery-controls')||el.id==='browse-grid')window.__stage21mutations.push({t:performance.now()-started,type:m.type,attr:m.attributeName||'',tag:el.tagName,id:el.id||'',className:typeof el.className==='string'?el.className:'',value:m.attributeName?el.getAttribute(m.attributeName):''});
    }
  }).observe(document,{subtree:true,attributes:true,attributeFilter:['class','hidden','aria-pressed','style']});
});
await page.goto(`${base}/browse.html`,{waitUntil:'networkidle'});
await page.waitForTimeout(500);
const diagnostic=await page.evaluate(()=>({cls:window.__stage21cls||0,shifts:window.__stage21shifts||[],samples:window.__stage21samples||[],mutations:window.__stage21mutations||[]}));
const compact=[];
let prev='';
for(const s of diagnostic.samples){const key=JSON.stringify({header:s.header,intro:s.intro,controls:s.controls,moods:s.moods,secondary:s.secondary,mobileButton:s.mobileButton,result:s.result,grid:s.grid});if(key!==prev){compact.push(s);prev=key;}}
console.log('STAGE21_CLS_DIAGNOSTIC');
console.log(JSON.stringify({cls:diagnostic.cls,shifts:diagnostic.shifts,geometryChanges:compact,mutations:diagnostic.mutations},null,2));
await page.screenshot({path:'artifacts/stage-2.1/cls-diagnostic-mobile-390.png',fullPage:false});
await browser.close();
