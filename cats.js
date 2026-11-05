/* Котики на сцене: рисуются canvas-ригом drawBaseCat, аксессуары — здесь */
(function(){
'use strict';
const C=window.BDAY||{}, A=()=>window.SCENE_ANCHORS, OUT='#261e1c';
const NS='http://www.w3.org/1999/xhtml', W=1920,H=1080, BASE=128;
let ctxB,ctxF,LITEC=false;
function mkCanvas(layer){
  if(!(layer instanceof SVGElement)){ // лёгкий режим: обычный div-слой
    const cv=document.createElement('canvas'); cv.width=W;cv.height=H; cv.style.cssText='position:absolute;left:0;top:0;width:1920px;height:1080px;display:block';
    layer.appendChild(cv); return cv.getContext('2d');
  }
  const fo=document.createElementNS('http://www.w3.org/2000/svg','foreignObject');
  fo.setAttribute('x',0);fo.setAttribute('y',0);fo.setAttribute('width',W);fo.setAttribute('height',H);
  const cv=document.createElementNS(NS,'canvas'); cv.width=W;cv.height=H; cv.style.cssText='width:1920px;height:1080px;display:block';
  fo.appendChild(cv); layer.appendChild(fo); return cv.getContext('2d');
}
const rr=(c,x,y,w,h,r)=>{c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();};
function ink(c,f,lw){c.fillStyle=f;c.fill();c.strokeStyle=OUT;c.lineWidth=lw;c.lineJoin='round';c.lineCap='round';c.stroke();}
const HEADCY=-.7, HEADTOP=-1.04;

/* аксессуары (в координатах кота: origin у ног, S — масштаб) */
function hat(c,S,col,tilt=.18,dx=.06){
  c.save();c.translate(dx*S,HEADTOP*S+.03*S);c.rotate(tilt);
  c.beginPath();c.moveTo(-.19*S,0);c.lineTo(0,-.42*S);c.lineTo(.19*S,0);c.closePath();ink(c,col,S*.035);
  c.fillStyle='rgba(255,255,255,.75)';[[-.05,-.1],[.06,-.17],[0,-.27],[.08,-.05]].forEach(([x,y])=>{c.beginPath();c.arc(x*S,y*S,S*.022,0,7);c.fill();});
  c.beginPath();c.arc(0,-.43*S,S*.05,0,7);ink(c,'#ffe27a',S*.03);
  c.beginPath();c.ellipse(0,.005*S,.2*S,.035*S,0,0,7);ink(c,'#fff',S*.03);
  c.restore();
}
function beret(c,S){
  c.save();c.translate(-.06*S,(HEADTOP+.02)*S);c.rotate(-.12);
  c.beginPath();c.ellipse(0,0,.4*S,.14*S,0,0,7);ink(c,'#d6455d',S*.04);
  c.beginPath();c.arc(.02*S,-.15*S,S*.035,0,7);ink(c,'#d6455d',S*.03);
  c.restore();
}
function scarf(c,S,t){
  const y=-.38*S;
  c.beginPath();c.ellipse(0,y,.45*S,.085*S,0,0,7);ink(c,'#f48fb1',S*.04);
  c.strokeStyle='rgba(255,255,255,.8)';c.lineWidth=S*.03;
  for(let i=-3;i<=3;i++){c.beginPath();c.moveTo(i*.12*S,y-.07*S);c.lineTo(i*.12*S+.02*S,y+.07*S);c.stroke();}
  c.save();c.translate(.3*S,y+.05*S);c.rotate(.25+Math.sin(t*2)*.08);
  rr(c,0,0,.15*S,.32*S,S*.04);ink(c,'#f48fb1',S*.04);c.restore();
}
function apron(c,S){
  rr(c,-.28*S,-.34*S,.56*S,.3*S,S*.07);ink(c,'#fff',S*.04);
  c.strokeStyle='#f8bfd2';c.lineWidth=S*.03;c.beginPath();c.moveTo(-.18*S,-.28*S);c.lineTo(.18*S,-.28*S);c.stroke();
}
function bowtie(c,S,col){
  c.save();c.translate(0,-.37*S);c.beginPath();c.moveTo(0,0);c.lineTo(-.12*S,-.07*S);c.lineTo(-.12*S,.07*S);c.closePath();ink(c,col,S*.03);
  c.beginPath();c.moveTo(0,0);c.lineTo(.12*S,-.07*S);c.lineTo(.12*S,.07*S);c.closePath();ink(c,col,S*.03);c.restore();
}
function dishDraw(c,S,type){ // начало координат — центр тарелки
  if(type==='dome'){
    c.beginPath();c.ellipse(0,.03*S,.3*S,.045*S,0,0,7);ink(c,'#e8e4ee',S*.035);
    c.beginPath();c.arc(0,.02*S,.24*S,Math.PI,0);c.closePath();ink(c,'#f4f2f8',S*.035);
    c.beginPath();c.arc(0,-.25*S,S*.035,0,7);ink(c,'#d6d2dc',S*.03);
    c.strokeStyle='rgba(255,255,255,.9)';c.lineWidth=S*.03;c.beginPath();c.arc(0,.02*S,.17*S,Math.PI*1.1,Math.PI*1.4);c.stroke();
  }else if(type==='cheese'){
    c.beginPath();c.ellipse(0,.03*S,.3*S,.05*S,0,0,7);ink(c,'#fffaf5',S*.035);
    c.beginPath();c.moveTo(-.2*S,.0);c.lineTo(.18*S,-.1*S);c.lineTo(.2*S,.02*S);c.lineTo(-.2*S,.03*S);c.closePath();ink(c,'#ffd35e',S*.03);
    c.fillStyle='#e8a93a';[[-.05,-.01],[.06,-.04],[.12,-.0]].forEach(([x,y])=>{c.beginPath();c.arc(x*S,y*S,S*.018,0,7);c.fill();});
  }else{
    c.beginPath();c.ellipse(0,.03*S,.32*S,.05*S,0,0,7);ink(c,'#fffaf5',S*.035);
    c.beginPath();c.ellipse(-.07*S,-.02*S,.12*S,.06*S,.3,0,7);ink(c,'#f19a6b',S*.03);
    c.beginPath();c.arc(.1*S,-.03*S,S*.05,0,7);ink(c,'#8fc47a',S*.03);c.beginPath();c.arc(.18*S,-.01*S,S*.04,0,7);ink(c,'#e84f5e',S*.03);
  }
}
function carry(c,S,type,side=-1){c.save();c.translate(side*.5*S,-.3*S);dishDraw(c,S,type);c.restore();}
function camera(c,S,flash){
  c.save();c.translate(0,-.2*S);
  rr(c,-.26*S,-.14*S,.52*S,.3*S,S*.05);ink(c,'#4a4650',S*.035);
  rr(c,-.26*S,-.14*S,.52*S,.09*S,S*.04);ink(c,'#d8d4dc',S*.03);
  c.beginPath();c.arc(0,.02*S,.1*S,0,7);ink(c,'#8a86a0',S*.035);c.beginPath();c.arc(0,.02*S,.055*S,0,7);c.fillStyle='#2a2438';c.fill();
  c.beginPath();c.arc(-.01*S,.0,S*.02,0,7);c.fillStyle='#fff';c.fill();
  if(flash>0){c.globalAlpha=flash;c.fillStyle='#fffbe0';c.beginPath();c.arc(.18*S,-.1*S,S*.5*flash+S*.1,0,7);c.fill();c.globalAlpha=1;}
  c.restore();
}
function palette(c,S){
  c.save();c.translate(.55*S,-.3*S);c.rotate(.3);
  c.beginPath();c.ellipse(0,0,.2*S,.14*S,0,0,7);ink(c,'#e8c08a',S*.035);
  [['#e8445f',-.09,-.03],['#4a86d8',0,-.07],['#f6c945',.08,-.02],['#5aa85a',-.02,.05]].forEach(([col,x,y])=>{c.beginPath();c.arc(x*S,y*S,S*.028,0,7);c.fillStyle=col;c.fill();});
  c.restore();
}
function note(c,x,y,s,col){c.fillStyle=col;c.strokeStyle=OUT;c.lineWidth=2.5;c.beginPath();c.ellipse(x,y,7*s,5*s,-.4,0,7);c.fill();c.stroke();c.beginPath();c.moveTo(x+6*s,y-1*s);c.lineTo(x+6*s,y-24*s);c.lineTo(x+16*s,y-18*s);c.stroke();}

/* рисуем кота с аксессуарами */
const SPR=new Map();
function catSprite(k,S,pose,blink){
  const key=k.name+'|'+pose+'|'+blink+'|'+(k.carry||'');
  let sp=SPR.get(key); if(sp) return sp;
  const w=Math.ceil(2.1*S), h=Math.ceil(1.8*S), ox=w/2, oy=Math.ceil(1.62*S);
  const cv=document.createElement('canvas'); cv.width=w; cv.height=h; const g=cv.getContext('2d');
  g.save(); g.translate(ox,oy);
  window.drawBaseCat(g,{x:0,y:0,scale:S,t:.2,phase:0,walkPhase:pose===0?null:(pose===1?1.2:-1.2),facing:1,blink:blink});
  k.acc&&k.acc(g,S,{t:0,carry:k.carry,flash:0,name:k.name});
  g.restore(); sp={cv,ox,oy}; SPR.set(key,sp); return sp;
}
function drawCatLite(ctx,k){
  const S=BASE*(k.scale||1), t=k.t, ph=k.phase||0;
  let pose=0, bobY=Math.sin(t*2.1+ph)*S*.012, sway=Math.sin(t*.9+ph)*.02;
  if(k.walk!=null){pose=Math.sin(k.walk)>0?1:2; bobY=-Math.abs(Math.sin(k.walk))*S*.035; sway=Math.sin(k.walk)*.03;}
  const blink=((t+ph)%3.5)<.14?1:0;
  const sp=catSprite(k,S,pose,blink);
  ctx.save(); ctx.translate(k.x,k.y+(k.hop||0)+bobY); ctx.rotate((k.rot||0)+sway); ctx.drawImage(sp.cv,-sp.ox,-sp.oy); 
  if(k.flash>0){ctx.translate(0,-.2*S);const fl=k.flash;ctx.globalAlpha=fl;ctx.fillStyle='#fffbe0';ctx.beginPath();ctx.arc(.18*S,-.1*S,S*.5*fl+S*.1,0,7);ctx.fill();}
  ctx.restore();
}
function drawCat(ctx,k){
  if(LITEC) return drawCatLite(ctx,k);
  const S=BASE*(k.scale||1);
  ctx.save();ctx.translate(k.x,k.y+(k.hop||0));ctx.rotate(k.rot||0);
  window.drawBaseCat(ctx,{x:0,y:0,scale:S,t:k.t,phase:k.phase,walkPhase:k.walk,facing:k.face});
  k.acc&&k.acc(ctx,S,k);
  ctx.restore();
}

/* ---------- состояние котов ---------- */
const cats={};
let started=false, lastCompl=-1e9, complIdx=0;
function setup(){
  const a=A();
  const mk=(name,extra)=>Object.assign({name,x:a[name].x,y:a[name].y,scale:a[name].scale,phase:Math.random()*6,t:0,face:a[name].flip?-1:1},extra);
  cats.painter=mk('painter',{face:-1,acc:(c,S)=>{beret(c,S);palette(c,S);}});
  cats.waiterA=mk('waiterA',{face:1,ox:a.waiterA.x,acc:(c,S,k)=>{apron(c,S);hat(c,S,'#ffb3cf');bowtie(c,S,'#e8445f');if(k.carry)carry(c,S,k.carry);}});
  cats.waiterB=mk('waiterB',{face:1,ox:a.waiterB.x,acc:(c,S,k)=>{apron(c,S);hat(c,S,'#ffe27a');if(k.carry)carry(c,S,k.carry);}});
  cats.compliment=mk('compliment',{acc:(c,S)=>{hat(c,S,'#c9a8f0',-.15);}});
  cats.dancer=mk('dancer',{acc:(c,S,k)=>{hat(c,S,'#ffb3cf',.25);bowtie(c,S,'#e8445f');}});
  cats.lamplighter=mk('lamplighter',{acc:(c,S)=>{hat(c,S,'#ffe27a');}});
  cats.photographer=mk('photographer',{face:-1,flash:0,acc:(c,S,k)=>{hat(c,S,'#ffb3cf',.2);camera(c,S,k.flash);}});
  cats.snowCat=mk('snowCat',{face:-1,acc:(c,S,k)=>{scarf(c,S,k.t);hat(c,S,'#c9a8f0');}});
  const stand={A:{x:700,y:782},B:{x:1240,y:790}};
  waiters=[
    mkW(cats.waiterA,{x:a.waiterA.x,y:a.waiterA.y},[],stand.A,{x:630,y:706},['dome','plate','cheese'],1.5,0),
    mkW(cats.waiterB,{x:a.waiterB.x,y:a.waiterB.y},[{x:520,y:804}],stand.B,{x:1170,y:720},['plate','cheese','dome'],14,1)];
  Scene.options.autoRelightMs=null;
  // зажигаем свечи вручную, а поле «фонарщик» делает это на глазах
  nextPaintAt=2; 
}
let waiters=[];
let nextPaintAt=0, phase='idle', eraseAt=0, lampState={mode:'idle',t0:0,idx:0}, snowAt=3, photoAt=6, bubble=null;


/* ---------- официанты: принести блюдо на стол, уйти, вернуться, забрать, унести ---------- */
function mkW(k,home,wp,stand,spot,types,hold0,i){
  return {k,home,wp,stand,spot,types,ti:0,i,st:'hold',t0:0,holdFor:hold0,path:[],next:null,lt:null,dish:null,type:types[0],hidden:false};
}
function goto_(w,pts,next){w.path=pts.slice();w.next=next;w.st='walk';}
function waiterTick(w,t){
  const k=w.k, dt=w.lt==null?0:Math.min(.1,Math.max(0,t-w.lt)); w.lt=t; const S=BASE*(k.scale||1);
  const there=[].concat(w.wp,[w.stand]), back=[].concat(w.wp.slice().reverse(),[w.home]);
  if(w.firstT==null){w.firstT=t;w.t0=t;}
  k.hop=0; k.walk=null; k.hidden=w.hidden;
  const hand=()=>({x:k.x-.5*S,y:k.y-.3*S}), ease=p=>p*p*(3-2*p);
  if(w.st==='walk'){
    const tg=w.path[0], dx=tg.x-k.x, dy=tg.y-k.y, d=Math.hypot(dx,dy), step=125*dt;
    if(d<=step){k.x=tg.x;k.y=tg.y;w.path.shift();if(!w.path.length){w.st=w.next;w.t0=t;}}
    else{k.x+=dx/d*step;k.y+=dy/d*step;if(Math.abs(dx)>1)k.face=dx>0?1:-1;}
    if(w.st==='walk'){k.walk=t*10;k.hop=0;}
    k.carry=(w.next==='place'||w.next==='gone'||w.next==='hold')?w.type:null;
    return;
  }
  k.face=1;
  if(w.st==='hold'){k.carry=w.type;k.x=w.home.x;k.y=w.home.y;if(t-w.t0>=w.holdFor)goto_(w,there,'place');}
  else if(w.st==='place'){
    k.carry=null; const p=Math.min(1,(t-w.t0)/1.0), e=ease(p);
    if(p<1){const h=hand();w.hx=w.hx==null?h.x:w.hx;w.hy=w.hy==null?h.y:w.hy;
      w.dish={type:w.type,x:w.hx+(w.spot.x-w.hx)*e,y:w.hy+(w.spot.y-w.hy)*e-Math.sin(e*Math.PI)*50};}
    else{w.hx=w.hy=null;w.dish={type:w.type,x:w.spot.x,y:w.spot.y};w.onTable=true;w.restFor=9;goto_(w,back,'rest');}
  }
  else if(w.st==='rest'){k.carry=null;if(t-w.t0>=w.restFor)goto_(w,there,'pick');}
  else if(w.st==='pick'){
    k.carry=null; const p=Math.min(1,(t-w.t0)/1.0), e=ease(p), h=hand();
    if(p<1){w.dish={type:w.type,x:w.spot.x+(h.x-w.spot.x)*e,y:w.spot.y+(h.y-w.spot.y)*e-Math.sin(e*Math.PI)*50};}
    else{w.dish=null;w.onTable=false;goto_(w,back.concat([{x:-170,y:w.home.y}]),'gone');}
  }
  else if(w.st==='gone'){
    w.hidden=true;k.hidden=true;k.carry=null;
    if(t-w.t0>3.5){w.hidden=false;k.hidden=false;w.ti=(w.ti+1)%w.types.length;w.type=w.types[w.ti];k.x=-170;k.y=w.home.y;w.holdFor=7;goto_(w,[w.home],'hold');}
  }
}
function brush(ctx,k,tip){
  const S=BASE*k.scale, sx=k.x-.5*S, sy=k.y-.32*S;
  ctx.save();ctx.lineCap='round';
  ctx.strokeStyle=OUT;ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(tip.x,tip.y);ctx.stroke();
  ctx.strokeStyle='#e8b070';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(tip.x,tip.y);ctx.stroke();
  ctx.fillStyle='#d83a6b';ctx.strokeStyle=OUT;ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(tip.x,tip.y,6,0,7);ctx.fill();ctx.stroke();
  ctx.restore();
}
function bubbleDraw(ctx,text,x,y,alpha){
  ctx.save();ctx.globalAlpha=alpha;ctx.font='30px "Marck Script",cursive';
  const words=text.split(' '),lines=[];let cur='';
  words.forEach(w=>{const t=cur?cur+' '+w:w;if(ctx.measureText(t).width>270&&cur){lines.push(cur);cur=w;}else cur=t;});lines.push(cur);
  const w=Math.max(...lines.map(l=>ctx.measureText(l).width))+44,h=lines.length*36+30;
  const bx=x-w/2,by=y-h;
  ctx.beginPath();ctx.moveTo(bx+20,by);ctx.arcTo(bx+w,by,bx+w,by+h,20);ctx.arcTo(bx+w,by+h,bx,by+h,20);
  ctx.lineTo(bx+w*.62,by+h);ctx.lineTo(bx+w*.7,by+h+26);ctx.lineTo(bx+w*.45,by+h);
  ctx.arcTo(bx,by+h,bx,by,20);ctx.arcTo(bx,by,bx+w,by,20);ctx.closePath();
  ctx.fillStyle='#fffaf6';ctx.fill();ctx.strokeStyle=OUT;ctx.lineWidth=4;ctx.lineJoin='round';ctx.stroke();
  ctx.fillStyle=OUT;ctx.textAlign='center';lines.forEach((l,i)=>ctx.fillText(l,x,by+36+i*36-4));
  ctx.fillStyle='#ef5a7e';ctx.font='24px sans-serif';ctx.fillText('♥',bx+w-18,by+22);
  ctx.restore();
}

function frame(T,dt){
  if(!started){ if(!Scene.layers.back||!window.SCENE_ANCHORS) return; LITEC=!!Scene.lite;ctxB=mkCanvas(Scene.layers.back);ctxF=mkCanvas(Scene.layers.front);setup();started=true; }
  const t=T/1000, a=A();
  ctxB.clearRect(0,0,W,H);ctxF.clearRect(0,0,W,H);
  if(LITEC)Scene.lite.balloons(ctxB,t);
  Object.values(cats).forEach(k=>{k.t=t;});

  waiters.forEach(w=>waiterTick(w,t));
  /* шарики 2 и 4 плавно покачиваются */
  const b2=LITEC?null:document.getElementById('bal2'),b4=document.getElementById('bal4');
  if(b2)b2.setAttribute('transform',`translate(0 ${(Math.sin(t*2*Math.PI/3.4)*7).toFixed(2)}) rotate(${(Math.sin(t*2*Math.PI/5.3+.5)*1.4).toFixed(3)} 925 585)`);
  if(b4)b4.setAttribute('transform',`translate(0 ${(Math.sin(t*2*Math.PI/3.9+1.7)*7).toFixed(2)}) rotate(${(Math.sin(t*2*Math.PI/4.7+2.2)*1.4).toFixed(3)} 1090 590)`);
  /* танцор */
  const d=cats.dancer; d.x=a.dancer.x+Math.sin(t*1.6)*14; d.hop=-Math.abs(Math.sin(t*3.2))*22; d.rot=Math.sin(t*3.2)*.12; d.walk=t*9; d.face=Math.sin(t*1.6)>0?1:-1;
  /* снежный: подпрыгивает и кидает */
  const sn=cats.snowCat; const sp=(t-snowAt);
  sn.hop=sp>0&&sp<.5?-Math.sin(sp/.5*Math.PI)*26:0; sn.rot=sp>0&&sp<.5?-.18*Math.sin(sp/.5*Math.PI):0;
  if(t>=snowAt+.25&&!sn.thrown){sn.thrown=true;Scene.snowBurst(a.snowCat.snowOrigin.x,a.snowCat.snowOrigin.y,70,-1);}
  if(t>=snowAt+.5){snowAt=t+4.5;sn.thrown=false;}
  /* фотограф */
  const ph=cats.photographer; const pt=t-photoAt; ph.flash=pt>0&&pt<.35?1-pt/.35:0;
  if(pt>=.1&&!ph.shot){ph.shot=true;Scene.nextPhoto();}
  if(pt>=.6){photoAt=t+9;ph.shot=false;}
  /* художник */
  const pa=cats.painter;
  if(phase==='idle'&&t>=nextPaintAt){const g=C.paintedGreetings||['С днём рождения, Маша'];Scene.paintGreeting(g[complIdx++%g.length],7000);phase='paint';}
  else if(phase==='paint'&&Scene.paint.done){phase='hold';eraseAt=t+5;}
  else if(phase==='hold'&&t>=eraseAt){Scene.eraseGreeting(3000);phase='erase';eraseAt=t+3.2;}
  else if(phase==='erase'&&t>=eraseAt){phase='idle';nextPaintAt=t+3;}
  pa.x=a.painter.x+(phase==='paint'?Math.sin(t*5)*2:0);
  /* комплименты */
  if(t-lastCompl>6){lastCompl=t;const l=C.compliments||['Ты чудо'];bubble={text:l[Math.floor(Math.random()*l.length)],t0:t};}
  /* фонарщик */
  const lp=cats.lamplighter, S=BASE*lp.scale, handX=lp.x-.45*S, handY=lp.y-.4*S;
  let tip={x:handX-30,y:handY-150}; // в покое жердь вверх
  const cands=a.candelabra.candles.concat(a.teaCandles).concat(a.cake.candles);
  if(!Scene.candles.lit){
    if(lampState.mode==='idle'){lampState={mode:'go',t0:t,idx:0};}
    const e=t-lampState.t0, i=Math.min(cands.length-1,Math.floor(e/.7)); const c=cands[i];
    const tgt={x:c.x+10,y:c.y};
    const k=Math.min(1,e/.8); tip={x:lerp(handX-30,tgt.x,k)+0,y:lerp(handY-150,tgt.y+10,k)};
    // длина жерди ограничена
    const dx=tip.x-handX, dy=tip.y-handY, L=Math.hypot(dx,dy), Lmax=360;
    if(L>Lmax){tip={x:handX+dx/L*Lmax,y:handY+dy/L*Lmax};}
    if(e>cands.length*.7+.6){Scene.candles.relight();lampState={mode:'idle',t0:t};}
  } else lampState.mode='idle';
  function lerp(a,b,k){return a+(b-a)*k;}

  /* ---- рисуем: задний слой ---- */
  drawCat(ctxB,cats.compliment);
  drawCat(ctxB,lp);
  // жердь фонарщика
  ctxB.save();ctxB.lineCap='round';
  ctxB.strokeStyle=OUT;ctxB.lineWidth=10;ctxB.beginPath();ctxB.moveTo(handX,handY);ctxB.lineTo(tip.x,tip.y);ctxB.stroke();
  ctxB.strokeStyle='#d9a066';ctxB.lineWidth=5;ctxB.beginPath();ctxB.moveTo(handX,handY);ctxB.lineTo(tip.x,tip.y);ctxB.stroke();
  ctxB.fillStyle='#ffb347';ctxB.strokeStyle=OUT;ctxB.lineWidth=2.5;ctxB.beginPath();ctxB.ellipse(tip.x,tip.y-7,6,10,0,0,7);ctxB.fill();ctxB.stroke();
  ctxB.restore();
  if(bubble){const e=t-bubble.t0,al=Math.min(1,e/.4)*Math.min(1,(5.4-e)/.5);
    if(al>0){ if(LITEC){ if(!bubble.cv){const cv=document.createElement('canvas');cv.width=460;cv.height=230;bubbleDraw(cv.getContext('2d'),bubble.text,230,190,1);bubble.cv=cv;}
        ctxB.globalAlpha=Math.max(0,al);ctxB.drawImage(bubble.cv,a.compliment.bubble.x-230,a.compliment.bubble.y-190);ctxB.globalAlpha=1; }
      else bubbleDraw(ctxB,bubble.text,a.compliment.bubble.x,a.compliment.bubble.y,Math.max(0,al));}}
  /* ---- передний слой ---- */
  waiters.forEach(w=>{if(w.dish){ctxF.save();ctxF.translate(w.dish.x,w.dish.y);dishDraw(ctxF,BASE,w.dish.type);ctxF.restore();}});
  const order=['waiterA','waiterB','painter','dancer','photographer','snowCat'].sort((p,q)=>cats[p].y-cats[q].y);
  order.forEach(n=>{if(!cats[n].hidden)drawCat(ctxF,cats[n]);});
  if(phase==='paint'||phase==='erase'){const tipP=Scene.paint.tip();if(tipP)brush(ctxF,pa,tipP);}
  // ноты танцора
  for(let i=0;i<3;i++){const k=(t*.6+i/3)%1;note(ctxF,d.x+70+Math.sin(k*6+i)*18,d.y-110-k*90,1,['#ff7aa2','#7ab8ff','#ffd34d'][i]);ctxF.globalAlpha=1;}
}
function boot(){
  if(!window.Scene||!Scene.layers.back){return setTimeout(boot,100);}
  window.SceneHooks={onFrame:frame};
}
boot();
})();
