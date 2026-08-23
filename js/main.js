/* ==========================================================================
   Power of the Cross Church - behaviour
   ========================================================================== */
(function(){
'use strict';

var DEFAULT_LANG='ru';
var SUPPORTED=['ru','en'];
var STORE='pocc-lang';

/* ---------------- language ---------------- */
function stored(){
  try{ var v=localStorage.getItem(STORE); return SUPPORTED.indexOf(v)>-1?v:null; }catch(e){ return null; }
}
function detect(){
  var q=new URLSearchParams(location.search).get('lang');
  if(SUPPORTED.indexOf(q)>-1) return q;
  var s=stored();
  if(s) return s;
  /* Russian is the congregation's language, so it stays the default.
     English is opt-in via the toggle or ?lang=en. */
  return DEFAULT_LANG;
}
var lang=detect();

function t(key){
  var d=window.I18N[lang]||{};
  if(key in d) return d[key];
  var f=window.I18N[DEFAULT_LANG]||{};
  return (key in f)?f[key]:key;
}

function applyLang(next){
  lang=next;
  try{ localStorage.setItem(STORE,lang); }catch(e){}
  document.documentElement.setAttribute('lang',lang);

  document.querySelectorAll('[data-i18n]').forEach(function(el){
    el.textContent=t(el.getAttribute('data-i18n'));
  });
  document.querySelectorAll('[data-i18n-html]').forEach(function(el){
    el.innerHTML=t(el.getAttribute('data-i18n-html'));
  });
  /* data-i18n-attr="aria-label:a11y.foo|title:nav.home" */
  document.querySelectorAll('[data-i18n-attr]').forEach(function(el){
    el.getAttribute('data-i18n-attr').split('|').forEach(function(pair){
      var i=pair.indexOf(':'); if(i<0) return;
      el.setAttribute(pair.slice(0,i).trim(), t(pair.slice(i+1).trim()));
    });
  });

  /* document title + description */
  var tk=document.body.getAttribute('data-title-key');
  if(tk) document.title=t(tk)+t('meta.suffix');
  var dk=document.body.getAttribute('data-desc-key');
  var md=document.querySelector('meta[name="description"]');
  if(dk&&md) md.setAttribute('content',t(dk));

  document.querySelectorAll('.lang button').forEach(function(b){
    var on=b.getAttribute('data-lang')===lang;
    b.classList.toggle('is-active',on);
    b.setAttribute('aria-pressed',on?'true':'false');
  });

  document.dispatchEvent(new CustomEvent('langchange',{detail:{lang:lang}}));
}

/* ---------------- header ---------------- */
function initHeader(){
  var header=document.querySelector('.header');
  if(!header) return;
  var onScroll=function(){ header.classList.toggle('is-stuck',window.scrollY>24); };
  onScroll();
  window.addEventListener('scroll',onScroll,{passive:true});

  var burger=document.querySelector('.burger');
  var drawer=document.querySelector('.drawer');
  if(!burger||!drawer) return;
  var toggle=function(open){
    burger.setAttribute('aria-expanded',open?'true':'false');
    drawer.classList.toggle('is-open',open);
    document.body.classList.toggle('is-locked',open);
  };
  burger.addEventListener('click',function(){
    toggle(burger.getAttribute('aria-expanded')!=='true');
  });
  drawer.querySelectorAll('a').forEach(function(a){
    a.addEventListener('click',function(){ toggle(false); });
  });
  window.addEventListener('keydown',function(e){ if(e.key==='Escape') toggle(false); });
  var mq=window.matchMedia('(min-width:1081px)');
  mq.addEventListener('change',function(e){ if(e.matches) toggle(false); });
}

/* ---------------- language buttons ---------------- */
function initLangButtons(){
  document.querySelectorAll('.lang button').forEach(function(b){
    b.addEventListener('click',function(){
      var next=b.getAttribute('data-lang');
      if(next!==lang) applyLang(next);
    });
  });
}

/* ---------------- active nav ---------------- */
function initActiveNav(){
  var here=location.pathname.split('/').pop()||'index.html';
  document.querySelectorAll('.nav a,.drawer a').forEach(function(a){
    var href=(a.getAttribute('href')||'').split('#')[0].split('/').pop();
    if(href&&href===here) a.setAttribute('aria-current','page');
  });
}

/* ---------------- reveal ---------------- */
function initReveal(){
  var items=document.querySelectorAll('[data-reveal],[data-reveal-stagger]');
  if(!items.length) return;
  if(!('IntersectionObserver' in window)||
     window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    items.forEach(function(el){ el.classList.add('is-in'); });
    return;
  }
  var io=new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if(en.isIntersecting){ en.target.classList.add('is-in'); io.unobserve(en.target); }
    });
  },{rootMargin:'0px 0px -9% 0px',threshold:.06});
  items.forEach(function(el){ io.observe(el); });
}

/* ---------------- beliefs accordion ---------------- */
function initBeliefs(){
  var qs=document.querySelectorAll('.belief-q');
  if(!qs.length) return;
  qs.forEach(function(q){
    q.addEventListener('click',function(){
      var open=q.getAttribute('aria-expanded')==='true';
      q.setAttribute('aria-expanded',open?'false':'true');
    });
  });
}

