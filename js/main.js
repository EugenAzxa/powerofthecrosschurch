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
  var ms=quick?760:2880;
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

/* ---------------- giving ----------------
   Driven entirely by js/config.js. The card panel stays hidden until at
   least one payment link is filled in, so the page can never ship a Give
   button that leads nowhere. Each amount carries its own URL, which keeps
   this provider-agnostic - Stripe, PayPal, Donorbox and tithe.ly all differ
   in how they express an amount, and none of them have to here. */
function initGiving(){
  var cfg=window.POCC_CONFIG||{};

  /* e-Transfer address, when the church has published one */
  var addr=document.getElementById('etrAddr');
  if(addr&&cfg.etransferEmail){
    var a=document.createElement('a');
    a.href='mailto:'+cfg.etransferEmail;
    a.textContent=cfg.etransferEmail;
    addr.textContent='';
    addr.appendChild(a);
  }

  var pane=document.getElementById('cardPane');
  var wrap=document.getElementById('amounts');
  var btn=document.getElementById('giveBtn');
  if(!pane||!wrap||!btn) return;

  var links=cfg.payLinks||{};
  var any=Object.keys(links).some(function(k){ return !!links[k]; });
  if(!any) return;                 /* stays hidden */
  pane.hidden=false;

  var chips=[].slice.call(wrap.querySelectorAll('.amount'));
  chips.forEach(function(c){
    var url=links[c.getAttribute('data-amount')]||links.other||'';
    if(!url){ c.remove(); return; }
    c.setAttribute('data-url',url);
    c.addEventListener('click',function(){ select(c); });
  });
  chips=[].slice.call(wrap.querySelectorAll('.amount'));

  function select(chip){
    chips.forEach(function(c){ c.setAttribute('aria-pressed',c===chip?'true':'false'); });
    btn.setAttribute('href',chip.getAttribute('data-url'));
  }
  var def=wrap.querySelector('[data-amount="50"]')||chips[0];
  if(def) select(def);
}

/* ---------------- cloth scripture banner ----------------
   Paints the verse onto a 2D canvas and hands it to the WebGL cloth, so the
   fabric works in every browser instead of only in Chrome behind a flag.
   If anything is missing - WebGL, the Cloth class, reduced motion - the
   original markup is simply left alone. */
function initCloth(){
  if(!window.Cloth) return;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var bands=document.querySelectorAll('.verse');
  if(!bands.length) return;

  function painter(band){
    var src=band.querySelector('.verse-src');
    var quote=band.querySelector('blockquote');
    var cite=band.querySelector('cite');
    var mark=band.querySelector('.verse-cross');
    if(!quote) return null;

    return function(ctx,W,H){
      var hb=band.getBoundingClientRect();

      /* The fabric needs a surface, or the lighting has nothing to shade and
         the effect reads as warping text rather than cloth. So paint a banner
         panel first and lay the verse over it. */
      var inset=Math.min(W*0.07,96), top=Math.min(H*0.10,44);
      var bw=W-inset*2, bh=H-top*2, rad=Math.min(22,bw/2,bh/2);
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(inset+rad,top);
      ctx.arcTo(inset+bw,top,inset+bw,top+bh,rad);
      ctx.arcTo(inset+bw,top+bh,inset,top+bh,rad);
      ctx.arcTo(inset,top+bh,inset,top,rad);
      ctx.arcTo(inset,top,inset+bw,top,rad);
      ctx.closePath();
      var g=ctx.createLinearGradient(0,top,0,top+bh);
      g.addColorStop(0,'rgba(255,255,255,0.92)');
      g.addColorStop(0.55,'rgba(248,251,255,0.88)');
      g.addColorStop(1,'rgba(236,243,252,0.86)');
      ctx.fillStyle=g;
      ctx.fill();
      ctx.restore();

      var qs=getComputedStyle(quote), cs=cite?getComputedStyle(cite):null;
      var qr=quote.getBoundingClientRect();

      ctx.textAlign='center';
      ctx.textBaseline='alphabetic';

      /* the cross, drawn to match the inline SVG it replaces */
      if(mark){
        var mr=mark.getBoundingClientRect();
        var mx=mr.left-hb.left+mr.width/2, my=mr.top-hb.top, u=mr.width/32;
        ctx.save();
        ctx.translate(mx-16*u,my);
        ctx.scale(u,u);
        ctx.fillStyle=getComputedStyle(mark).color||'#1256B8';
        ctx.beginPath();
        ctx.moveTo(13,2);ctx.lineTo(19,2);ctx.lineTo(19,11);ctx.lineTo(28,11);
        ctx.lineTo(28,17);ctx.lineTo(19,17);ctx.lineTo(19,30);ctx.lineTo(13,30);
        ctx.lineTo(13,17);ctx.lineTo(4,17);ctx.lineTo(4,11);ctx.lineTo(13,11);
        ctx.closePath();ctx.fill();
        ctx.restore();
      }

      /* the verse, re-wrapped at the same width and font as the DOM */
      var fSize=parseFloat(qs.fontSize), lh=parseFloat(qs.lineHeight)||fSize*1.32;
      ctx.font=qs.fontStyle+' '+qs.fontWeight+' '+fSize+'px '+qs.fontFamily;
      ctx.fillStyle=qs.color;
      var maxW=qr.width;
      var words=(quote.textContent||'').trim().split(/\s+/);
      var lines=[],line='';
      for(var i=0;i<words.length;i++){
        var test=line?line+' '+words[i]:words[i];
        if(ctx.measureText(test).width>maxW&&line){ lines.push(line); line=words[i]; }
        else line=test;
      }
      if(line) lines.push(line);
      var cx=qr.left-hb.left+qr.width/2;
      var y=qr.top-hb.top+(lh+fSize)/2-lh*0.08;
      for(var j=0;j<lines.length;j++){ ctx.fillText(lines[j],cx,y+j*lh); }

      /* the reference */
      if(cite&&cs){
        var cr=cite.getBoundingClientRect();
        var cSize=parseFloat(cs.fontSize);
        ctx.font=cs.fontWeight+' '+cSize+'px '+cs.fontFamily;
        ctx.fillStyle=cs.color;
        var txt=(cite.textContent||'').trim();
        var track=parseFloat(cs.letterSpacing)||0;
        var cxx=cr.left-hb.left+cr.width/2;
        var cyy=cr.top-hb.top+cSize;
        if(track){
          var total=0,k;
          for(k=0;k<txt.length;k++) total+=ctx.measureText(txt[k]).width+track;
          total-=track;
          var px=cxx-total/2;
          ctx.textAlign='left';
          for(k=0;k<txt.length;k++){
            ctx.fillText(txt[k],px,cyy);
            px+=ctx.measureText(txt[k]).width+track;
          }
          ctx.textAlign='center';
        } else {
          ctx.fillText(txt,cxx,cyy);
        }
      }
    };
  }

  function mount(band){
    var draw=painter(band);
    if(!draw) return;
    var cloth;
    try{ cloth=new Cloth(band,{wind:1.15,speed:0.5,amplitude:0.085,brush:0.7,light:0.62,sheen:0.2}); }
    catch(e){ return; }            /* no WebGL: leave the plain markup alone */
    cloth.paint(draw);

    /* Prove the fabric renders before hiding the real text. If WebGL is
       present but produces nothing, the band would otherwise go blank. */
    try{ cloth.renderOnce(); }
    catch(e){ cloth.destroy(); return; }
    var cv=band.querySelector('.cloth-canvas');
    if(!cv||!cv.width||!cv.height){ cloth.destroy(); return; }

    band.classList.add('has-cloth');

    /* if the GPU context is ever lost, put the markup straight back */
    cloth.onLost=function(){
      band.classList.remove('has-cloth');
      cloth.destroy();
    };

    /* only animate while the band is actually on screen */
    if('IntersectionObserver' in window){
      new IntersectionObserver(function(es){
        es.forEach(function(en){ en.isIntersecting?cloth.start():cloth.stop(); });
      },{threshold:.05}).observe(band);
    } else cloth.start();

    /* the fabric is a picture of the text, so repaint when the text changes */
    document.addEventListener('langchange',function(){
      setTimeout(function(){ cloth.paint(draw); },30);
    });
  }

  var go=function(){ bands.forEach(mount); };
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(go);
  else window.addEventListener('load',go);
}

