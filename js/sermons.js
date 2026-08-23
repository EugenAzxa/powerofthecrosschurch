/* ==========================================================================
   Sermon archive - search, filter and play.
   Data is assets/data/sermons.json, scraped from the church's own archive.
   ========================================================================== */
(function(){
'use strict';

var PAGE=40;

function t(k){
  var L=document.documentElement.lang==='en'?'en':'ru';
  var d=(window.I18N&&window.I18N[L])||{};
  return d[k]!==undefined?d[k]:k;
}

/* "Сергей Зеленцов, Валерий Наривончик" is two preachers */
function names(item){
  return item&&item.p ? item.p.split(', ').filter(Boolean) : [];
}

function ready(){
  var list=document.getElementById('sermList');
  if(!list) return;

  var elSearch=document.getElementById('sermSearch'),
      elYear=document.getElementById('sermYear'),
      elPreacher=document.getElementById('sermPreacher'),
      elCount=document.getElementById('sermCount'),
      elEmpty=document.getElementById('sermEmpty'),
      elMore=document.getElementById('sermMore'),
      elReset=document.getElementById('sermReset');

  var all=[],shown=PAGE,filtered=[];

  fetch('assets/data/sermons.json')
    .then(function(r){ return r.ok?r.json():Promise.reject(r.status); })
    .then(function(data){
      all=data.sermons||[];
      buildFilters();
      setStats(data);
      apply();
    })
    .catch(function(){
      /* no data file: leave the page usable rather than half-broken */
      elEmpty.hidden=false;
      elMore.hidden=true;
    });

  function setStats(data){
    var pres={},years={};
    all.forEach(function(s){
      (s.i||[]).forEach(function(x){ names(x).forEach(function(n){ pres[n]=1; }); });
      if(s.d) years[s.d.slice(0,4)]=1;
    });
    var st=document.getElementById('statTotal'),
        sp=document.getElementById('statPreachers'),
        sy=document.getElementById('statYears');
    if(st) st.textContent=all.length;
    if(sp) sp.textContent=Object.keys(pres).length;
    if(sy) sy.textContent=Object.keys(years).length;
  }

  function buildFilters(){
    var years={},pres={};
    all.forEach(function(s){
      if(s.d) years[s.d.slice(0,4)]=1;
      (s.i||[]).forEach(function(x){ names(x).forEach(function(n){ pres[n]=(pres[n]||0)+1; }); });
    });
    fillYears(Object.keys(years).sort(function(a,b){return b-a;}));
    /* preachers ordered by how often they preach, so the regulars sit on top */
    fillPreachers(Object.keys(pres).sort(function(a,b){return pres[b]-pres[a]||a.localeCompare(b,'ru');}));
  }
  function fillYears(ys){
    elYear.innerHTML='';
    var o=document.createElement('option'); o.value=''; o.textContent=t('serm.year.all');
    elYear.appendChild(o);
    ys.forEach(function(y){
      var e=document.createElement('option'); e.value=y; e.textContent=y; elYear.appendChild(e);
    });
  }
  function fillPreachers(ps){
    elPreacher.innerHTML='';
    var o=document.createElement('option'); o.value=''; o.textContent=t('serm.preacher.all');
    elPreacher.appendChild(o);
    ps.forEach(function(p){
      var e=document.createElement('option'); e.value=p; e.textContent=p; elPreacher.appendChild(e);
    });
  }

  function norm(s){ return (s||'').toLowerCase().replace(/ё/g,'е'); }

  function apply(){
    var q=norm(elSearch.value.trim()), y=elYear.value, p=elPreacher.value;
    filtered=all.filter(function(s){
      if(y&&s.d.slice(0,4)!==y) return false;
      if(p&&!(s.i||[]).some(function(x){ return names(x).indexOf(p)>-1; })) return false;
      if(q){
        var hay=norm((s.i||[]).map(function(x){ return x.t+' '+x.p; }).join(' ')+' '+s.d);
        if(hay.indexOf(q)<0) return false;
      }
      return true;
    });
    shown=PAGE;
    render();
  }

  function render(){
    elCount.textContent=filtered.length;
    list.innerHTML='';
    var slice=filtered.slice(0,shown);
    var frag=document.createDocumentFragment();
    slice.forEach(function(s,i){ frag.appendChild(row(s,filtered.indexOf(s))); });
    list.appendChild(frag);
    elEmpty.hidden=filtered.length>0;
    elMore.hidden=filtered.length<=shown;
  }

  function fmtDate(d){
    var L=document.documentElement.lang==='en'?'en-CA':'ru-RU';
    var parts=d.split('-');
    try{
      return new Date(+parts[0],+parts[1]-1,+parts[2])
        .toLocaleDateString(L,{day:'numeric',month:'long',year:'numeric'});
    }catch(e){ return d; }
  }

  function row(s,idx){
    var b=document.createElement('button');
    b.className='serm-item'; b.type='button';
    b.innerHTML=
      '<span class="serm-play"><svg viewBox="0 0 24 24" aria-hidden="true">'+
      '<path d="M8 5.5v13l11-6.5-11-6.5z" fill="currentColor"/></svg></span>'+
      '<span><span class="serm-title"></span><span class="serm-meta"></span></span>'+
      '<span class="serm-date"></span>';
    var titles=(s.i||[]).map(function(x){ return x.t; }).filter(Boolean);
    var pres=[];
    (s.i||[]).forEach(function(x){ if(x.p&&pres.indexOf(x.p)<0) pres.push(x.p); });
    b.querySelector('.serm-title').textContent=titles.join(' · ')||'-';
    var meta=b.querySelector('.serm-meta');
    meta.textContent=pres.join(', ');
    if((s.v||[]).length>1){
      var dot=document.createElement('span'); dot.className='dot'; meta.appendChild(dot);
      var np=document.createElement('span'); np.textContent=t('serm.parts')+s.v.length;
      meta.appendChild(np);
    }
    b.querySelector('.serm-date').textContent=fmtDate(s.d);
    b.addEventListener('click',function(){ openVid(s); });
    return b;
  }

  elSearch.addEventListener('input',debounce(apply,180));
  elYear.addEventListener('change',apply);
  elPreacher.addEventListener('change',apply);
  elMore.addEventListener('click',function(){ shown+=PAGE; render(); });
  if(elReset) elReset.addEventListener('click',function(){
    elSearch.value=''; elYear.value=''; elPreacher.value=''; apply();
  });

  document.addEventListener('langchange',function(){
    buildFilters(); apply();
  });

  /* ---- video modal ---- */
  var vid=document.getElementById('vid'),
      frame=document.getElementById('vidFrame'),
      vTitle=document.getElementById('vidTitle'),
      vMeta=document.getElementById('vidMeta'),
      vParts=document.getElementById('vidParts'),
      vClose=document.getElementById('vidClose');
  var lastFocus=null;

  function play(id){
    frame.src='https://www.youtube-nocookie.com/embed/'+id+'?rel=0&autoplay=1';
  }
  function openVid(s){
    if(!(s.v||[]).length) return;
    lastFocus=document.activeElement;
    var titles=(s.i||[]).map(function(x){ return x.t; }).filter(Boolean);
    var pres=[]; (s.i||[]).forEach(function(x){ if(x.p&&pres.indexOf(x.p)<0) pres.push(x.p); });
    vTitle.textContent=titles.join(' · ')||'-';
    vMeta.textContent=pres.join(', ')+' - '+fmtDate(s.d);
    vParts.innerHTML='';
    if(s.v.length>1){
      s.v.forEach(function(id,i){
        var b=document.createElement('button');
        b.className='vid-part'; b.type='button';
        b.textContent=(i+1);
        b.setAttribute('aria-pressed',i===0?'true':'false');
        b.addEventListener('click',function(){
          vParts.querySelectorAll('.vid-part').forEach(function(x){ x.setAttribute('aria-pressed','false'); });
          b.setAttribute('aria-pressed','true');
          play(id);
        });
        vParts.appendChild(b);
      });
    }
    play(s.v[0]);
    vid.classList.add('is-open');
    vid.setAttribute('aria-hidden','false');
    document.body.classList.add('is-locked');
    vClose.focus();
  }
  function closeVid(){
    vid.classList.remove('is-open');
    vid.setAttribute('aria-hidden','true');
    document.body.classList.remove('is-locked');
    frame.src='about:blank';            /* stops playback and loads nothing */
    if(lastFocus) lastFocus.focus();
  }
  vClose.addEventListener('click',closeVid);
  vid.addEventListener('click',function(e){ if(e.target===vid) closeVid(); });
  window.addEventListener('keydown',function(e){
    if(e.key==='Escape'&&vid.classList.contains('is-open')) closeVid();
  });

  function debounce(fn,ms){
    var t; return function(){ clearTimeout(t); t=setTimeout(fn,ms); };
  }
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',ready);
else ready();
})();
