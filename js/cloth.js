/* ==========================================================================
   Cloth - a scripture banner that hangs and ripples like fabric.

   Inspired by canvasui.dev/docs/components/cloth, but rewritten from scratch
   in vanilla WebGL for two reasons:

     1. That component renders live DOM through the experimental html-in-canvas
        API, which needs Chrome with chrome://flags/#canvas-draw-element or a
        registered origin trial. Safari and Firefox never show it, and neither
        does any iPhone. Most of this congregation would see nothing.
     2. It ships for React/Vue/Svelte. This site is static HTML with no build.

   So the text is painted to a 2D canvas and used as a texture instead. Same
   look, works everywhere, no dependency. If WebGL is missing or motion is
   reduced, the original markup simply stays visible and nothing is replaced.
   ========================================================================== */
(function(){
'use strict';

var VERT = [
'attribute vec2 aPos;',
'uniform float uTime,uWind,uAmp,uBrushT,uBrushStr,uAspect;',
'uniform vec2 uBrush;',
'varying vec2 vUV;',
'varying vec3 vN;',
'float wave(vec2 p,float t){',
'  float h=0.0;',
'  h+=sin(p.x*5.6+t*1.05)*0.55;',
'  h+=sin(p.x*3.1-p.y*2.2+t*0.68)*0.34;',
'  h+=sin(p.y*4.6+t*1.55)*0.20;',
'  h+=sin((p.x+p.y)*8.4-t*2.05)*0.11;',
'  return h;',
'}',
/* a decaying circular ripple from wherever the cursor last brushed */
'float brush(vec2 p){',
'  if(uBrushStr<=0.001) return 0.0;',
'  vec2 d=vec2((p.x-uBrush.x)*uAspect,p.y-uBrush.y);',
'  float r=length(d);',
'  return sin(r*26.0-uBrushT*8.5)*exp(-r*5.0)*exp(-uBrushT*2.4)*uBrushStr;',
'}',
'float height(vec2 p){',
/* pinned along the top edge, so the fall grows toward the bottom */
'  float pin=pow(clamp(p.y,0.0,1.0),1.3);',
'  return (wave(p,uTime)*uWind+brush(p))*uAmp*pin;',
'}',
'void main(){',
'  vec2 p=aPos;',
'  float h=height(p);',
'  float e=0.012;',
'  float hx=height(p+vec2(e,0.0))-height(p-vec2(e,0.0));',
'  float hy=height(p+vec2(0.0,e))-height(p-vec2(0.0,e));',
'  vN=normalize(vec3(-hx/(2.0*e),-hy/(2.0*e),1.0));',
'  vUV=vec2(p.x,p.y);',   // canvas row 0 is the top, and so is p.y=0
/* fabric gathers slightly where it folds, and depth pulls it in a touch */
'  vec2 pos=p;',
'  pos.x+=hx*0.55;',
'  pos.y+=hy*0.35;',
'  float persp=1.0+h*0.10;',
'  vec2 clip=(pos-0.5)*2.0*persp;',
'  gl_Position=vec4(clip.x,-clip.y,0.0,1.0);',
'}'].join('\n');

var FRAG = [
'precision mediump float;',
'uniform sampler2D uTex;',
'uniform float uLight,uSheen;',
'varying vec2 vUV;',
'varying vec3 vN;',
'void main(){',
'  vec4 c=texture2D(uTex,vUV);',
'  if(c.a<0.003) discard;',
'  vec3 n=normalize(vN);',
'  vec3 L=normalize(vec3(-0.34,0.58,0.74));',
'  float lam=clamp(dot(n,L)*0.5+0.5,0.0,1.0);',
'  float lit=mix(1.0,lam*1.18,uLight);',
'  vec3 R=reflect(-L,n);',
'  float spec=pow(max(R.z,0.0),22.0)*uSheen;',
/* the texture arrives premultiplied, so shade and re-premultiply */
'  vec3 rgb=c.a>0.0?c.rgb/c.a:c.rgb;',
'  rgb=rgb*lit+spec;',
'  gl_FragColor=vec4(rgb*c.a,c.a);',
'}'].join('\n');

function compile(gl,type,src){
  var s=gl.createShader(type);
  gl.shaderSource(s,src); gl.compileShader(s);
  if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)) return null;
  return s;
}

