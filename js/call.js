/* ==========================================================================
   Request a conversation with the pastor.

   There is no back end, so the form composes the request and hands it to the
   visitor's own mail app. Nothing is sent anywhere without them seeing it,
   and nothing is stored.

   The gift is genuinely optional: it defaults to none, the call does not
   depend on it, and no payment is taken here.
   ========================================================================== */
(function(){
'use strict';

var CHURCH_EMAIL = '';        /* set once the church publishes an address */
var CHURCH_PHONE = '416-858-9317';

function t(k){
  var L=document.documentElement.lang==='en'?'en':'ru';
  var d=(window.I18N&&window.I18N[L])||{};
  if(k in d) return d[k];
  var f=(window.I18N&&window.I18N.ru)||{};
  return (k in f)?f[k]:k;
}

function ready(){
  var form=document.getElementById('callForm');
  if(!form) return;

  var sent=document.getElementById('callSent');
  var chosen={len:'30',when:'evening',gift:'0'};

  /* one-of-many groups */
  function group(id,key){
    var wrap=document.getElementById(id);
    if(!wrap) return;
    wrap.addEventListener('click',function(e){
      var b=e.target.closest&&e.target.closest('[data-'+key+']');
      if(!b) return;
      wrap.querySelectorAll('[data-'+key+']').forEach(function(x){
        x.setAttribute('aria-pressed','false');
      });
      b.setAttribute('aria-pressed','true');
      chosen[key]=b.getAttribute('data-'+key);
    });
  }
  group('callLen','len');
  group('callWhen','when');
  group('callGift','gift');

  function bad(id,on){
    var f=document.getElementById(id);
    if(f) f.classList.toggle('is-bad',!!on);
  }

  form.addEventListener('submit',function(e){
    e.preventDefault();
    var name=document.getElementById('cName').value.trim();
    var phone=document.getElementById('cPhone').value.trim();
    var topic=document.getElementById('cTopic').value.trim();

    bad('fName',!name);
    bad('fPhone',!phone);
    if(!name){ document.getElementById('cName').focus(); return; }
    if(!phone){ document.getElementById('cPhone').focus(); return; }

    var lenTxt=t('call.len'+chosen.len);
    var whenTxt=t('call.when.'+chosen.when)+' ('+t('call.when.'+chosen.when+'d')+')';
    var giftTxt=chosen.gift==='0' ? t('call.gift.none') : '$'+chosen.gift;

    var lines=[
      t('call.h'),
      '',
      t('call.name')+': '+name,
      t('call.phone')+': '+phone,
      t('call.step1')+': '+lenTxt,
      t('call.step2')+': '+whenTxt,
      t('call.step4')+': '+giftTxt
    ];
    if(topic) lines.push('', t('call.topic')+':', topic);

    var subject=t('call.crumb')+' - '+name;
    var body=lines.join('\n');

    if(CHURCH_EMAIL){
      location.href='mailto:'+CHURCH_EMAIL+
        '?subject='+encodeURIComponent(subject)+
        '&body='+encodeURIComponent(body);
      if(sent) sent.classList.add('is-on');
    } else {
      /* no address published yet: put the request on the clipboard and send
         them to the phone, rather than opening an empty mail window */
      if(navigator.clipboard&&navigator.clipboard.writeText){
        navigator.clipboard.writeText(body).catch(function(){});
      }
      if(sent){
        sent.classList.add('is-on');
        var p=sent.querySelector('p');
        if(p) p.textContent=t('call.note');
        sent.scrollIntoView({block:'center',behavior:'smooth'});
      }
    }
  });
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',ready);
else ready();
})();
