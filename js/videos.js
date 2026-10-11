/* ==========================================================================
   Video page - testimonies and productions migrated from pocc.ca.
   The list is in the HTML (built from assets/data/videos.json) so search
   engines see it; this only filters it and plays a video in place.
   ========================================================================== */
(function(){
'use strict';

function ready(){
  var list=document.getElementById('vidList');
  if(!list) return;
  var chips=document.getElementById('vidChips'),
      count=document.getElementById('vidCount'),
      items=[].slice.call(list.querySelectorAll('.serm-item'));

  if(chips) chips.addEventListener('click',function(e){
    var b=e.target.closest&&e.target.closest('[data-filter]');
    if(!b) return;
    chips.querySelectorAll('[data-filter]').forEach(function(x){ x.setAttribute('aria-pressed','false'); });
    b.setAttribute('aria-pressed','true');
    var f=b.getAttribute('data-filter'), n=0;
    items.forEach(function(it){
      var on=f==='all'||it.getAttribute('data-c')===f;
      it.hidden=!on; if(on) n++;
    });
    count.textContent=n;
  });

  var vid=document.getElementById('vid'),
      frame=document.getElementById('vidFrame'),
      vTitle=document.getElementById('vidTitle'),
      vMeta=document.getElementById('vidMeta'),
      vClose=document.getElementById('vidClose'),
      lastFocus=null;

  function src(v){
    /* one production lives on Dailymotion; everything else is YouTube */
    if(v.indexOf('dm:')===0) return 'https://www.dailymotion.com/embed/video/'+v.slice(3)+'?autoplay=1';
    return 'https://www.youtube-nocookie.com/embed/'+v+'?rel=0&autoplay=1&playsinline=1';
  }
  items.forEach(function(it){
    it.addEventListener('click',function(){
      lastFocus=document.activeElement;
      var title=it.querySelector('.serm-title').textContent;
      vTitle.textContent=title;
      frame.title=title;
      var date=[].slice.call(it.querySelectorAll('.serm-date > *, .serm-date'))
        .filter(function(x){ return x.offsetParent!==null&&!x.children.length; })[0];
      vMeta.textContent=it.querySelector('.serm-meta').textContent+(date?' - '+date.textContent:'');
      frame.src=src(it.getAttribute('data-v'));
      vid.classList.add('is-open');
      vid.setAttribute('aria-hidden','false');
      document.body.classList.add('is-locked');
      vClose.focus();
    });
  });
  function close(){
    vid.classList.remove('is-open');
    vid.setAttribute('aria-hidden','true');
    document.body.classList.remove('is-locked');
    frame.src='about:blank';            /* stops playback */
    if(lastFocus) lastFocus.focus();
  }
  vClose.addEventListener('click',close);
  vid.addEventListener('click',function(e){ if(e.target===vid) close(); });
  window.addEventListener('keydown',function(e){
    if(e.key==='Escape'&&vid.classList.contains('is-open')) close();
  });
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',ready);
else ready();
})();