function Cloth(host,opts){
  var self=this;
  this.host=host;
  this.o=Object.assign({wind:1.0,speed:0.42,amplitude:0.055,brush:1.0,
                        brushSize:0.28,light:0.55,sheen:0.16},opts||{});

  var cv=document.createElement('canvas');
  cv.className='cloth-canvas';
  cv.setAttribute('aria-hidden','true');

  /* get a context before touching the DOM, so a browser without WebGL is
     never left with an empty canvas sitting in the page */
  var gl=cv.getContext('webgl',{alpha:true,premultipliedAlpha:true,antialias:true})
      || cv.getContext('experimental-webgl',{alpha:true,premultipliedAlpha:true});
  if(!gl) throw new Error('no webgl');
  host.appendChild(cv);
  this.cv=cv;
  this.gl=gl;

  var vs=compile(gl,gl.VERTEX_SHADER,VERT), fs=compile(gl,gl.FRAGMENT_SHADER,FRAG);
  if(!vs||!fs) throw new Error('shader');
  var pr=gl.createProgram();
  gl.attachShader(pr,vs); gl.attachShader(pr,fs); gl.linkProgram(pr);
  if(!gl.getProgramParameter(pr,gl.LINK_STATUS)) throw new Error('link');
  gl.useProgram(pr); this.pr=pr;

  /* a grid of triangles; 40x28 is plenty for smooth folds */
  var NX=40,NY=28,verts=[];
  for(var y=0;y<NY;y++){
    for(var x=0;x<NX;x++){
      var x0=x/NX,x1=(x+1)/NX,y0=y/NY,y1=(y+1)/NY;
      verts.push(x0,y0, x1,y0, x0,y1,  x1,y0, x1,y1, x0,y1);
    }
  }
  this.count=verts.length/2;
  var buf=gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,buf);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(verts),gl.STATIC_DRAW);
  var loc=gl.getAttribLocation(pr,'aPos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);

  this.u={};
  ['uTime','uWind','uAmp','uBrush','uBrushT','uBrushStr','uAspect','uLight','uSheen','uTex']
    .forEach(function(n){ self.u[n]=gl.getUniformLocation(pr,n); });

  this.tex=gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D,this.tex);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
  /* the mesh warps the texture, so samples are taken at an angle; without
     anisotropic filtering the glyph edges break up into visible pixels */
  var aniso=gl.getExtension('EXT_texture_filter_anisotropic')
        || gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic')
        || gl.getExtension('MOZ_EXT_texture_filter_anisotropic');
  if(aniso){
    var max=gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
    gl.texParameterf(gl.TEXTURE_2D,aniso.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(8,max));
  }
  this.maxTex=gl.getParameter(gl.MAX_TEXTURE_SIZE)||2048;

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);

  this.brushPos=[0.5,0.5]; this.brushT=99; this.brushStr=0;
  this.t=0; this.last=0; this.running=false;

  this.onMove=function(e){
    var r=host.getBoundingClientRect();
    self.brushPos=[(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height];
    self.brushT=0; self.brushStr=self.o.brush;
  };
  host.addEventListener('pointermove',this.onMove,{passive:true});

  this.onResize=function(){ self.resize(); };
  window.addEventListener('resize',this.onResize);

  cv.addEventListener('webglcontextlost',function(e){
    e.preventDefault();
    self.stop();
    if(typeof self.onLost==='function') self.onLost();
  });
}

