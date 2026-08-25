/* ==========================================================================
   Memory wall.

   Three things people can do: light a candle, open a page, and ask the church
   to pray. Plus a form to propose a new page.

   Everything is client side. Candles, drafts and prayer requests live in
   localStorage and go nowhere else, which the copy says on screen. When the
   church has somewhere to receive these, point SUBMIT_EMAIL at it and the
   forms will hand the request to the visitor's own mail app instead.
   ========================================================================== */
(function(){
'use strict';

var SUBMIT_EMAIL='';                 /* set when the church publishes an address */
var CK='pocc-candles', LK='pocc-candles-lit', DK='pocc-drafts';
var SEED=[214,168,301,97,142,58];

function t(k){
  var L=document.documentElement.lang==='en'?'en':'ru';
  var d=(window.I18N&&window.I18N[L])||{};
  if(k in d) return d[k];
  var f=(window.I18N&&window.I18N.ru)||{};
  return (k in f)?f[k]:k;
}
function load(key,fallback){
  try{ var v=JSON.parse(localStorage.getItem(key)); return v==null?fallback:v; }
  catch(e){ return fallback; }
}
function save(key,v){ try{ localStorage.setItem(key,JSON.stringify(v)); }catch(e){} }

function ready(){
  var grid=document.getElementById('wallGrid');
  if(!grid) return;

  var counts=load(CK,null)||SEED.slice();
  var lit=load(LK,{})||{};
  var drafts=load(DK,[])||[];

  var empty=document.getElementById('wallEmpty');
  var search=document.getElementById('wallSearch');
  var chips=document.getElementById('wallChips');
  var filter='all', query='';

  /* ---------------- cards ---------------- */
  function cards(){ return [].slice.call(grid.querySelectorAll('.mem[data-tag]')); }

  function personFrom(card){
    var i=card.querySelector('[data-open]');
    var idx=i?i.getAttribute('data-open'):null;
    if(card.classList.contains('is-draft')){
      var d=drafts[+card.getAttribute('data-draft')];
      return d?{name:d.name,years:d.years,desc:d.about,photo:'',mono:(d.name||'?').charAt(0),idx:null}:null;
    }
    return {
      name: card.querySelector('.mem-name').textContent,
      years:card.querySelector('.mem-years').textContent,
      desc: card.querySelector('.mem-desc').textContent,
      photo:(card.querySelector('.mem-photo')||{}).src||'',
      mono: (card.querySelector('.mem-mono')||{}).textContent||'',
      idx:  idx?+idx-1:null
    };
  }

  function paintCounts(){
    cards().forEach(function(card){
      var btn=card.querySelector('.mem-candle');
      if(!btn) return;
      var i=+btn.getAttribute('data-candle')-1;
      var n=counts[i]!==undefined?counts[i]:0;
      var c=btn.querySelector('.mem-count');
      if(c) c.textContent=n;
      btn.classList.toggle('is-lit',!!lit[i]);
    });
  }

  function toggleCandle(i){
    if(lit[i]){ counts[i]=Math.max(0,(counts[i]||1)-1); delete lit[i]; }
    else      { counts[i]=(counts[i]||0)+1; lit[i]=1; }
    save(CK,counts); save(LK,lit);
    paintCounts();
    return counts[i];
  }

  grid.addEventListener('click',function(e){
    var c=e.target.closest&&e.target.closest('.mem-candle');
    if(c){ toggleCandle(+c.getAttribute('data-candle')-1); return; }
    var o=e.target.closest&&e.target.closest('.mem-open');
    if(o){ openProfile(o.closest('.mem')); return; }
  });

  /* ---------------- filter + search ---------------- */
  function norm(s){ return (s||'').toLowerCase().replace(/ё/g,'е'); }
  function apply(){
    var q=norm(query), shown=0;
    cards().forEach(function(card){
      var tag=card.getAttribute('data-tag')||'';
      var okTag = filter==='all' || tag===filter;
      var okQ = !q || norm(card.textContent).indexOf(q)>-1;
      card.hidden=!(okTag&&okQ);
      if(!card.hidden) shown++;
    });
    var add=grid.querySelector('.mem-add');
    if(add) add.parentElement.hidden = !(filter==='all'&&!q);
    if(empty) empty.hidden = shown>0;
  }
  if(chips) chips.addEventListener('click',function(e){
    var b=e.target.closest&&e.target.closest('.wall-chip');
    if(!b) return;
    chips.querySelectorAll('.wall-chip').forEach(function(x){ x.setAttribute('aria-pressed','false'); });
    b.setAttribute('aria-pressed','true');
    filter=b.getAttribute('data-filter'); apply();
  });
  if(search) search.addEventListener('input',function(){ query=search.value.trim(); apply(); });

  /* ---------------- sheets ---------------- */
  function sheet(id){
    var el=document.getElementById(id);
    if(!el) return null;
    var last=null;
    function open(){
      last=document.activeElement;
      el.classList.add('is-open'); el.setAttribute('aria-hidden','false');
      document.body.classList.add('is-locked');
      var c=el.querySelector('[data-close]'); if(c) c.focus();
    }
    function close(){
      el.classList.remove('is-open'); el.setAttribute('aria-hidden','true');
      document.body.classList.remove('is-locked');
      if(last) last.focus();
    }
    el.addEventListener('click',function(e){
      if(e.target===el||(e.target.closest&&e.target.closest('[data-close]'))) close();
    });
    window.addEventListener('keydown',function(e){
      if(e.key==='Escape'&&el.classList.contains('is-open')) close();
    });
    return {el:el,open:open,close:close};
  }
  var prof=sheet('profSheet'), create=sheet('createSheet');

  /* ---------------- profile ---------------- */
  var current=null;
  function openProfile(card){
    if(!prof) return;
    var p=personFrom(card);
    if(!p) return;
    current=p;
    document.getElementById('profName').textContent=p.name;
    document.getElementById('profYears').textContent=p.years;
    document.getElementById('profDesc').textContent=p.desc;
    var pt=document.getElementById('profPortrait');
    pt.innerHTML = p.photo
      ? '<img src="'+p.photo+'" alt="">'
      : '<span class="mem-mono">'+(p.mono||'?')+'</span>';
    var cd=document.getElementById('profCandles');
    cd.textContent = p.idx===null ? 0 : (counts[p.idx]||0);
    var ok=document.getElementById('prayOk'); if(ok) ok.classList.remove('is-on');
    var f=document.getElementById('prayForm'); if(f) f.reset();
    prof.open();
  }
  var profCandle=document.getElementById('profCandle');
  if(profCandle) profCandle.addEventListener('click',function(){
    if(!current||current.idx===null) return;
    document.getElementById('profCandles').textContent=toggleCandle(current.idx);
  });

  /* ---------------- prayer request ---------------- */
  var prayForm=document.getElementById('prayForm');
  if(prayForm) prayForm.addEventListener('submit',function(e){
    e.preventDefault();
    var who=document.getElementById('prayWho').value.trim();
    var fld=document.getElementById('fPrayWho');
    if(!who){ if(fld) fld.classList.add('is-bad'); document.getElementById('prayWho').focus(); return; }
    if(fld) fld.classList.remove('is-bad');
    var body=[
      t('mp.pray.h')+': '+(current?current.name:''),
      t('mp.pray.who')+': '+who,
      t('mp.pray.contact')+': '+document.getElementById('prayContact').value.trim(),
      '',
      document.getElementById('prayWords').value.trim()
    ].join('\n');
    if(SUBMIT_EMAIL){
      location.href='mailto:'+SUBMIT_EMAIL+'?subject='+
        encodeURIComponent(t('mp.pray.h')+' - '+(current?current.name:''))+
        '&body='+encodeURIComponent(body);
    }
    var ok=document.getElementById('prayOk'); if(ok) ok.classList.add('is-on');
  });

  /* ---------------- create a page ---------------- */
  var addBtn=document.getElementById('wallAdd');
  if(addBtn&&create) addBtn.addEventListener('click',function(){
    var ok=document.getElementById('createOk'); if(ok) ok.classList.remove('is-on');
    var f=document.getElementById('createForm'); if(f) f.reset();
    create.open();
  });

  function draftCard(d,i){
    var art=document.createElement('article');
    art.className='mem is-draft'; art.setAttribute('data-tag','recent');
    art.setAttribute('data-draft',i);
    art.innerHTML=
      '<div class="mem-portrait">'+
        '<button class="mem-open" type="button"></button>'+
        '<span class="draft-tag">'+t('mc.yours')+'</span>'+
        '<span class="mem-mono">'+((d.name||'?').charAt(0))+'</span>'+
      '</div>'+
      '<span class="mem-name"></span><span class="mem-years"></span><span class="mem-desc"></span>'+
      '<button class="link-btn" type="button" data-drop="'+i+'">'+t('mc.remove')+'</button>';
    art.querySelector('.mem-name').textContent=d.name;
    art.querySelector('.mem-years').textContent=d.years||'';
    art.querySelector('.mem-desc').textContent=d.about||'';
    art.querySelector('[data-drop]').addEventListener('click',function(ev){
      ev.stopPropagation();
      drafts.splice(i,1); save(DK,drafts); renderDrafts(); apply();
    });
    return art;
  }
  function renderDrafts(){
    grid.querySelectorAll('.mem.is-draft').forEach(function(n){ n.remove(); });
    var addTile=grid.querySelector('.mem-add');
    var anchor=addTile?addTile.parentElement:null;
    drafts.forEach(function(d,i){
      var c=draftCard(d,i);
      if(anchor) grid.insertBefore(c,anchor); else grid.appendChild(c);
    });
  }

  var createForm=document.getElementById('createForm');
  if(createForm) createForm.addEventListener('submit',function(e){
    e.preventDefault();
    var name=document.getElementById('mcName').value.trim();
    var by=document.getElementById('mcBy').value.trim();
    var fn=document.getElementById('fMcName'), fb=document.getElementById('fMcBy');
    if(fn) fn.classList.toggle('is-bad',!name);
    if(fb) fb.classList.toggle('is-bad',!by);
    if(!name){ document.getElementById('mcName').focus(); return; }
    if(!by){ document.getElementById('mcBy').focus(); return; }

    var d={
      name:name,
      years:document.getElementById('mcYears').value.trim(),
      about:document.getElementById('mcAbout').value.trim(),
      by:by,
      contact:document.getElementById('mcContact').value.trim()
    };
    drafts.push(d); save(DK,drafts);
    renderDrafts(); apply();

    if(SUBMIT_EMAIL){
      var body=[t('mc.name')+': '+d.name, t('mc.years')+': '+d.years, '',
                d.about, '', t('mc.by')+': '+d.by, t('mc.contact')+': '+d.contact].join('\n');
      location.href='mailto:'+SUBMIT_EMAIL+'?subject='+
        encodeURIComponent(t('mc.h')+' - '+d.name)+'&body='+encodeURIComponent(body);
    }
    var ok=document.getElementById('createOk'); if(ok) ok.classList.add('is-on');
  });

  document.addEventListener('langchange',function(){ renderDrafts(); paintCounts(); apply(); });

  renderDrafts();
  paintCounts();
  apply();
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',ready);
else ready();
})();
