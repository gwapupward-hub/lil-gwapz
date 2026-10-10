(() => {
  const root=document.getElementById('browse-grid');
  const filters=document.getElementById('mood-filters');
  if(!root||!filters) return;

  const groups=[...root.querySelectorAll('[data-mood-group]')];
  const moodButtons=[...filters.querySelectorAll('[data-filter-group="mood"]')];
  const attitudeGroup=root.querySelector('[data-mood-group="attitude"]');
  const attitudeLabel=attitudeGroup?.querySelector('[data-mood-group-label]');

  const selectedSex=()=>{
    const values=new Set(
      [...document.querySelectorAll('[data-filter-group="sex"][aria-pressed="true"]')]
        .map(button=>button.dataset.filterValue)
        .filter(value=>value&&value!=='all')
    );
    return values.size===1?[...values][0]:'';
  };

  const contextualAttitudeLabel=()=>{
    const sex=selectedSex();
    return sex==='M'?'Swagger':sex==='F'?'Sassy':'Attitude';
  };

  const explicitMoodFilterActive=()=>moodButtons.some(button=>button.dataset.filterValue!=='all'&&button.getAttribute('aria-pressed')==='true');

  const clearScrollActive=()=>{
    moodButtons.forEach(button=>button.classList.remove('is-scroll-active'));
  };

  const setScrollActive=mood=>{
    clearScrollActive();
    if(explicitMoodFilterActive()) return;
    const button=moodButtons.find(item=>item.dataset.filterValue===mood);
    button?.classList.add('is-scroll-active');
  };

  const updateContextLabels=()=>{
    if(attitudeLabel) attitudeLabel.textContent=contextualAttitudeLabel();
  };

  const updateGroups=()=>{
    for(const group of groups){
      const visible=[...group.querySelectorAll('[data-sticker-tile]')].filter(tile=>!tile.hidden);
      group.hidden=visible.length===0;
      const count=group.querySelector('[data-mood-group-count]');
      if(count) count.textContent=`${visible.length} sticker${visible.length===1?'':'s'}`;
    }
    updateContextLabels();
    if(explicitMoodFilterActive()) clearScrollActive();
  };

  let pending=false;
  const scheduleUpdate=()=>{
    if(pending) return;
    pending=true;
    queueMicrotask(()=>{pending=false;updateGroups()});
  };

  const tileObserver=new MutationObserver(mutations=>{
    if(mutations.some(mutation=>mutation.type==='attributes'&&mutation.attributeName==='hidden'&&mutation.target.matches?.('[data-sticker-tile]'))) scheduleUpdate();
  });
  tileObserver.observe(root,{subtree:true,attributes:true,attributeFilter:['hidden']});

  const filterObserver=new MutationObserver(mutations=>{
    if(!mutations.some(mutation=>mutation.type==='attributes'&&mutation.attributeName==='aria-pressed')) return;
    updateContextLabels();
    if(explicitMoodFilterActive()) clearScrollActive();
  });
  filterObserver.observe(document.body,{subtree:true,attributes:true,attributeFilter:['aria-pressed']});

  if('IntersectionObserver' in window){
    const headingObserver=new IntersectionObserver(entries=>{
      const intersecting=entries.filter(entry=>entry.isIntersecting&&!entry.target.closest('[data-mood-group]')?.hidden);
      if(!intersecting.length||explicitMoodFilterActive()) return;
      intersecting.sort((a,b)=>Math.abs(a.boundingClientRect.top-innerHeight*.34)-Math.abs(b.boundingClientRect.top-innerHeight*.34));
      setScrollActive(intersecting[0].target.dataset.moodHeading);
    },{root:null,rootMargin:'-24% 0px -62% 0px',threshold:0});
    groups.forEach(group=>{
      const heading=group.querySelector('[data-mood-heading]');
      if(heading) headingObserver.observe(heading);
    });
  }

  updateGroups();
})();
