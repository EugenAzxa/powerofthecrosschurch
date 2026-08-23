/* ==========================================================================
   Memory wall - demonstration behaviour.

   The six people are fictional and the page says so in a banner above them.
   Candles are counted in localStorage only; there is no server, and nothing
   here is a record of a real person.
   ========================================================================== */
(function(){
'use strict';

var KEY='pocc-candles';
/* starting counts, so the wall does not read as empty on a first visit */
var SEED=[214,168,301,97,142,58];

function read(){
  try{
    var raw=localStorage.getItem(KEY);
    if(!raw) return null;
    var v=JSON.parse(raw);
    return Array.isArray(v)?v:null;
  }catch(e){ return null; }
}
function write(v){
  try{ localStorage.setItem(KEY,JSON.stringify(v)); }catch(e){}
}

function t(k){
  var L=document.documentElement.lang==='en'?'en':'ru';
  var d=(window.I18N&&window.I18N[L])||{};
  if(k in d) return d[k];
  var f=(window.I18N&&window.I18N.ru)||{};
  return (k in f)?f[k]:k;
}

function ready(){
  var grid=document.getElementById('wallGrid');
  if(!grid) return;

  var counts=read()||SEED.slice();
  var lit={};
  try{
    var l=JSON.parse(localStorage.getItem(KEY+'-lit')||'{}');
    if(l&&typeof l==='object') lit=l;
  }catch(e){}

  var cards=[].slice.call(grid.querySelectorAll('.mem[data-tag]'));
  var empty=document.getElementById('wallEmpty');
  var search=document.getElementById('wallSearch');
  var chips=document.getElementById('wallChips');
  var filter='all', query='';

  function paintCounts(){
    cards.forEach(function(card){
      var btn=card.querySelector('.mem-candle');
      if(!btn) return;
      var i=+btn.getAttribute('data-candle')-1;
      var n=counts[i]!==undefined?counts[i]:0;
      btn.querySelector('.mem-count').textContent=n;
      btn.classList.toggle('is-lit',!!lit[i]);
      btn.setAttribute('title',n+' '+t('wall.candles'));
    });
  }

  grid.addEventListener('click',function(e){
    var btn=e.target.closest&&e.target.closest('.mem-candle');
    if(!btn) return;
    var i=+btn.getAttribute('data-candle')-1;
    if(lit[i]){                       /* a second tap takes it back */
      counts[i]=Math.max(0,(counts[i]||1)-1);
      delete lit[i];
    } else {
      counts[i]=(counts[i]||0)+1;
      lit[i]=1;
    }
    write(counts);
    try{ localStorage.setItem(KEY+'-lit',JSON.stringify(lit)); }catch(err){}
    paintCounts();
  });

  function norm(s){ return (s||'').toLowerCase().replace(/ё/g,'е'); }

  function apply(){
    var q=norm(query), shown=0;
    cards.forEach(function(card){
      var tag=card.getAttribute('data-tag')||'';
      var okTag = filter==='all' || tag===filter;
      var hay=norm(card.textContent);
      var okQ = !q || hay.indexOf(q)>-1;
      var on = okTag&&okQ;
      card.hidden=!on;
      if(on) shown++;
    });
    /* the add tile only makes sense on the unfiltered wall */
    var add=grid.querySelector('.mem-add');
    if(add) add.parentElement.hidden = !(filter==='all'&&!q);
    if(empty) empty.hidden = shown>0;
  }

  if(chips){
    chips.addEventListener('click',function(e){
      var b=e.target.closest&&e.target.closest('.wall-chip');
      if(!b) return;
      chips.querySelectorAll('.wall-chip').forEach(function(x){ x.setAttribute('aria-pressed','false'); });
      b.setAttribute('aria-pressed','true');
      filter=b.getAttribute('data-filter');
      apply();
    });
  }
  if(search){
    search.addEventListener('input',function(){ query=search.value.trim(); apply(); });
  }
  document.addEventListener('langchange',function(){ paintCounts(); apply(); });

  paintCounts();
  apply();
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',ready);
else ready();
})();