/* ---------------- lightbox ---------------- */
function initLightbox(){
  var triggers=Array.prototype.slice.call(document.querySelectorAll('[data-lb]'));
  var lb=document.querySelector('.lb');
  if(!triggers.length||!lb) return;

  var img=lb.querySelector('img');
  var cap=lb.querySelector('.lb-cap');
  var idx=0, lastFocus=null;

  function show(i){
    idx=(i+triggers.length)%triggers.length;
    var el=triggers[idx];
    img.src=el.getAttribute('data-lb');
    var inner=el.querySelector('.gal-cap');
    if(cap) cap.textContent=el.getAttribute('data-lb-cap')||(inner?inner.textContent:'');
    img.alt=inner?inner.textContent:'';
  }
  function open(i){
    lastFocus=document.activeElement;
    show(i);
    lb.classList.add('is-open');
    lb.setAttribute('aria-hidden','false');
    document.body.classList.add('is-locked');
    var c=lb.querySelector('.lb-close'); if(c) c.focus();
  }
  function close(){
    lb.classList.remove('is-open');
    lb.setAttribute('aria-hidden','true');
    document.body.classList.remove('is-locked');
    if(lastFocus) lastFocus.focus();
  }

  triggers.forEach(function(el,i){
    el.addEventListener('click',function(){ open(i); });
  });
  lb.querySelector('.lb-close').addEventListener('click',close);
  lb.querySelector('.lb-prev').addEventListener('click',function(){ show(idx-1); });
  lb.querySelector('.lb-next').addEventListener('click',function(){ show(idx+1); });
  lb.addEventListener('click',function(e){ if(e.target===lb) close(); });
  window.addEventListener('keydown',function(e){
    if(!lb.classList.contains('is-open')) return;
    if(e.key==='Escape') close();
    else if(e.key==='ArrowLeft') show(idx-1);
    else if(e.key==='ArrowRight') show(idx+1);
  });

  /* keep captions in sync when the language flips */
  document.addEventListener('langchange',function(){
    if(lb.classList.contains('is-open')) show(idx);
  });
}

/* ---------------- loader + cross wipe ----------------
   First view of a session plays the full sequence: the cross draws itself,
   blooms, then opens as a mask that reveals the page. Later views, and
   navigation between pages, use a short wipe in the same visual language.
   Everything degrades safely - the CSS animation ends in a cleared state on
   its own, and a timeout removes the veil if anything stalls.            */
function initLoader(){
  var el=document.getElementById('loader');
  if(!el) return;
  var root=document.documentElement;
  var reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if(reduced){ el.classList.add('is-skip'); return; }

  /* ?intro forces the full sequence - useful for demoing and previewing */
  var force=/[?&]intro\b/.test(location.search);
  var seen;
  try{ seen=sessionStorage.getItem('pocc-seen'); }catch(e){ seen=null; }
  var quick=!!seen&&!force;
  if(quick) el.classList.add('is-quick');
  try{ sessionStorage.setItem('pocc-seen','1'); }catch(e){}

  root.classList.add('is-loading');
  var clear=function(){
    root.classList.remove('is-loading');
    el.classList.add('is-done');
  };
  var ms=quick?760:2980;
  var timer=setTimeout(clear,ms);
  /* if the tab is restored from bfcache mid-animation, do not strand the veil */
  window.addEventListener('pageshow',function(e){
    if(e.persisted){ clearTimeout(timer); clear(); }
  });
}

/* Navigating inside the site closes the cross over the page, then the next
   page opens it again - so the two loads read as one continuous wipe. */
function initWipe(){
  var el=document.getElementById('loader');
  if(!el) return;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  document.addEventListener('click',function(e){
    if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey) return;
    var a=e.target.closest&&e.target.closest('a');
    if(!a) return;
    var href=a.getAttribute('href')||'';
    if(!href||href.charAt(0)==='#') return;
    if(a.target&&a.target!=='_self') return;
    if(a.hasAttribute('download')) return;
    if(/^(https?:)?\/\//i.test(href)||/^(mailto|tel):/i.test(href)) return;

    var here=location.pathname.split('/').pop()||'index.html';
    if(href.split('#')[0].split('/').pop()===here) return;

    e.preventDefault();
    el.classList.remove('is-done','is-quick');
    el.classList.add('is-exit');
    document.documentElement.classList.add('is-loading');
    setTimeout(function(){ location.href=href; },300);
  });
}

/* ---------------- year ---------------- */
function initYear(){
  document.querySelectorAll('[data-year]').forEach(function(el){
    el.textContent=new Date().getFullYear();
  });
}

/* ---------------- boot ---------------- */
function boot(){
  initLoader();
  initWipe();
  applyLang(lang);
  initHeader();
  initLangButtons();
  initActiveNav();
  initReveal();
  initBeliefs();
  initLightbox();
  initYear();
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot);
else boot();
})();