/* ---------------- mobile demo ----------------
   A live preview of the site in a phone frame, beside a code that points at
   wherever this site is actually served from - so it works on localhost, on
   GitHub Pages and on a custom domain with nothing to regenerate. */
function initDemo(){
  var box=document.getElementById('qrBox');
  var frame=document.getElementById('demoFrame');
  if(!box&&!frame) return;

  /* anchor the match to a path segment: without the slash this also ate
     the tail of any file merely ending in 'index.html' */
  var base=location.origin+location.pathname.replace(/(^|\/)index\.html$/,'$1');
  /* the code opens the app, which is what this section is showing */
  var url=base+'app.html';

  if(box&&window.makeQR){
    try{ box.innerHTML=window.makeQR(url,{dark:'#0D1626',light:'#FFFFFF',quiet:3}); }
    catch(e){
      /* rather than an empty white card, fall back to the plain address */
      box.innerHTML='';
      var a=document.createElement('a');
      a.href=url; a.textContent=url; a.className='link-arrow';
      box.appendChild(a);
    }
  }

  /* load the preview only when it comes into view, and mark it embedded so
     it does not show its own loader or a demo inside the demo */
  if(frame){
    var src=url+'?lang='+(document.documentElement.lang==='en'?'en':'ru');
    var load=function(){ if(!frame.src) frame.src=src; };
    if('IntersectionObserver' in window){
      var io=new IntersectionObserver(function(es){
        es.forEach(function(en){ if(en.isIntersecting){ load(); io.disconnect(); } });
      },{rootMargin:'240px'});
      io.observe(frame);
    } else load();

    /* keep the preview in whatever language the visitor is reading */
    document.addEventListener('langchange',function(){
      if(!frame.src) return;
      frame.src=url+'?lang='+(document.documentElement.lang==='en'?'en':'ru');
    });
  }
}

/* ---------------- invitation film ----------------
   The poster is a local image, so nothing is requested from YouTube until
   someone actually chooses to watch. */
function initFilm(){
  var stage=document.getElementById('filmStage');
  var play=document.getElementById('filmPlay');
  if(!stage||!play) return;
  var id=stage.getAttribute('data-video');
  if(!id) return;

  play.addEventListener('click',function(){
    if(stage.classList.contains('is-live')) return;
    var f=document.createElement('iframe');
    f.src='https://www.youtube-nocookie.com/embed/'+id+'?rel=0&autoplay=1&playsinline=1';
    f.title=document.querySelector('[data-i18n="film.h"]').textContent||'';
    f.allow='accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture';
    f.setAttribute('allowfullscreen','');
    stage.appendChild(f);
    stage.classList.add('is-live');
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
  initGiving();
  initCloth();
  initFilm();
  initDemo();
  initYear();
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot);
else boot();
})();
