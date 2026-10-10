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
  new PerformanceObserver(list=>{
    for(const e of list.getEntries()){
      if(e.hadRecentInput) continue;
      window.__stage21cls+=e.value;
      window.__stage21shifts.push({
        value:e.value,
        startTime:e.startTime,
        sources:(e.sources||[]).map(s=>({
          node:s.node?{
            tag:s.node.tagName||'',
            id:s.node.id||'',
            className:typeof s.node.className==='string'?s.node.className:'',
            text:(s.node.textContent||'').trim().slice(0,120)
          }:null,
          previousRect:s.previousRect?{x:s.previousRect.x,y:s.previousRect.y,width:s.previousRect.width,height:s.previousRect.height}:null,
          currentRect:s.currentRect?{x:s.currentRect.x,y:s.currentRect.y,width:s.currentRect.width,height:s.currentRect.height}:null
        }))
      });
    }
  }).observe({type:'layout-shift',buffered:true});
});
await page.goto(`${base}/browse.html`,{waitUntil:'networkidle'});
await page.waitForTimeout(500);
const diagnostic=await page.evaluate(()=>({cls:window.__stage21cls||0,shifts:window.__stage21shifts||[]}));
console.log('STAGE21_CLS_DIAGNOSTIC');
console.log(JSON.stringify(diagnostic,null,2));
await page.screenshot({path:'artifacts/stage-2.1/cls-diagnostic-mobile-390.png',fullPage:false});
await browser.close();
