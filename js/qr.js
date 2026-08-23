/* ==========================================================================
   Minimal QR encoder - byte mode, ECC level M, versions 1-10.
   Written here rather than pulled in so the QR can be generated at runtime
   from location.href: the code then always points at wherever the site is
   actually served from (localhost, GitHub Pages, a custom domain) with
   nothing to regenerate.
   ========================================================================== */
(function(){
'use strict';

/* ---- Galois field for Reed-Solomon ---- */
var EXP=new Array(512), LOG=new Array(256);
(function(){
  var x=1;
  for(var i=0;i<255;i++){ EXP[i]=x; LOG[x]=i; x<<=1; if(x&0x100) x^=0x11D; }
  for(i=255;i<512;i++) EXP[i]=EXP[i-255];
})();
function mul(a,b){ return (a===0||b===0)?0:EXP[LOG[a]+LOG[b]]; }

function rsPoly(n){
  var p=[1];
  for(var i=0;i<n;i++){
    var np=new Array(p.length+1).fill(0);
    for(var j=0;j<p.length;j++){
      np[j]^=mul(p[j],1);
      np[j+1]^=mul(p[j],EXP[i]);
    }
    p=np;
  }
  return p;
}
function rsEncode(data,n){
  var gen=rsPoly(n), res=new Array(n).fill(0);
  for(var i=0;i<data.length;i++){
    var f=data[i]^res[0];
    res.shift(); res.push(0);
    for(var j=0;j<n;j++) res[j]^=mul(gen[j+1],f);
  }
  return res;
}

/* version -> [total codewords, ec codewords per block, blocks] for ECC M */
var SPEC={
 1:[26,10,1],   2:[44,16,1],  3:[70,26,1],  4:[100,18,2], 5:[134,24,2],
 6:[172,16,4],  7:[196,18,4], 8:[242,22,4], 9:[292,22,5], 10:[346,26,5]
};
var ALIGN={1:[],2:[6,18],3:[6,22],4:[6,26],5:[6,30],6:[6,34],
           7:[6,22,38],8:[6,24,42],9:[6,26,46],10:[6,28,50]};
/* format bits for ECC M, masks 0-7 */
var FORMAT=[0x5412,0x5125,0x5E7C,0x5B4B,0x45F9,0x40CE,0x4F97,0x4AA0];

function capacity(v){
  var s=SPEC[v], blocks=s[2], ec=s[1];
  return s[0]-ec*blocks;               /* data codewords */
}

function encode(text){
  var bytes=[];
  for(var i=0;i<text.length;i++){
    var c=text.charCodeAt(i);
    if(c<0x80) bytes.push(c);
    else if(c<0x800){ bytes.push(0xC0|c>>6,0x80|c&63); }
    else { bytes.push(0xE0|c>>12,0x80|(c>>6&63),0x80|c&63); }
  }
  var v=1;
  while(v<=10 && capacity(v) < bytes.length+2+(v<10?1:2)) v++;
  if(v>10) throw new Error('too long for this encoder');

  var lenBits=v<10?8:16;
  var bits=[];
  function push(val,n){ for(var k=n-1;k>=0;k--) bits.push((val>>k)&1); }
  push(4,4);                            /* byte mode */
  push(bytes.length,lenBits);
  bytes.forEach(function(b){ push(b,8); });

  var cap=capacity(v)*8;
  for(var t=0;t<4&&bits.length<cap;t++) bits.push(0);
  while(bits.length%8) bits.push(0);
  var pad=[0xEC,0x11],pi=0;
  while(bits.length<cap){ push(pad[pi++%2],8); }

  var dcw=[];
  for(i=0;i<bits.length;i+=8){
    var b=0; for(var j=0;j<8;j++) b=(b<<1)|bits[i+j];
    dcw.push(b);
  }

  /* split into blocks, interleave data then ec */
  var s=SPEC[v], nBlocks=s[2], ecLen=s[1];
  var shorter=Math.floor(dcw.length/nBlocks), extra=dcw.length%nBlocks;
  var dBlocks=[],eBlocks=[],off=0;
  for(i=0;i<nBlocks;i++){
    var len=shorter+(i>=nBlocks-extra?1:0);
    var blk=dcw.slice(off,off+len); off+=len;
    dBlocks.push(blk); eBlocks.push(rsEncode(blk,ecLen));
  }
  var out=[],maxD=Math.max.apply(null,dBlocks.map(function(b){return b.length;}));
  for(i=0;i<maxD;i++) for(j=0;j<nBlocks;j++) if(i<dBlocks[j].length) out.push(dBlocks[j][i]);
  for(i=0;i<ecLen;i++) for(j=0;j<nBlocks;j++) out.push(eBlocks[j][i]);

  return {version:v,codewords:out};
}

function buildMatrix(v,codewords,mask){
  var n=v*4+17;
  var m=[],res=[];
  for(var i=0;i<n;i++){ m.push(new Array(n).fill(null)); res.push(new Array(n).fill(false)); }

  function finder(r,c){
    for(var y=-1;y<=7;y++) for(var x=-1;x<=7;x++){
      var rr=r+y,cc=c+x;
      if(rr<0||cc<0||rr>=n||cc>=n) continue;
      var on=(y>=0&&y<=6&&(x===0||x===6))||(x>=0&&x<=6&&(y===0||y===6))||(x>=2&&x<=4&&y>=2&&y<=4);
      m[rr][cc]=on?1:0; res[rr][cc]=true;
    }
  }
  finder(0,0); finder(0,n-7); finder(n-7,0);

  for(i=8;i<n-8;i++){
    var b=(i%2===0)?1:0;
    if(m[6][i]===null){ m[6][i]=b; res[6][i]=true; }
    if(m[i][6]===null){ m[i][6]=b; res[i][6]=true; }
  }
  var al=ALIGN[v];
  for(var a=0;a<al.length;a++) for(var b2=0;b2<al.length;b2++){
    var ar=al[a],ac=al[b2];
    if(res[ar][ac]) continue;
    for(var y2=-2;y2<=2;y2++) for(var x2=-2;x2<=2;x2++){
      var on2=Math.max(Math.abs(y2),Math.abs(x2))!==1;
      m[ar+y2][ac+x2]=on2?1:0; res[ar+y2][ac+x2]=true;
    }
  }
  m[n-8][8]=1; res[n-8][8]=true;                       /* dark module */

  var fmt=FORMAT[mask];
  for(i=0;i<15;i++){
    var bit=(fmt>>i)&1;
    if(i<6){ m[i][8]=bit; res[i][8]=true; }
    else if(i<8){ m[i+1][8]=bit; res[i+1][8]=true; }
    else { m[n-15+i][8]=bit; res[n-15+i][8]=true; }
    if(i<8){ m[8][n-1-i]=bit; res[8][n-1-i]=true; }
    else { m[8][15-i-1]=bit; res[8][15-i-1]=true; }
  }

  function maskFn(r,c){
    switch(mask){
      case 0: return (r+c)%2===0;
      case 1: return r%2===0;
      case 2: return c%3===0;
      case 3: return (r+c)%3===0;
      case 4: return (Math.floor(r/2)+Math.floor(c/3))%2===0;
      case 5: return (r*c)%2+(r*c)%3===0;
      case 6: return ((r*c)%2+(r*c)%3)%2===0;
      default:return ((r+c)%2+(r*c)%3)%2===0;
    }
  }

  var bitIdx=0, total=codewords.length*8;
  for(var col=n-1;col>0;col-=2){
    if(col===6) col--;
    for(var row=0;row<n;row++){
      for(var k=0;k<2;k++){
        var cc2=col-k;
        var up=((n-1-col)&2)===0;
        var rr2=up?n-1-row:row;
        if(res[rr2][cc2]) continue;
        var dark=0;
        if(bitIdx<total){
          dark=(codewords[bitIdx>>3]>>(7-(bitIdx&7)))&1;
        }
        bitIdx++;
        if(maskFn(rr2,cc2)) dark^=1;
        m[rr2][cc2]=dark;
      }
    }
  }
  for(i=0;i<n;i++) for(j2=0;j2<n;j2++){ var j2; if(m[i][j2]===null) m[i][j2]=0; }
  return m;
}

/* returns an SVG string; quiet zone included */
window.makeQR=function(text,opts){
  opts=opts||{};
  var dark=opts.dark||'#0D1626', light=opts.light||'#FFFFFF', quiet=opts.quiet===undefined?4:opts.quiet;
  var e=encode(text);
  var m=buildMatrix(e.version,e.codewords,opts.mask===undefined?2:opts.mask);
  var n=m.length, size=n+quiet*2;
  var path='';
  for(var r=0;r<n;r++){
    for(var c=0;c<n;c++){
      if(m[r][c]) path+='M'+(c+quiet)+' '+(r+quiet)+'h1v1h-1z';
    }
  }
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+size+' '+size+'" '+
         'shape-rendering="crispEdges" role="img" aria-label="QR">'+
         '<rect width="'+size+'" height="'+size+'" fill="'+light+'"/>'+
         '<path d="'+path+'" fill="'+dark+'"/></svg>';
};
})();