Cloth.prototype.paint=function(draw){
  /* draw(ctx, w, h) fills the 2D canvas that becomes the fabric.
     It is rendered above the display resolution: the mesh stretches and
     compresses the texture, and without spare detail the type shows its
     pixels wherever the fabric is pulled. */
  var dpr=Math.min(window.devicePixelRatio||1,2);
  var r=this.host.getBoundingClientRect();
  var ss=2;
  var cap=this.maxTex||2048;
  while(ss>1 && (r.width*dpr*ss>cap || r.height*dpr*ss>cap)) ss-=0.5;
  var scale=dpr*ss;
  var w=Math.max(2,Math.round(r.width*scale)), h=Math.max(2,Math.round(r.height*scale));
  var c=document.createElement('canvas'); c.width=w; c.height=h;
  var ctx=c.getContext('2d');
  ctx.textRendering='geometricPrecision';
  ctx.scale(scale,scale);
  draw(ctx,r.width,r.height);
  var gl=this.gl;
  gl.bindTexture(gl.TEXTURE_2D,this.tex);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,c);
  this.srcW=r.width; this.srcH=r.height;
  this.drawFn=draw;
  this.resize();
};

Cloth.prototype.resize=function(){
  var dpr=Math.min(window.devicePixelRatio||1,2);
  var r=this.host.getBoundingClientRect();
  if(!r.width||!r.height) return;
  if(this.srcW&&Math.abs(r.width-this.srcW)>2&&this.drawFn){
    var fn=this.drawFn; this.drawFn=null; this.paint(fn); return;
  }
  this.cv.width=Math.round(r.width*dpr);
  this.cv.height=Math.round(r.height*dpr);
  this.gl.viewport(0,0,this.cv.width,this.cv.height);
  this.aspect=r.width/r.height;
};

Cloth.prototype.frame=function(now){
  if(!this.running) return;
  var dt=this.last?Math.min((now-this.last)/1000,0.05):0.016;
  this.last=now;
  this.t+=dt*this.o.speed;
  this.brushT+=dt;
  if(this.brushStr>0) this.brushStr=Math.max(0,this.brushStr-dt*0.55);

  var gl=this.gl,u=this.u;
  gl.useProgram(this.pr);
  gl.uniform1f(u.uTime,this.t*2.0);
  gl.uniform1f(u.uWind,this.o.wind);
  gl.uniform1f(u.uAmp,this.o.amplitude);
  gl.uniform2f(u.uBrush,this.brushPos[0],this.brushPos[1]);
  gl.uniform1f(u.uBrushT,this.brushT);
  gl.uniform1f(u.uBrushStr,this.brushStr);
  gl.uniform1f(u.uAspect,this.aspect||2.0);
  gl.uniform1f(u.uLight,this.o.light);
  gl.uniform1f(u.uSheen,this.o.sheen);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D,this.tex);
  gl.uniform1i(u.uTex,0);

  gl.clearColor(0,0,0,0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLES,0,this.count);

  if(this.frameOnly) return;
  var self=this;
  this.raf=requestAnimationFrame(function(t){ self.frame(t); });
};

/* draw exactly one frame, so a caller can confirm the fabric actually
   rendered before it hides the fallback markup */
Cloth.prototype.renderOnce=function(){
  this.running=true;
  this.frameOnly=true;
  this.frame(performance.now());
  this.frameOnly=false;
  this.running=false;
};

Cloth.prototype.start=function(){
  if(this.running) return;
  this.running=true; this.last=0;
  var self=this;
  this.raf=requestAnimationFrame(function(t){ self.frame(t); });
};
Cloth.prototype.stop=function(){
  this.running=false;
  if(this.raf) cancelAnimationFrame(this.raf);
};
Cloth.prototype.destroy=function(){
  this.stop();
  this.host.removeEventListener('pointermove',this.onMove);
  window.removeEventListener('resize',this.onResize);
  if(this.cv.parentNode) this.cv.parentNode.removeChild(this.cv);
};

window.Cloth=Cloth;
})();
