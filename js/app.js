/* ==========================================================================
   Church app demo.
   Real data where it exists: the service times, the sermon archive, the
   address. The parts that would need a back end - checking in, giving - are
   honest demonstrations and say so on screen.
   ========================================================================== */
(function(){
'use strict';

var lang = document.documentElement.lang === 'en' ? 'en' : 'ru';
function t(k){
  var d=(window.I18N&&window.I18N[lang])||{};
  if(k in d) return d[k];
  var f=(window.I18N&&window.I18N.ru)||{};
  return (k in f)?f[k]:k;
}

function applyLang(){
  document.documentElement.setAttribute('lang',lang);
  document.querySelectorAll('[data-i18n]').forEach(function(el){
    el.textContent=t(el.getAttribute('data-i18n'));
  });
  document.querySelectorAll('[data-i18n-attr]').forEach(function(el){
    el.getAttribute('data-i18n-attr').split('|').forEach(function(pair){
      var i=pair.indexOf(':'); if(i<0) return;
      el.setAttribute(pair.slice(0,i).trim(), t(pair.slice(i+1).trim()));
    });
  });
  document.title=t('app.name');
  greet(); countdown(); renderList();
  document.querySelectorAll('.seg[data-lang]').forEach(function(b){
    b.setAttribute('aria-pressed', b.getAttribute('data-lang')===lang?'true':'false');
  });
}

/* ---------- greeting + countdown to Sunday ---------- */
function greet(){
  var h=new Date().getHours();
  var k=h<12?'app.greet.morning':(h<18?'app.greet.day':'app.greet.evening');
  var el=document.getElementById('greet'); if(el) el.textContent=t(k);
}
/* Russian needs 1 день / 2-4 дня / 5+ дней */
function plural(n){
  var m10=n%10, m100=n%100;
  if(m10===1&&m100!==11) return t('app.days1');
  if(m10>=2&&m10<=4&&(m100<10||m100>=20)) return t('app.days2');
  return t('app.days5');
}
function countdown(){
  var num=document.getElementById('cdNum'), word=document.getElementById('cdWord');
  if(!num||!word) return;
  var now=new Date(), day=now.getDay();          /* 0 = Sunday */
  var days=(7-day)%7;
  if(days===0&&now.getHours()>=13) days=7;       /* the service has finished */
  if(days===0){ num.textContent=''; word.textContent=t('app.today'); return; }
  if(days===1){ num.textContent=''; word.textContent=t('app.tomorrow'); return; }
  num.textContent=days; word.textContent=plural(days);
}

/* ---------- tabs ---------- */
function initTabs(){
  var tabs=[].slice.call(document.querySelectorAll('.tab'));
  var screens=document.getElementById('screens');
  function go(name){
    tabs.forEach(function(b){
      b.setAttribute('aria-selected', b.getAttribute('data-screen')===name?'true':'false');
    });
    document.querySelectorAll('.screen').forEach(function(s){
      s.classList.toggle('is-on', s.id==='s-'+name);
    });
    if(screens) screens.scrollTop=0;
  }
  tabs.forEach(function(b){
    b.addEventListener('click',function(){ go(b.getAttribute('data-screen')); });
  });
  document.querySelectorAll('[data-go]').forEach(function(b){
    b.addEventListener('click',function(){
      var g=b.getAttribute('data-go');
      if(g==='route'){
        window.open('https://www.google.com/maps/dir/?api=1&destination=255+Wildcat+Rd,+Toronto,+ON+M3J+2S3','_blank','noopener');
        return;
      }
      go(g);
    });
  });
}

/* ---------- check in ---------- */
var CI='pocc-checkin';
function sundayKey(){
  var d=new Date(), add=(7-d.getDay())%7;
  d.setDate(d.getDate()+add);
  return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2);
}
function initCheckin(){
  var card=document.getElementById('checkin'),
      ask=document.getElementById('ciAsk'), done=document.getElementById('ciDone'),
      btn=document.getElementById('ciBtn'), undo=document.getElementById('ciUndo');
  if(!card||!btn) return;
  function read(){ try{ return localStorage.getItem(CI); }catch(e){ return null; } }
  function paint(){
    var on=read()===sundayKey();
    ask.hidden=on; done.hidden=!on;
    card.classList.toggle('is-done',on);
  }
  btn.addEventListener('click',function(){
    try{ localStorage.setItem(CI,sundayKey()); }catch(e){}
    paint(); toast(t('app.checkin.done'));
  });
  undo.addEventListener('click',function(){
    try{ localStorage.removeItem(CI); }catch(e){}
    paint();
  });
  paint();
}

/* ---------- toast ---------- */
var toastTimer;
function toast(msg){
  var el=document.getElementById('toast'); if(!el) return;
  el.textContent=msg; el.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer=setTimeout(function(){ el.classList.remove('is-on'); },2400);
}

/* ---------- sermons ---------- */
var sermons=[], query='';
function loadSermons(){
  fetch('assets/data/sermons.json')
    .then(function(r){ return r.ok?r.json():Promise.reject(0); })
    .then(function(d){ sermons=(d.sermons||[]).slice(0,60); renderList(); })
    .catch(function(){ renderList(); });
}
function fmt(d){
  try{
    var p=d.split('-');
    return new Date(+p[0],+p[1]-1,+p[2]).toLocaleDateString(lang==='en'?'en-CA':'ru-RU',
      {day:'numeric',month:'short',year:'numeric'});
  }catch(e){ return d; }
}
function renderList(){
  var list=document.getElementById('aList'), none=document.getElementById('aNone');
  if(!list) return;
  var q=query.toLowerCase().replace(/ё/g,'е');
  var items=sermons.filter(function(s){
    if(!q) return true;
    var hay=(s.i||[]).map(function(x){ return x.t+' '+x.p; }).join(' ')
              .toLowerCase().replace(/ё/g,'е');
    return hay.indexOf(q)>-1;
  }).slice(0,24);
  list.innerHTML='';
  items.forEach(function(s){
    var b=document.createElement('button');
    b.className='row'; b.type='button';
    var titles=(s.i||[]).map(function(x){ return x.t; }).filter(Boolean).join(' · ');
    var pres=[]; (s.i||[]).forEach(function(x){ if(x.p&&pres.indexOf(x.p)<0) pres.push(x.p); });
    b.innerHTML='<span class="row-ic"><svg viewBox="0 0 24 24" aria-hidden="true">'+
      '<path d="M8 5.5v13l11-6.5-11-6.5z" fill="currentColor"/></svg></span>'+
      '<span><span class="row-t"></span><span class="row-s"></span></span>'+
      '<span class="row-x"></span>';
    b.querySelector('.row-t').textContent=titles||'-';
    b.querySelector('.row-s').textContent=pres.join(', ');
    b.querySelector('.row-x').textContent=fmt(s.d);
    b.addEventListener('click',function(){ play(s,titles,pres.join(', ')); });
    list.appendChild(b);
  });
  if(none) none.hidden=items.length>0;
}
function play(s,title,sub){
  if(!(s.v||[]).length) return;
  var p=document.getElementById('player'), f=document.getElementById('pFrame');
  if(!p||!f) return;
  document.getElementById('pTitle').textContent=title||'-';
  document.getElementById('pSub').textContent=sub||t('app.player.playing');
  f.src='https://www.youtube-nocookie.com/embed/'+s.v[0]+'?rel=0&autoplay=1&playsinline=1';
  p.classList.add('is-on');
}
function initPlayer(){
  var p=document.getElementById('player'), f=document.getElementById('pFrame'),
      c=document.getElementById('pClose');
  if(c) c.addEventListener('click',function(){
    p.classList.remove('is-on');
    f.src='about:blank';                 /* stops playback and loads nothing */
  });
  var s=document.getElementById('aSearch');
  if(s) s.addEventListener('input',function(){ query=s.value.trim(); renderList(); });
}

/* ---------- give ---------- */
function initGive(){
  var amts=document.getElementById('aAmts'), btn=document.getElementById('aGive');
  if(amts){
    amts.addEventListener('click',function(e){
      var b=e.target.closest && e.target.closest('.amt'); if(!b) return;
      amts.querySelectorAll('.amt').forEach(function(x){ x.setAttribute('aria-pressed','false'); });
      b.setAttribute('aria-pressed','true');
    });
  }
  document.querySelectorAll('.seg[data-method]').forEach(function(b){
    b.addEventListener('click',function(){
      document.querySelectorAll('.seg[data-method]').forEach(function(x){ x.setAttribute('aria-pressed','false'); });
      b.setAttribute('aria-pressed','true');
    });
  });
  if(btn) btn.addEventListener('click',function(){ toast(t('app.give.demo')); });
}

/* ---------- language ---------- */
function initLang(){
  document.querySelectorAll('.seg[data-lang]').forEach(function(b){
    b.addEventListener('click',function(){
      lang=b.getAttribute('data-lang')==='en'?'en':'ru';
      try{ localStorage.setItem('pocc-lang',lang); }catch(e){}
      applyLang();
    });
  });
}

function boot(){
  initTabs(); initCheckin(); initPlayer(); initGive(); initLang();
  applyLang(); loadSermons();
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot);
else boot();
})();
