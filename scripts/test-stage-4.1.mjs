import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright';

const base=process.env.BASE_URL||'http://127.0.0.1:4173';
fs.mkdirSync('artifacts/stage-4.1',{recursive:true});

const expected=[
  {label:'Happy',copy:'Good energy only',href:'browse.html?mood=happy'},
  {label:'Attitude',copy:'Say it with a look',href:'browse.html?mood=attitude'},
  {label:'Chill',copy:'Easy does it',href:'browse.html?mood=chill'},
  {label:'Hype',copy:'Turn it all the way up',href:'browse.html?mood=hype'},
  {label:'Much love',copy:'Send the good stuff',href:'browse.html?mood=love'}
];

const browser=await chromium.launch({headless:true});
const evidence={mobile:[],desktop:null,jsOff:null};

for(const width of [320,375,414]){
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'no-preference'});
  const page=await context.newPage();
  const errors=[];
  page.on('console',m=>{if(m.type()==='error') errors.push(m.text())});
  await page.goto(`${base}/`,{waitUntil:'networkidle'});

  const section=page.locator('.mood-showcase');
  const track=page.locator('.mood-showcase-track');
  const cards=page.locator('.mood-showcase-track .mood-tile');
  assert.equal(await cards.count(),5,`five mood cards at ${width}px`);

  const copy=await cards.evaluateAll(nodes=>nodes.map(node=>({
    label:node.querySelector('b')?.textContent.trim(),
    copy:node.querySelector('small')?.textContent.trim(),
    href:node.getAttribute('href')
  })));
  assert.deepEqual(copy,expected,`canonical mood labels/copy/routes at ${width}px`);

  const trackStyle=await track.evaluate(el=>{
    const s=getComputedStyle(el);
    return {display:s.display,overflowX:s.overflowX,scrollSnapType:s.scrollSnapType,clientWidth:el.clientWidth,scrollWidth:el.scrollWidth};
  });
  assert.equal(trackStyle.display,'flex',`mobile mood track is flex at ${width}px`);
  assert.match(trackStyle.overflowX,/auto|scroll/,`mobile mood track scrolls natively at ${width}px`);
  assert.match(trackStyle.scrollSnapType,/x.*mandatory/,`mobile mood track uses mandatory x snap at ${width}px`);
  assert.ok(trackStyle.scrollWidth>trackStyle.clientWidth,`mobile mood track overflows internally at ${width}px`);

  const widths=await cards.evaluateAll(nodes=>nodes.map(n=>n.getBoundingClientRect().width));
  for(const cardWidth of widths){
    assert.ok(Math.abs(cardWidth-(width*.70))<=1.5,`mood card is ~70vw at ${width}px: ${cardWidth}`);
  }

  const geometry=await page.evaluate(()=>({viewport:innerWidth,documentScrollWidth:document.documentElement.scrollWidth}));
  assert.ok(geometry.documentScrollWidth<=width+1,`no page-level horizontal overflow at ${width}px`);

  const attitudeVariant=await page.locator('.mood-attitude .mood-variant-label').textContent();
  assert.equal(attitudeVariant.trim(),'Sassy · Swagger','mixed-context Attitude exposes Sassy/Swagger variants');

  const chill=await page.locator('.mood-chill .mood-icon').evaluate(el=>{
    const s=getComputedStyle(el);
    return {background:s.backgroundColor,color:s.color,width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height};
  });
  assert.equal(chill.background,'rgb(19, 221, 19)','Chill badge uses canonical #13DD13 fill');
  assert.equal(chill.color,'rgb(7, 16, 7)','Chill badge uses dark text on Gwap Green');
  assert.ok(chill.width>=44&&chill.height>=44,'Chill badge is at least 44px');

  assert.equal(errors.length,0,`no console errors at ${width}px: ${errors.join(' | ')}`);

  if(width===375){
    await section.screenshot({path:'artifacts/stage-4.1/mood-mobile-375.png'});
  }
  evidence.mobile.push({width,trackStyle,widths,geometry,chill});
  await context.close();
}

{
  const context=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'no-preference'});
  const page=await context.newPage();
  const errors=[];
  page.on('console',m=>{if(m.type()==='error') errors.push(m.text())});
  await page.goto(`${base}/`,{waitUntil:'networkidle'});

  const section=page.locator('.mood-showcase');
  const intro=page.locator('.mood-showcase-intro');
  const track=page.locator('.mood-showcase-track');
  const cards=page.locator('.mood-showcase-track .mood-tile');

  assert.equal(await cards.count(),5,'desktop keeps five mood cards');
  const layout=await page.evaluate(()=>{
    const intro=document.querySelector('.mood-showcase-intro');
    const track=document.querySelector('.mood-showcase-track');
    const cards=[...document.querySelectorAll('.mood-showcase-track .mood-tile')];
    const introStyle=getComputedStyle(intro);
    const trackStyle=getComputedStyle(track);
    return {
      introPosition:introStyle.position,
      introTop:introStyle.top,
      trackDisplay:trackStyle.display,
      cardLefts:cards.map(c=>c.getBoundingClientRect().left),
      documentScrollWidth:document.documentElement.scrollWidth,
      viewport:innerWidth,
      sectionTop:document.querySelector('.mood-showcase').offsetTop
    };
  });
  assert.equal(layout.introPosition,'sticky','desktop intro is sticky');
  assert.equal(layout.introTop,'96px','desktop sticky offset is 96px');
  assert.equal(layout.trackDisplay,'grid','desktop cards use vertical grid');
  for(let i=1;i<layout.cardLefts.length;i++){
    assert.ok(layout.cardLefts[i]>layout.cardLefts[i-1],`desktop mood cards step right at index ${i}`);
  }
  assert.ok(layout.documentScrollWidth<=1281,'desktop has no horizontal page overflow');

  await page.evaluate(()=>window.scrollTo(0,document.querySelector('.mood-showcase').offsetTop+150));
  await page.waitForTimeout(80);
  const stickyTop=await intro.evaluate(el=>el.getBoundingClientRect().top);
  assert.ok(stickyTop>=95&&stickyTop<=97,`desktop sticky intro pins near 96px; got ${stickyTop}`);

  await page.evaluate(()=>window.scrollTo(0,document.querySelector('.mood-showcase').offsetTop));
  await page.waitForTimeout(50);
  await section.screenshot({path:'artifacts/stage-4.1/mood-desktop-1280.png'});
  assert.equal(errors.length,0,`desktop has no console errors: ${errors.join(' | ')}`);

  evidence.desktop={layout,stickyTop};
  await context.close();
}

{
  const context=await browser.newContext({viewport:{width:375,height:900},javaScriptEnabled:false});
  const page=await context.newPage();
  await page.goto(`${base}/`,{waitUntil:'domcontentloaded'});
  const cards=page.locator('.mood-showcase-track .mood-tile');
  assert.equal(await cards.count(),5,'all five mood cards exist with JavaScript disabled');
  const visible=await cards.evaluateAll(nodes=>nodes.every(node=>{
    const r=node.getBoundingClientRect();
    const s=getComputedStyle(node);
    return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0;
  }));
  assert.equal(visible,true,'all five mood cards remain rendered with JavaScript disabled');
  const hrefs=await cards.evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href')));
  assert.deepEqual(hrefs,expected.map(x=>x.href),'JS-off cards preserve canonical Browse routes');
  evidence.jsOff={cards:5,visible,hrefs};
  await context.close();
}

console.log(JSON.stringify({stage:'4.1',evidence,screenshots:['mood-mobile-375.png','mood-desktop-1280.png']},null,2));
await browser.close();
