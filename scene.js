/* ============================================================
   СЦЕНА (без котиков) — всё нарисовано векторно кодом.
   Тексты берутся из config.js (BDAY.*), фото — из photos.js.
   Для котиков экспортируются точки: window.SCENE_ANCHORS
   и слои: Scene.layers.{back, ladder, front}
   ============================================================ */
(function () {
'use strict';
const C = window.BDAY || {};
const W = 1920, H = 1080;
const OUT = '#4a3042';            // тёмно-коричневая «маркерная» обводка
const q = new URLSearchParams(location.search);

/* ---------- утилиты ---------- */
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const R = mulberry32(20021105);
const rnd = (a,b)=>a+(b-a)*R();
const f1 = n=>Math.round(n*10)/10;
const lerp=(a,b,t)=>a+(b-a)*t;
const st = (w=4,c=OUT)=>`stroke="${c}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const star4 = (x,y,r,fill='#fff6c8',extra='')=>`<path d="M${x} ${y-r} Q${x+r*.12} ${y-r*.12} ${x+r} ${y} Q${x+r*.12} ${y+r*.12} ${x} ${y+r} Q${x-r*.12} ${y+r*.12} ${x-r} ${y} Q${x-r*.12} ${y-r*.12} ${x} ${y-r}Z" fill="${fill}" ${extra}/>`;
const heart = (x,y,s,fill='#e8445f',sw=3)=>`<path transform="translate(${x} ${y}) scale(${s})" d="M0 8 C-14 -2 -12 -14 -5 -14 C-2 -14 0 -11 0 -9 C0 -11 2 -14 5 -14 C12 -14 14 -2 0 8Z" fill="${fill}" ${st(sw/s)}/>`;

function bow(x,y,s=1,fill='#f48fb1',rot=0){
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">
   <path d="M-2 4 C-14 24 -22 40 -34 56 L-18 52 L-10 66 C-6 44 0 24 2 8Z" fill="${fill}" ${st(3.5)}/>
   <path d="M2 4 C14 24 24 38 36 52 L20 50 L12 64 C8 44 2 26 -2 8Z" fill="${fill}" ${st(3.5)}/>
   <path d="M0 0 C-24 -30 -58 -26 -54 -2 C-52 22 -22 20 0 0Z" fill="${fill}" ${st(3.5)}/>
   <path d="M0 0 C24 -30 58 -26 54 -2 C52 22 22 20 0 0Z" fill="${fill}" ${st(3.5)}/>
   <path d="M-12 -4 C-26 -16 -40 -14 -42 -4" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="3" stroke-linecap="round"/>
   <path d="M12 -4 C26 -16 40 -14 42 -4" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="3" stroke-linecap="round"/>
   <ellipse cx="0" cy="2" rx="10" ry="11" fill="${fill}" ${st(3.5)}/></g>`;
}

/* ---------- крыши с шапкой из снега ---------- */
function snowCap(A,B,Cc,frac=.62,bumps=5){
  const p1=[lerp(A[0],B[0],frac),lerp(A[1],B[1],frac)], p2=[lerp(Cc[0],B[0],frac),lerp(Cc[1],B[1],frac)];
  let d=`M${f1(p1[0])} ${f1(p1[1])} L${B[0]} ${B[1]} L${f1(p2[0])} ${f1(p2[1])}`;
  // фестоны от p2 к p1
  for(let i=1;i<=bumps;i++){
    const x=lerp(p2[0],p1[0],i/bumps), y=lerp(p2[1],p1[1],i/bumps);
    const px=lerp(p2[0],p1[0],(i-.5)/bumps), py=lerp(p2[1],p1[1],(i-.5)/bumps);
    d+=` Q${f1(px)} ${f1(py+16)} ${f1(x)} ${f1(y)}`;
  }
  return `<path d="${d}Z" fill="#fffafd" ${st(3.5)}/><path d="M${f1(lerp(p1[0],B[0],.25))} ${f1(lerp(p1[1],B[1],.25)+10)} L${f1(lerp(p1[0],B[0],.6))} ${f1(lerp(p1[1],B[1],.6)+10)}" stroke="#d9c4ea" stroke-width="3" stroke-linecap="round" fill="none"/>`;
}

const WIN = [];   // окна, для мерцающего свечения
function win(x,y,w,h,far){
  WIN.push([x+w/2,y+h/2,Math.max(w,h)*(far?1.2:1.7)]);
  return `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${w*.18}" fill="url(#winGrad)" ${st(far?2.5:3.5)}/>
   <path d="M${x+w/2} ${y} V${y+h} M${x} ${y+h*.5} H${x+w}" stroke="${OUT}" stroke-width="${far?2:3}" opacity=".85"/>
   <rect x="${x-3}" y="${y+h-1}" width="${w+6}" height="${far?5:7}" rx="3" fill="#fffafd" ${st(far?2.2:3)}/></g>`;
}
function house(x,base,w,h,rh,wall,roof,o={}){
  const far=!!o.far, ov=14, top=base-h, ap=[x+w/2+(o.skew||0),top-rh];
  let s=`<g>`;
  if(o.chimney!==false){const cx=x+w*(o.chx||.74);
    s+=`<rect x="${cx-11}" y="${top-rh*.78}" width="22" height="${rh*.6}" fill="${o.chimCol||'#b8607a'}" ${st(3.5)}/><rect x="${cx-16}" y="${top-rh*.78-9}" width="32" height="14" rx="6" fill="#fffafd" ${st(3.2)}/>`;}
  s+=`<rect x="${x}" y="${top}" width="${w}" height="${h}" fill="${wall}" ${st(far?3:4)}/>`;
  // доски/кирпичик
  for(let i=1;i<4;i++) s+=`<path d="M${x+4} ${top+h*i/4} H${x+w-4}" stroke="#000" stroke-opacity=".07" stroke-width="3"/>`;
  s+=`<path d="M${x-ov} ${top+2} L${ap[0]} ${ap[1]} L${x+w+ov} ${top+2}Z" fill="${roof}" ${st(far?3.5:4.5)}/>`;
  s+=`<path d="M${x-ov+10} ${top-2} L${ap[0]} ${ap[1]+10} L${x+w+ov-10} ${top-2}" fill="none" stroke="#fff" stroke-opacity=".12" stroke-width="3"/>`;
  s+=snowCap([x-ov,top+2],ap,[x+w+ov,top+2],.7,Math.max(4,Math.round(w/34)));
  const ww=far?20:30, wh=far?26:38;
  const cols=o.cols||2, rows=o.rows||1;
  const gx=(w-cols*ww)/(cols+1);
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
    if(o.door&&r===rows-1&&c===o.door[0]) continue;
    s+=win(f1(x+gx*(c+1)+ww*c),f1(top+14+r*(wh+18)),ww,wh,far);
  }
  if(o.door){const dx=x+gx*(o.door[0]+1)+ww*o.door[0];
    s+=`<path d="M${dx} ${base} V${base-wh*1.1} Q${dx+ww/2} ${base-wh*1.1-ww*.6} ${dx+ww} ${base-wh*1.1} V${base}Z" fill="#8a5a6a" ${st(3.5)}/><circle cx="${dx+ww*.78}" cy="${base-wh*.5}" r="2.4" fill="#ffd36b"/>`;}
  if(o.round){ s+=`<circle cx="${ap[0]}" cy="${top-rh*.38}" r="${far?7:11}" fill="url(#winGrad)" ${st(3)}/>`; WIN.push([ap[0],top-rh*.38,20]);}
  s+=`</g>`;return s;
}
function pine(x,base,h,w,far){
  const k=far?.9:1;
  let s=`<g><rect x="${x-7*k}" y="${base-h*.18}" width="${14*k}" height="${h*.18}" fill="#7a5a50" ${st(3)}/>`;
  const tiers=[[.92,.46,.3],[.66,.34,.52],[.42,.2,.78]];
  const col=far?'#6c7da0':'#5f7f8e';
  tiers.forEach(([wy,ww,t],i)=>{
    const yb=base-h*.14-h*(i*.27), ytop=yb-h*.36;
    s+=`<path d="M${x-w*(1-i*.22)/2} ${yb} L${x} ${ytop} L${x+w*(1-i*.22)/2} ${yb} Q${x} ${yb+10} ${x-w*(1-i*.22)/2} ${yb}Z" fill="${col}" ${st(3.5)}/>`;
    s+=`<path d="M${x-w*(1-i*.22)/4} ${lerp(yb,ytop,.5)} L${x} ${ytop} L${x+w*(1-i*.22)/4} ${lerp(yb,ytop,.5)} Q${x+w*.04} ${lerp(yb,ytop,.5)+12} ${x} ${lerp(yb,ytop,.5)+6} Q${x-w*.04} ${lerp(yb,ytop,.5)+14} ${x-w*(1-i*.22)/4} ${lerp(yb,ytop,.5)}Z" fill="#fffafd" ${st(3)}/>`;
  });
  return s+`</g>`;
}
function church(x,base,sc=1){
  let s=`<g transform="translate(${x} ${base}) scale(${sc})">
   <rect x="-46" y="-130" width="92" height="130" fill="#9d8fc4" ${st(4)}/>
   <path d="M-52 -128 L0 -172 L52 -128Z" fill="#6f5f94" ${st(4)}/>
   <rect x="-20" y="-250" width="40" height="124" fill="#a99bd0" ${st(4)}/>
   <path d="M-26 -246 L0 -330 L26 -246Z" fill="#6f5f94" ${st(4)}/>
   <path d="M0 -330 V-362 M-9 -350 H9" stroke="${OUT}" stroke-width="5" stroke-linecap="round"/>
   <path d="M-8 -285 Q0 -296 8 -285 V-262 H-8Z" fill="url(#winGrad)" ${st(3)}/>
   <path d="M-12 0 V-48 Q0 -72 12 -48 V0Z" fill="#7a5a74" ${st(3.5)}/>
   <path d="M-32 -92 V-60 Q-26 -74 -20 -60 V-92Z" fill="url(#winGrad)" ${st(3)}/>
   <path d="M20 -92 V-60 Q26 -74 32 -60 V-92Z" fill="url(#winGrad)" ${st(3)}/>
   </g>`;
  WIN.push([x-26*sc,base-76*sc,26],[x+26*sc,base-76*sc,26],[x,base-274*sc,22]);
  return s;
}

/* ---------- кусты ---------- */
function bush(x,y,sc=1,flip=1,variant=0){
  let s=`<g transform="translate(${x} ${y}) scale(${flip*sc} ${sc})">`;
  const leaves=[],n=26;
  const rr=mulberry32(40+variant*13);
  // ветки
  for(let i=0;i<9;i++){const a=-120+i*18+rr()*10;
    const len=120+rr()*90, ex=Math.cos(a*Math.PI/180)*len, ey=Math.sin(a*Math.PI/180)*len;
    s+=`<path d="M0 0 Q${f1(ex*.4+rr()*20)} ${f1(ey*.5)} ${f1(ex)} ${f1(ey)}" stroke="${OUT}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
    for(let k=0;k<5;k++){const t=.25+k*.17, lx=ex*t, ly=ey*t, ang=a+(k%2?55:-55);
      leaves.push([lx,ly,ang,rr()]);}
    leaves.push([ex,ey,a,rr()]);
  }
  leaves.forEach(([lx,ly,ang,rv])=>{
    const col=rv<.55?'#7b9a8d':rv<.8?'#a889b4':'#6c8c88';
    s+=`<g transform="translate(${f1(lx)} ${f1(ly)}) rotate(${f1(ang+90)})"><path d="M0 0 C-16 -14 -14 -38 0 -52 C14 -38 16 -14 0 0Z" fill="${col}" ${st(3.2)}/><path d="M0 -4 V-38" stroke="#fff" stroke-opacity=".35" stroke-width="2.5"/></g>`;
  });
  // снег на ветках
  for(let i=0;i<9;i++){const sx=rnd(-110,110), sy=rnd(-200,-30)*(1-Math.abs(sx)/280);
    s+=`<ellipse cx="${f1(sx)}" cy="${f1(sy)}" rx="${f1(rnd(9,17))}" ry="${f1(rnd(5,8))}" fill="#fffafd" ${st(2.8)}/>`;}
  for(let i=0;i<9;i++){const sx=rnd(-100,100), sy=rnd(-190,-30);
    s+=`<circle cx="${f1(sx)}" cy="${f1(sy)}" r="${f1(rnd(4,6.5))}" fill="#f2679a" ${st(2.4)}/>`;}
  s+=`<path d="M-70 8 Q-40 -14 0 -8 Q40 -16 70 8Z" fill="#fffafd" ${st(3.5)}/></g>`;
  return s;
}

/* ============================================================
   ФОН: небо, луна, звёзды, холмы, домики, гирлянды, земля
   ============================================================ */
function buildBackground(){
  let s='';
  s+=`<rect width="${W}" height="${H}" fill="url(#sky)"/>`;
  // облачка-полосы
  [[300,430,420,26],[1500,400,360,22],[900,470,520,24],[1250,330,300,16],[160,300,260,14]].forEach(([x,y,rx,ry])=>{
    s+=`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#ffc6e2" opacity=".23"/>`;});
  // звёзды (статичные)
  for(let i=0;i<110;i++){const x=rnd(10,W-10), y=rnd(8,500)*rnd(.55,1);
    s+=`<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(rnd(1,2.6))}" fill="#fff6dc" opacity="${f1(rnd(.4,.95))}"/>`;}
  return s;
}
function buildHills(){
  return `<path d="M0 560 C140 500 300 540 460 520 S760 500 960 535 S1400 500 1600 530 S1840 520 1920 540 V700 H0Z" fill="#a98ac8" ${st(3.5,'#6b5390')}/>
  <path d="M0 560 C140 500 300 540 460 520 S760 500 960 535 S1400 500 1600 530 S1840 520 1920 540" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="9" stroke-linecap="round" transform="translate(0 -3)"/>
  <path d="M0 600 C220 560 420 590 640 575 S1100 560 1300 585 S1700 565 1920 590 V700 H0Z" fill="#c7a6d6" ${st(3.5,'#6b5390')}/>
  <path d="M0 600 C220 560 420 590 640 575 S1100 560 1300 585 S1700 565 1920 590" fill="none" stroke="#fffafd" stroke-width="10" stroke-linecap="round" transform="translate(0 -4)"/>`;
}
function buildTown(){
  let s='';
  // дальний ряд
  const farW=['#9a8cc0','#ad94c6','#b99ac2','#8f90c4'], farR=['#7a6aa2','#8a6a96','#6a73a0'];
  [[110,100,72,52],[250,86,66,48],[395,110,76,56],[540,90,70,50],[1120,96,70,52],[1250,110,78,58],[1395,88,66,48],[1560,100,72,52],[1680,92,70,50],[1800,110,76,56]].forEach(([x,w,h,rh],i)=>{
    s+=house(x,590,w,h,rh,farW[i%4],farR[i%3],{far:true,cols:2,rows:1,chimney:i%2===0,chx:.3+(i%3)*.2});});
  s+=church(700,598,.9);
  s+=pine(1010,600,100,60,true)+pine(820,602,120,70,true)+pine(1080,602,90,56,true);
  // ближний ряд
  s+=house(-14,664,170,138,92,'#dca8bc','#8a5a80',{cols:2,rows:1,door:[0],round:true});
  s+=house(190,664,196,152,100,'#ecc0a6','#5f6f9c',{cols:2,rows:2,door:[1],chx:.25});
  s+=house(420,664,150,118,80,'#b6a3da','#b8607a',{cols:2,rows:1,round:true,chx:.7});
  s+=pine(610,664,190,96)+pine(1262,668,214,108);
  s+=house(1318,664,170,130,88,'#e9b8bf','#6a7aa6',{cols:2,rows:1,door:[1],chx:.3});
  s+=house(1540,664,188,150,96,'#d3b0dc','#8d5a7a',{cols:2,rows:2,door:[0],round:true});
  s+=house(1760,664,170,126,86,'#ecc4a4','#7a6aa6',{cols:2,rows:1,chx:.65});
  return s;
}
/* гирлянды */
const BULBS=[];
function swag(p0,p1,sag){
  const cx=(p0[0]+p1[0])/2, cy=(p0[1]+p1[1])/2+sag*2;
  const pt=t=>[ (1-t)*(1-t)*p0[0]+2*(1-t)*t*cx+t*t*p1[0], (1-t)*(1-t)*p0[1]+2*(1-t)*t*cy+t*t*p1[1] ];
  let len=0,prev=pt(0);for(let i=1;i<=40;i++){const p=pt(i/40);len+=Math.hypot(p[0]-prev[0],p[1]-prev[1]);prev=p;}
  const n=Math.round(len/42);
  let s=`<path d="M${p0[0]} ${p0[1]} Q${cx} ${cy} ${p1[0]} ${p1[1]}" fill="none" stroke="${OUT}" stroke-width="3.2"/>`;
  for(let i=1;i<n;i++){const [x,y]=pt(i/n); const col=i%5===2?'#ffa6c9':i%5===4?'#ffe27a':'#ffd36b';
    s+=`<path d="M${f1(x)} ${f1(y)} v7" stroke="${OUT}" stroke-width="2.4"/><ellipse cx="${f1(x)}" cy="${f1(y+14)}" rx="6.2" ry="8.4" fill="${col}" ${st(2.6)}/>`;
    BULBS.push([x,y+14,col,i]);}
  return s;
}
function buildLights(){
  let s='';
  const pts=[[168,168],[600,236],[1010,196],[1410,246],[1800,196],[1950,160]];
  const sags=[56,52,56,50,36];
  for(let i=0;i<pts.length-1;i++) s+=swag(pts[i],pts[i+1],sags[i]);
  // нижняя гирлянда справа
  s+=swag([1280,372],[1600,330],40);
  s+=swag([-10,330],[110,300],18);
  return s;
}
function buildGround(){
  let s=`<path d="M0 652 C260 624 520 664 820 640 S1380 622 1640 646 S1850 640 1920 650 V1080 H0Z" fill="url(#ground)" ${st(4,'#8d6aa6')}/>`;
  // сугробные тени
  s+=`<path d="M0 760 C300 730 600 790 960 770 S1600 740 1920 780" fill="none" stroke="#c7a7d9" stroke-opacity=".6" stroke-width="10" stroke-linecap="round"/>`;
  s+=`<path d="M0 930 C300 900 640 960 1000 940 S1620 920 1920 950" fill="none" stroke="#fffafd" stroke-opacity=".75" stroke-width="9" stroke-linecap="round"/>`;
  s+=`<path d="M0 850 C200 830 520 880 840 860" fill="none" stroke="#fffafd" stroke-opacity=".6" stroke-width="7" stroke-linecap="round"/>`;
  s+=`<path d="M1100 840 C1400 820 1700 880 1920 850" fill="none" stroke="#c7a7d9" stroke-opacity=".55" stroke-width="8" stroke-linecap="round"/>`;
  // «чёрточки» снега
  for(let i=0;i<70;i++){const x=rnd(10,W-10),y=rnd(690,1070),w=rnd(14,40);
    s+=`<path d="M${f1(x)} ${f1(y)} q${f1(w/2)} -6 ${f1(w)} 0" fill="none" stroke="${R()<.5?'#b99bd0':'#ffffff'}" stroke-opacity=".7" stroke-width="3.4" stroke-linecap="round"/>`;}
  // следы лапок
  const paw=(x,y,r)=>`<g transform="translate(${x} ${y}) rotate(${r})" fill="#cdaedd" opacity=".85"><ellipse cx="0" cy="3" rx="7" ry="6"/><circle cx="-8" cy="-6" r="3.2"/><circle cx="-2.6" cy="-10" r="3.2"/><circle cx="3.6" cy="-10" r="3.2"/><circle cx="9" cy="-5" r="3.2"/></g>`;
  [[560,1030,-20],[596,1008,-8],[640,1032,-14],[1250,1010,12],[1290,1034,8],[1340,1012,16],[170,960,4],[210,975,-4]].forEach(a=>s+=paw(...a));
  return s;
}

/* ============================================================
   РЕКВИЗИТ: фонарь, мольберт, стремянка, полароид
   ============================================================ */
const WOOD='#d29a63', WOOD2='#b97a4e', WOOD3='#e8b685';
const woodRect=(x,y,w,h,rx=5,f=WOOD,sw=4)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${f}" ${st(sw)}/>`;
function limb(x1,y1,x2,y2,w,f=WOOD){ // деревянная «палка» с обводкой
  const dx=x2-x1,dy=y2-y1,L=Math.hypot(dx,dy),nx=-dy/L*w/2,ny=dx/L*w/2;
  return `<path d="M${f1(x1+nx)} ${f1(y1+ny)} L${f1(x2+nx)} ${f1(y2+ny)} L${f1(x2-nx)} ${f1(y2-ny)} L${f1(x1-nx)} ${f1(y1-ny)}Z" fill="${f}" ${st(4)}/>
  <path d="M${f1(x1+nx*.4)} ${f1(y1+ny*.4)} L${f1(x2+nx*.4)} ${f1(y2+ny*.4)}" stroke="#fff" stroke-opacity=".28" stroke-width="3" stroke-linecap="round"/>`;
}
function buildLamp(){
  return `<g>
  <path d="M48 704 V196 Q48 146 100 140 Q132 138 150 150" fill="none" stroke="${OUT}" stroke-width="20" stroke-linecap="round"/>
  <path d="M48 704 V196 Q48 146 100 140 Q132 138 150 150" fill="none" stroke="#3f5a70" stroke-width="12" stroke-linecap="round"/>
  <path d="M42 380 V196" stroke="#fff" stroke-opacity=".25" stroke-width="3"/>
  <path d="M30 704 Q48 688 66 704 L74 730 H22Z" fill="#3f5a70" ${st(4)}/>
  <path d="M50 214 q-34 4 -36 -22 q22 -4 36 22Z" fill="#5f7f8e" ${st(3.5)}/>
  <circle cx="46" cy="208" r="6" fill="#3f5a70" ${st(3)}/>
  <path d="M160 152 V168" stroke="${OUT}" stroke-width="5"/>
  <path d="M138 172 L182 172 L190 156 L130 156Z" fill="#3f5a70" ${st(4)}/>
  <path d="M143 172 H177 L183 236 H137Z" fill="url(#lampGlass)" ${st(4)}/>
  <path d="M160 172 V236 M143 204 H177" stroke="${OUT}" stroke-width="3"/>
  <path d="M133 236 H187 L180 250 H140Z" fill="#3f5a70" ${st(4)}/>
  <path d="M126 158 Q160 130 194 158 Q160 150 126 158Z" fill="#fffafd" ${st(3.5)}/>
  <path d="M134 156 Q160 136 186 156" fill="#fffafd" ${st(3.5)}/>
  ${bow(64,236,.55,'#f48fb1',-12)}
  </g>`;
}
/* мольберт слева. Холст: x 112..284, y 336..540 */
const EASEL={cx:198,top:318,cvX:112,cvY:338,cvW:172,cvH:204};
function buildEasel(){
  const e=EASEL;
  let s=`<g>`;
  // задняя нога
  s+=limb(e.cx+4,e.top+60,e.cx+34,672,14,WOOD2);
  // передние ножки
  s+=limb(e.cx-62,e.top+18,e.cx-118,674,18)+limb(e.cx+62,e.top+18,e.cx+112,674,18);
  // перекладина
  s+=woodRect(e.cx-100,e.top+288,200,16,6,WOOD3);
  // холст
  s+=`<g transform="rotate(-1.5 ${e.cx} ${e.cvY+e.cvH/2})">
   <rect x="${e.cvX-8}" y="${e.cvY-8}" width="${e.cvW+16}" height="${e.cvH+16}" rx="8" fill="${WOOD3}" ${st(4.5)}/>
   <rect x="${e.cvX}" y="${e.cvY}" width="${e.cvW}" height="${e.cvH}" rx="3" fill="#fffaf0" ${st(3.5)}/>
   <path d="M${e.cvX+8} ${e.cvY+8} h30 M${e.cvX+8} ${e.cvY+8} v26" stroke="#f4dccb" stroke-width="3" stroke-linecap="round" fill="none"/>
   <path d="M${e.cvX+e.cvW-8} ${e.cvY+e.cvH-8} h-30 M${e.cvX+e.cvW-8} ${e.cvY+e.cvH-8} v-26" stroke="#f4dccb" stroke-width="3" stroke-linecap="round" fill="none"/>
   <path d="M${e.cvX+6} ${e.cvY+e.cvH-6} L${e.cvX+e.cvW-6} ${e.cvY+e.cvH-6}" stroke="#ead8c8" stroke-width="2.5"/>
  </g>`;
  // верхний зажим
  s+=woodRect(e.cx-84,e.top+4,168,18,7,WOOD3);
  s+=`<path d="M${e.cx-14} ${e.top+4} V${e.top-8} Q${e.cx} ${e.top-16} ${e.cx+14} ${e.top-8} V${e.top+4}Z" fill="${WOOD}" ${st(4)}/>`;
  // лоток с карандашами/кистью
  s+=`<path d="M${e.cx-104} ${e.top+256} H${e.cx+104} L${e.cx+96} ${e.top+276} H${e.cx-96}Z" fill="${WOOD}" ${st(4)}/>`;
  s+=`<path d="M${e.cx+40} ${e.top+248} l24 -6" stroke="${OUT}" stroke-width="7" stroke-linecap="round"/><path d="M${e.cx+40} ${e.top+248} l24 -6" stroke="#ff9ec4" stroke-width="3.5" stroke-linecap="round"/>`;
  s+=bow(e.cx,e.top-12,.62,'#f48fb1',0);
  return s+`</g>`;
}
/* стремянка справа от стола */
const LAD={cx:1478,top:402,base:728,wTop:92,wBot:176};
function buildLadder(){
  const L=LAD; const xl=(y)=>lerp(L.wTop,L.wBot,(y-L.top)/(L.base-L.top))/2;
  let s=`<g>`;
  // задние стойки
  s+=limb(L.cx-xl(L.top)+10,L.top+10,L.cx-xl(L.base)+30,L.base-8,12,WOOD2)+limb(L.cx+xl(L.top)-10,L.top+10,L.cx+xl(L.base)-30,L.base-8,12,WOOD2);
  // ступени
  for(let i=1;i<=5;i++){const y=L.top+i*(L.base-L.top)/6.2+8,hw=xl(y);
    s+=woodRect(L.cx-hw,y,hw*2,16,5,WOOD3);}
  // передние стойки
  s+=limb(L.cx-xl(L.top),L.top,L.cx-xl(L.base),L.base,16)+limb(L.cx+xl(L.top),L.top,L.cx+xl(L.base),L.base,16);
  // площадка
  s+=`<path d="M${L.cx-xl(L.top)-14} ${L.top} H${L.cx+xl(L.top)+14} L${L.cx+xl(L.top)+8} ${L.top+16} H${L.cx-xl(L.top)-8}Z" fill="${WOOD}" ${st(4)}/>`;
  // жестяное ведёрко с краской на площадке нет (место для котика) — только снег на площадке
  s+=`<path d="M${L.cx-xl(L.top)-12} ${L.top} q20 -14 40 -3 q22 -10 44 -2 q22 -8 40 3 H${L.cx-xl(L.top)-12}Z" fill="#fffafd" ${st(3)} transform="translate(${xl(L.top)*0.4} 0)"/>`;
  // подвесной фонарик
  s+=`<g transform="translate(${L.cx+xl(L.top)+30} ${L.top+16})"><path d="M0 0 V36" stroke="${OUT}" stroke-width="4"/><rect x="-11" y="36" width="22" height="28" rx="5" fill="url(#lampGlass)" ${st(3.5)}/><path d="M-8 36 h16 l-3 -9 h-10z" fill="#3f5a70" ${st(3)}/></g>`;
  return s+`</g>`;
}
/* полароид справа */
const POL={x:1636,y:196,w:250,h:340,rot:3,phX:1654,phY:214,phW:214,phH:214};
function buildPolaroid(){
  const p=POL, cx=p.x+p.w/2, cy=p.y+p.h/2;
  let s=`<g>`;
  // подставка-тренога
  s+=limb(cx-50,p.y+p.h-30,cx-86,688,14,WOOD2)+limb(cx+50,p.y+p.h-30,cx+86,688,14,WOOD2)+limb(cx,p.y+p.h-20,cx+4,672,12,WOOD2);
  s+=`<g transform="rotate(${p.rot} ${cx} ${cy})">`;
  s+=`<rect x="${p.x+8}" y="${p.y+10}" width="${p.w}" height="${p.h}" rx="10" fill="#4a3042" opacity=".25"/>`;
  s+=`<rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" rx="8" fill="#fffaf2" ${st(4.5)}/>`;
  s+=`<rect x="${p.phX}" y="${p.phY}" width="${p.phW}" height="${p.phH}" rx="3" fill="#caa8d8" ${st(3.5)}/>`;
  s+=`<g id="photoSlot" clip-path="url(#photoClip)">`+buildPhotoPlaceholder()+`<image id="photoImg" x="${p.phX}" y="${p.phY}" width="${p.phW}" height="${p.phH}" preserveAspectRatio="xMidYMid slice" opacity="0"/></g>`;
  s+=`<rect x="${p.phX}" y="${p.phY}" width="${p.phW}" height="${p.phH}" rx="3" fill="none" ${st(3.5)}/>`;
  const cap=(C.polaroidCaption||'Загадай желание!').split(' ');
  s+=`<text x="${cx}" y="${p.phY+p.phH+44}" text-anchor="middle" font-family="'Marck Script','Caveat',cursive" font-size="34" fill="${OUT}">${cap[0]||''}</text>`;
  s+=`<text x="${cx-6}" y="${p.phY+p.phH+80}" text-anchor="middle" font-family="'Marck Script','Caveat',cursive" font-size="34" fill="${OUT}">${cap.slice(1).join(' ')}</text>`;
  s+=heart(p.x+p.w-34,p.y+p.h-26,1.15,'#f06292',2.6);
  // скотч
  s+=`<g transform="translate(${cx} ${p.y-6}) rotate(-4)"><rect x="-50" y="-17" width="100" height="34" fill="#ffc9dc" opacity=".92" ${st(3)}/><path d="M-50 -12 h100 M-50 -4 h100 M-50 4 h100 M-50 12 h100" stroke="#fff" stroke-opacity=".5" stroke-width="2"/></g>`;
  s+=`</g></g>`;
  return s;
}
function buildPhotoPlaceholder(){
  const p=POL,x=p.phX,y=p.phY,w=p.phW,h=p.phH;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#phSky)"/>
  <circle cx="${x+w*.78}" cy="${y+h*.2}" r="14" fill="#fff3c0"/><circle cx="${x+w*.84}" cy="${y+h*.17}" r="12" fill="#c28fd0"/>
  ${[[.1,.12],[.3,.08],[.5,.16],[.62,.06],[.2,.26],[.9,.34]].map(([a,b])=>star4(x+w*a,y+h*b,5,'#fff6c8')).join('')}
  <path d="M${x} ${y+h*.66} Q${x+w*.3} ${y+h*.58} ${x+w*.55} ${y+h*.66} T${x+w} ${y+h*.62} V${y+h} H${x}Z" fill="#e8d0ee"/>
  <g transform="translate(${x+w*.52} ${y+h*.7})">
   <rect x="-18" y="-60" width="36" height="60" fill="#9d8fc4" ${st(3)}/><path d="M-22 -58 L0 -78 L22 -58Z" fill="#6f5f94" ${st(3)}/>
   <rect x="-9" y="-130" width="18" height="74" fill="#a99bd0" ${st(3)}/><path d="M-13 -128 L0 -176 L13 -128Z" fill="#6f5f94" ${st(3)}/>
   <rect x="-4" y="-48" width="8" height="12" fill="#ffd36b"/><rect x="-4" y="-110" width="8" height="12" fill="#ffd36b"/></g>
  <g transform="translate(${x+w*.15} ${y+h*.72})"><rect x="0" y="-34" width="46" height="34" fill="#e0a8bc" ${st(3)}/><path d="M-5 -33 L23 -58 L51 -33Z" fill="#8a5a80" ${st(3)}/><rect x="9" y="-24" width="10" height="12" fill="#ffd36b"/><rect x="28" y="-24" width="10" height="12" fill="#ffd36b"/></g>
  <g transform="translate(${x+w*.8} ${y+h*.74})"><rect x="0" y="-30" width="40" height="30" fill="#ecc0a6" ${st(3)}/><path d="M-5 -29 L20 -52 L45 -29Z" fill="#5f6f9c" ${st(3)}/><rect x="14" y="-22" width="10" height="12" fill="#ffd36b"/></g>
  <path d="M${x} ${y+h*.82} Q${x+w*.5} ${y+h*.74} ${x+w} ${y+h*.82} V${y+h} H${x}Z" fill="#fffafd"/>`;
}

/* ============================================================
   ШАРЫ «24», СТОЛ, УГОЩЕНИЯ, СТУЛЬЯ, ДАТА, ЗАГОЛОВОК
   ============================================================ */
const TB={cx:960,cy:650,rx:440,ry:110};
const DIG_2='M40 96 C40 26 168 22 168 92 C168 152 92 190 38 268 L180 268';
const DIG_4='M138 38 L28 196 L192 196 M138 38 L138 282';
function digit(d,tx,ty,rot,id){
  const sw=66;
  return `<g transform="translate(${tx} ${ty}) rotate(${rot} 100 150) scale(.94)">
   <path d="${d}" fill="none" stroke="#000" stroke-opacity=".12" stroke-width="${sw+14}" stroke-linejoin="round" stroke-linecap="round" transform="translate(8 12)"/>
   <path d="${d}" fill="none" stroke="${OUT}" stroke-width="${sw+12}" stroke-linejoin="round" stroke-linecap="round"/>
   <path d="${d}" fill="none" stroke="url(#balloonGrad)" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"/>
   <path d="${d}" fill="none" stroke="#ff9cc2" stroke-opacity=".55" stroke-width="${sw*.5}" stroke-linejoin="round" stroke-linecap="round" transform="translate(5 7)"/>
   <path d="${d}" fill="none" stroke="#ffe3ee" stroke-opacity=".85" stroke-width="${sw*.22}" stroke-linejoin="round" stroke-linecap="round" transform="translate(-13 -14)"/>
   <path d="${d}" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="3" stroke-dasharray="2 11" stroke-linecap="round"/>
  </g>`;
}
function buildBalloons(){
  const rib='M920 470 C890 520 950 540 930 580', rib2='M1096 466 C1126 516 1066 546 1090 590';
  const ribbon=d=>`<path d="${d}" fill="none" stroke="${OUT}" stroke-width="7" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#ffb6d1" stroke-width="3.5" stroke-linecap="round"/>`;
  // каждая цифра — отдельная группа (id bal2 / bal4), чтобы мягко покачиваться
  return `<g id="bal2" filter="url(#wob)">${limb(884,420,904,560,8,'#f7c7da')}${digit(DIG_2,780,164,-5)}${star4(790,190,14,'#fff')}${bow(930,436,.72,'#ffa7c8',-8)}${ribbon(rib)}</g>`+
         `<g id="bal4" filter="url(#wob)">${limb(1038,420,1018,560,8,'#f7c7da')}${digit(DIG_4,988,160,5)}${star4(1170,200,11,'#fff')}${star4(1130,420,9,'#fff6c8')}${bow(1086,430,.72,'#ffa7c8',8)}${ribbon(rib2)}</g>`;
}
function scallopsHem(){
  const N=28,cx=TB.cx,cy=TB.cy+125,rx=448,ry=112;
  let d='';
  for(let i=0;i<N;i++){
    const a0=Math.PI-(i/N)*Math.PI, a1=Math.PI-((i+1)/N)*Math.PI, am=(a0+a1)/2;
    const p1=[cx+rx*Math.cos(a1),cy+ry*Math.sin(a1)], c=[cx+rx*1.05*Math.cos(am),cy+ry*1.3*Math.sin(am)];
    d+=` Q${f1(c[0])} ${f1(c[1])} ${f1(p1[0])} ${f1(p1[1])}`;
  }
  return d;
}
function buildTable(){
  const t=TB, x0=t.cx-t.rx, x1=t.cx+t.rx;
  let s='<g>';
  // тень на снегу
  s+=`<ellipse cx="${t.cx}" cy="${t.cy+240}" rx="${t.rx+30}" ry="52" fill="#8a6aa8" opacity=".28"/>`;
  s+=`<path d="M${x0} ${t.cy} L${t.cx-448} ${t.cy+125}${scallopsHem()} L${x1} ${t.cy} A${t.rx} ${t.ry} 0 0 1 ${x0} ${t.cy}Z" fill="url(#cloth)" ${st(4.5)}/>`;
  // складки скатерти
  for(let i=0;i<17;i++){
    const a=Math.PI-(0.1+i*0.0467*Math.PI*1.2)*1; if(a<0.05)break;
    const ax=t.cx+t.rx*Math.cos(a), ay=t.cy+t.ry*Math.sin(a), bx=t.cx+448*1.0*Math.cos(a), by=t.cy+125+112*Math.sin(a)+6;
    const side=(ax-t.cx)/t.rx;
    const mx=(ax+bx)/2+side*18*(i%2?1:-1), my=(ay+by)/2;
    s+=`<path d="M${f1(ax)} ${f1(ay+4)} Q${f1(mx)} ${f1(my)} ${f1(bx)} ${f1(by)}" fill="none" stroke="#bda3d2" stroke-opacity=".45" stroke-width="${i%3?5:8}" stroke-linecap="round"/>`;
    s+=`<path d="M${f1(ax+7)} ${f1(ay+4)} Q${f1(mx+7)} ${f1(my)} ${f1(bx+7)} ${f1(by-4)}" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="3" stroke-linecap="round"/>`;
  }
  // кружевные точки по подолу
  for(let i=0;i<28;i++){const a=Math.PI-((i+.5)/28)*Math.PI;
    s+=`<circle cx="${f1(t.cx+440*Math.cos(a))}" cy="${f1(t.cy+125+104*Math.sin(a)-4)}" r="3.4" fill="#f6a7c6"/>`;}
  // столешница
  s+=`<ellipse cx="${t.cx}" cy="${t.cy}" rx="${t.rx}" ry="${t.ry}" fill="url(#tabletop)" ${st(4.5)}/>`;
  s+=`<ellipse cx="${t.cx}" cy="${t.cy+2}" rx="${t.rx-18}" ry="${t.ry-11}" fill="none" stroke="#e3cdee" stroke-width="3" stroke-dasharray="3 9" stroke-linecap="round"/>`;
  // лепестки на столе
  [[600,676,20],[1330,676,-30],[690,716,40],[1260,740,10],[1050,742,-20]].forEach(([x,y,r])=>{
    s+=`<ellipse cx="${x}" cy="${y}" rx="9" ry="5" transform="rotate(${r} ${x} ${y})" fill="#f7a8c4" ${st(2)}/>`;});
  return s+'</g>';
}
function wineGlass(x,y,sc=1,flip=1){
  return `<g transform="translate(${x} ${y}) scale(${sc*flip} ${sc})">
   <ellipse cx="0" cy="-2" rx="17" ry="5" fill="#c8b5da" opacity=".7"/>
   <path d="M0 -4 V-34" stroke="${OUT}" stroke-width="7" stroke-linecap="round"/><path d="M0 -4 V-34" stroke="#fff" stroke-opacity=".7" stroke-width="3" stroke-linecap="round"/>
   <path d="M-17 -2 Q0 -12 17 -2 Q0 0 -17 -2Z" fill="#fff" fill-opacity=".7" ${st(3)}/>
   <path d="M-17 -96 C-21 -62 -12 -36 0 -34 C12 -36 21 -62 17 -96Z" fill="#fff" fill-opacity=".45" ${st(3.6)}/>
   <path d="M-18.4 -66 C-19 -50 -10 -36 0 -35 C10 -36 19 -50 18.4 -66 Q0 -72 -18.4 -66Z" fill="#a8203f" opacity=".95"/>
   <path d="M-12 -92 C-14 -70 -11 -56 -8 -46" stroke="#fff" stroke-opacity=".75" stroke-width="3" fill="none" stroke-linecap="round"/></g>`;
}
function bottle(x,y){
  const lab=(C.wine||'Хванчкара');
  return `<g transform="translate(${x} ${y})">
   <ellipse cx="0" cy="2" rx="38" ry="9" fill="#8a6aa8" opacity=".3"/>
   <path d="M-30 0 L-30 -98 Q-30 -122 -13 -132 L-13 -172 L13 -172 L13 -132 Q30 -122 30 -98 L30 0 Q0 8 -30 0Z" fill="#5d1c36" ${st(4)}/>
   <rect x="-14.5" y="-182" width="29" height="34" rx="4" fill="#d6a84a" ${st(3.6)}/><path d="M-14 -166 H14" stroke="${OUT}" stroke-width="2.4"/>
   <rect x="-27" y="-92" width="54" height="58" rx="5" fill="#fff4e0" ${st(3)}/>
   <circle cx="-4" cy="-80" r="4" fill="#7a3c8c"/><circle cx="4" cy="-80" r="4" fill="#7a3c8c"/><circle cx="0" cy="-74" r="4" fill="#7a3c8c"/><path d="M0 -86 q4 -6 9 -5" stroke="#5f8f5a" stroke-width="3" fill="none" stroke-linecap="round"/>
   <text x="0" y="-52" text-anchor="middle" font-family="'Marck Script','Caveat',cursive" font-size="12" fill="${OUT}" textLength="46" lengthAdjust="spacingAndGlyphs">${lab}</text>
   <path d="M-22 -40 H22" stroke="#d9a0a8" stroke-width="2"/>
   <path d="M-21 -100 V-30" stroke="#fff" stroke-opacity=".35" stroke-width="5" stroke-linecap="round"/>
   <path d="M-8 -150 V-134" stroke="#fff" stroke-opacity=".4" stroke-width="3.5" stroke-linecap="round"/></g>`;
}
function plate(x,y,rx=76,ry=18){
  return `<ellipse cx="${x}" cy="${y+4}" rx="${rx}" ry="${ry}" fill="#8a6aa8" opacity=".25"/><ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#fffaf5" ${st(3.6)}/><ellipse cx="${x}" cy="${y-1}" rx="${rx*.68}" ry="${ry*.62}" fill="#f6ecf6" stroke="#d9c5e6" stroke-width="2.4"/>`;
}
function cheese(x,y){
  return `<g transform="translate(${x} ${y})">
   <path d="M-36 4 L26 -20 L36 2Z" fill="#ffe27a" ${st(3.4)}/>
   <path d="M-36 4 L36 2 L36 18 L-36 20Z" fill="#f5bf45" ${st(3.4)}/>
   <ellipse cx="-14" cy="12" rx="5" ry="3.4" fill="#d79b2b"/><ellipse cx="12" cy="11" rx="4" ry="3" fill="#d79b2b"/><ellipse cx="24" cy="12" rx="3" ry="2.4" fill="#d79b2b"/>
   <ellipse cx="2" cy="-4" rx="4" ry="2.5" fill="#d9a22e"/></g>`;
}
function grapes(x,y){
  let s=`<g transform="translate(${x} ${y})">`;
  const rows=[[ -22,-6],[-8,-8],[6,-8],[20,-6],[-15,6],[0,5],[14,6],[-7,17],[7,17],[0,28]];
  rows.forEach(([gx,gy],i)=>s+=`<circle cx="${gx}" cy="${gy-8}" r="11" fill="${i%3?'#8e4aa2':'#7a3c92'}" ${st(3)}/><circle cx="${gx-3.5}" cy="${gy-11.5}" r="3" fill="#fff" opacity=".5"/>`);
  s+=`<path d="M0 -26 q4 -12 10 -14" stroke="${OUT}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M4 -34 C14 -50 30 -46 30 -38 C22 -34 12 -34 4 -34Z" fill="#7fb17a" ${st(3)}/>`;
  return s+'</g>';
}
function croissant(x,y){
  const seg=[[-40,6,16,22,-48],[-22,-4,19,25,-26],[0,-8,22,28,0],[22,-4,19,25,26],[40,6,16,22,48]];
  let s=`<g transform="translate(${x} ${y})">`;
  seg.forEach(([cx,cy,rx,ry,r],i)=>s+=`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${r} ${cx} ${cy})" fill="${i===2?'#eab165':'#e0a15a'}" ${st(3.4)}/>`);
  s+=`<path d="M-6 -26 Q0 -12 -6 2 M14 -24 Q20 -10 14 2 M-26 -20 Q-20 -8 -26 4" stroke="#b9703a" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".7"/><path d="M-12 -22 q8 -6 18 -2" stroke="#fff" stroke-opacity=".5" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  return s+'</g>';
}
function rose(x,y,r,fill){
  return `<g transform="translate(${x} ${y})"><circle r="${r}" fill="${fill}" ${st(3)}/><path d="M0 ${-r*.6} a${r*.55} ${r*.55} 0 1 1 ${-r*.3} ${r*.5} a${r*.3} ${r*.3} 0 1 1 ${r*.36} ${-r*.1}" fill="none" stroke="${OUT}" stroke-width="2.4" stroke-linecap="round" opacity=".8"/></g>`;
}
function flowers(x,y){
  let s=`<g transform="translate(${x} ${y})">`;
  [[-20,-82,-16],[-6,-98,-5],[12,-90,10],[22,-70,26],[-26,-60,-30]].forEach(([ex,ey,a])=>s+=`<path d="M0 -34 Q${ex*.4} ${ey*.6} ${ex} ${ey}" stroke="#5a8a5a" stroke-width="4.5" fill="none" stroke-linecap="round"/>`);
  [[-34,-56,-50],[30,-52,40],[-12,-70,-20],[10,-72,20]].forEach(([lx,ly,a])=>s+=`<path transform="translate(${lx} ${ly}) rotate(${a})" d="M0 0 C-10 -8 -8 -24 0 -30 C8 -24 10 -8 0 0Z" fill="#7fb17a" ${st(3)}/>`);
  s+=rose(-20,-82,15,'#f48fb1')+rose(12,-92,16,'#ffb3cc')+rose(-4,-100,13,'#f06292')+rose(24,-68,13,'#ffc2d6')+rose(-26,-60,12,'#ff8fb4');
  s+=`<circle cx="30" cy="-86" r="4" fill="#fff6c8" ${st(2)}/><circle cx="-34" cy="-80" r="4" fill="#fff6c8" ${st(2)}/>`;
  s+=`<path d="M-22 -34 L-17 0 Q0 8 17 0 L22 -34Z" fill="#ffd9e6" fill-opacity=".85" ${st(3.6)}/><path d="M-14 -28 L-11 -6" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/>${heart(0,-18,.8,'#f06292',3)}`;
  return s+'</g>';
}
function candelabraStatic(x,y){
  return `<g transform="translate(${x} ${y})">
   <ellipse cx="0" cy="4" rx="40" ry="10" fill="#8a6aa8" opacity=".3"/>
   <path d="M-34 0 Q-30 -14 -10 -16 H10 Q30 -14 34 0 Q0 8 -34 0Z" fill="#e8b64a" ${st(3.8)}/>
   <path d="M-5 -16 Q-9 -38 -5 -52 H5 Q9 -38 5 -16Z" fill="#e8b64a" ${st(3.8)}/>
   <path d="M0 -52 C-34 -50 -44 -66 -42 -78 M0 -52 C34 -50 44 -66 42 -78" fill="none" stroke="${OUT}" stroke-width="10" stroke-linecap="round"/>
   <path d="M0 -52 C-34 -50 -44 -66 -42 -78 M0 -52 C34 -50 44 -66 42 -78" fill="none" stroke="#f1c85a" stroke-width="5" stroke-linecap="round"/>
   <path d="M-54 -78 H-30 L-34 -70 H-50Z M30 -78 H54 L50 -70 H34Z M-12 -64 H12 L8 -56 H-8Z" fill="#e8b64a" ${st(3.2)}/>
   <path d="M-3 -50 V-20" stroke="#fff" stroke-opacity=".6" stroke-width="2.6"/></g>`;
}
function buildTableItems(){
  let s='<g>';
  s+=`<g transform="translate(690 664) scale(1.12) translate(-690 -664)">${bottle(690,664)}</g>`+wineGlass(752,674,1.0)+wineGlass(788,688,1.0);
  s+=`<g transform="translate(1156 652) scale(1.1) translate(-1156 -652)">${flowers(1156,652)}</g>`+candelabraStatic(1250,664);
  // торт
  const x=960,y=662;
  s+=`<g transform="translate(${x} ${y}) scale(1.12)">
    ${plate(0,0,138,30)}
    <path d="M-118 -42 V-6 A118 26 0 0 0 118 -6 V-42Z" fill="#fff6f4" ${st(4)}/>
    <path d="M-118 -22 V-6 A118 26 0 0 0 118 -6 V-22 A118 26 0 0 1 -118 -22Z" fill="#ffc2d6" ${st(3.4)}/>
    <ellipse cx="0" cy="-42" rx="118" ry="26" fill="#fffafa" ${st(4)}/>
    <path d="M-82 -92 V-50 A82 20 0 0 0 82 -50 V-92Z" fill="#fff6f4" ${st(4)}/>
    <path d="M-82 -70 V-50 A82 20 0 0 0 82 -50 V-70 A82 20 0 0 1 -82 -70Z" fill="#ffd0df" ${st(3.4)}/>
    <ellipse cx="0" cy="-92" rx="82" ry="20" fill="#fffafa" ${st(4)}/>
    ${Array.from({length:14},(_,i)=>{const a=Math.PI*(.04+i*.071);const px=Math.cos(a)*-84, py=-92+Math.sin(a)*18;return `<circle cx="${f1(px)}" cy="${f1(py)}" r="7" fill="#fffafa" ${st(2.6)}/>`}).join('')}
    ${Array.from({length:7},(_,i)=>{const a=Math.PI*(.07+i*.14);const px=Math.cos(a)*-104,py=-42+Math.sin(a)*23;return `<g transform="translate(${f1(px)} ${f1(py)})"><path d="M-9 -8 C-12 6 -4 14 0 14 C4 14 12 6 9 -8 C4 -12 -4 -12 -9 -8Z" fill="#ef3e5d" ${st(3)}/><path d="M-7 -9 q7 -9 14 0 q-7 -3 -14 0Z" fill="#6fa86a" ${st(2.4)}/><circle cx="-3" cy="-1" r="1.2" fill="#ffd0d8"/><circle cx="3" cy="3" r="1.2" fill="#ffd0d8"/><circle cx="2" cy="-3" r="1.2" fill="#ffd0d8"/></g>`}).join('')}
    ${[-34,30].map(px=>`<g transform="translate(${px} -96)"><path d="M-9 -8 C-12 6 -4 14 0 14 C4 14 12 6 9 -8 C4 -12 -4 -12 -9 -8Z" fill="#ef3e5d" ${st(3)}/><path d="M-7 -9 q7 -9 14 0 q-7 -3 -14 0Z" fill="#6fa86a" ${st(2.4)}/></g>`).join('')}
    ${heart(0,-44,1.3,'#ff7aa2',3)}
   </g>`;
  // тарелки спереди
  s+=plate(770,716)+cheese(770,708);
  s+=plate(892,730,70,17)+grapes(892,730);
  s+=plate(1052,730,74,18)+croissant(1052,727);
  // подсвечники малых свечей
  s+=`<ellipse cx="1336" cy="716" rx="30" ry="9" fill="#e8b64a" ${st(3.4)}/><ellipse cx="1262" cy="748" rx="30" ry="9" fill="#e8b64a" ${st(3.4)}/>`;
  return s+'</g>';
}
/* стулья */
function chair(cx,base,label,withHeart,tilt=0){
  const sc=.97;
  let s=`<g transform="translate(${cx} ${base}) scale(${sc}) rotate(${tilt})">
   <ellipse cx="0" cy="6" rx="92" ry="16" fill="#8a6aa8" opacity=".3"/>
   ${limb(-62,-92,-66,-30,13,WOOD2)}${limb(62,-92,66,-30,13,WOOD2)}
   <path d="M-84 -92 Q0 -128 84 -92 Q84 -74 70 -66 Q0 -50 -70 -66 Q-84 -74 -84 -92Z" fill="${WOOD3}" ${st(4)}/>
   <path d="M-70 -66 Q0 -50 70 -66 L66 -52 Q0 -36 -66 -52Z" fill="${WOOD}" ${st(4)}/>
   ${limb(-68,-206,-70,0,15)}${limb(68,-206,70,0,15)}
   <path d="M-82 -208 Q0 -236 82 -208 L82 -188 Q0 -214 -82 -188Z" fill="${WOOD3}" ${st(4)}/>
   ${[-36,0,36].map(x=>`<rect x="${x-8}" y="-196" width="16" height="104" rx="6" fill="${WOOD}" ${st(3.6)}/>`).join('')}
   <path d="M-70 -118 Q0 -104 70 -118 V-102 Q0 -90 -70 -102Z" fill="${WOOD3}" ${st(3.6)}/>
   <!-- бирка -->
   <path d="M-34 -204 L-22 -168 M34 -204 L22 -168" stroke="${OUT}" stroke-width="3.2" fill="none"/>
   <path d="M-52 -168 H52 Q60 -168 60 -160 V-114 Q60 -106 52 -106 H-52 Q-60 -106 -60 -114 V-160 Q-60 -168 -52 -168Z" fill="#fff6e6" ${st(4)}/>
   <path d="M-50 -162 H50 Q54 -162 54 -158 V-116 Q54 -112 50 -112 H-50 Q-54 -112 -54 -116 V-158 Q-54 -162 -50 -162Z" fill="none" stroke="#e8c8a8" stroke-width="2.4" stroke-dasharray="3 5"/>`;
  const fs=withHeart?40:44;
  s+=`<text x="${withHeart?-12:0}" y="-126" text-anchor="middle" font-family="'Marck Script','Caveat',cursive" font-size="${fs}" fill="${OUT}">${label}</text>`;
  if(withHeart) s+=heart(38,-134,1.3,'#e8203f',3);
  return s+'</g>';
}
function buildChairs(){
  const split=t=>{const h=/[❤♥]/.test(t);return [t.replace(/[❤♥️\uFE0F\s]+$/u,'').trim(),h];};
  const L=split((C.chairs&&C.chairs.left)||'Паша'), Rr=split((C.chairs&&C.chairs.right)||'Маша ❤️');
  return `<g>${chair(796,962,L[0],L[1],-1)}${chair(1132,962,Rr[0],Rr[1],1)}</g>`;
}
function buildBowFront(){ return `<g>${bow(960,806,1.15,'#f48fb1',0)}</g>`; }
function buildDate(){
  const d=C.dateLine||'05.11.2002 — 05.11.2026', cx=960, cy=1012;
  return `<g>
   <path d="M${cx-268} ${cy-38} H${cx+268} Q${cx+306} ${cy-38} ${cx+306} ${cy} Q${cx+306} ${cy+38} ${cx+268} ${cy+38} H${cx-268} Q${cx-306} ${cy+38} ${cx-306} ${cy} Q${cx-306} ${cy-38} ${cx-268} ${cy-38}Z" fill="#fff4e4" ${st(4.5)}/>
   <path d="M${cx-266} ${cy-30} H${cx+266} Q${cx+298} ${cy-30} ${cx+298} ${cy} Q${cx+298} ${cy+30} ${cx+266} ${cy+30} H${cx-266} Q${cx-298} ${cy+30} ${cx-298} ${cy} Q${cx-298} ${cy-30} ${cx-266} ${cy-30}Z" fill="none" stroke="#f0a6c0" stroke-width="3" stroke-dasharray="2 9" stroke-linecap="round"/>
   ${heart(cx-262,cy,1.5,'#f06292',3)}${heart(cx+262,cy,1.5,'#f06292',3)}
   <path d="M${cx-330} ${cy+14} q-14 -6 -26 -20 M${cx-322} ${cy+8} q-18 4 -30 14" stroke="#6f9a6a" stroke-width="5" fill="none" stroke-linecap="round"/>
   <path d="M${cx+330} ${cy+14} q14 -6 26 -20 M${cx+322} ${cy+8} q18 4 30 14" stroke="#6f9a6a" stroke-width="5" fill="none" stroke-linecap="round"/>
   <circle cx="${cx-352}" cy="${cy-6}" r="6" fill="#f06292" ${st(2.6)}/><circle cx="${cx+352}" cy="${cy-6}" r="6" fill="#f06292" ${st(2.6)}/>
   <text x="${cx}" y="${cy+14}" text-anchor="middle" font-family="'Marck Script','Caveat',cursive" font-size="44" fill="${OUT}">${d}</text></g>`;
}
function buildTitle(){
  const t=C.title||'С днём рождения, Маша!';
  return `<g id="titleG">
   <ellipse cx="960" cy="104" rx="640" ry="92" fill="url(#titleGlow)"/>
   <text id="titleBack" x="960" y="136" text-anchor="middle" font-family="'Marck Script','Caveat',cursive" font-size="124" fill="#3a2560" stroke="#3a2560" stroke-width="22" stroke-linejoin="round" opacity=".92" transform="translate(0 4)">${t}</text>
   <text id="titleFront" x="960" y="136" text-anchor="middle" font-family="'Marck Script','Caveat',cursive" font-size="124" fill="#fff4d0" stroke="#fff4d0" stroke-width="3.4" stroke-linejoin="round">${t}</text>
   ${star4(300,74,22,'#fff6c8')}${star4(1650,86,18,'#fff6c8')}${star4(1590,170,10,'#ffc9de')}${star4(340,172,10,'#ffc9de')}${heart(1676,142,1.2,'#ff8fb4',2.4)}
  </g>`;
}

/* ============================================================
   DEFS
   ============================================================ */
function buildDefs(){
  return `<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#46377f"/><stop offset=".26" stop-color="#7a60ac"/><stop offset=".46" stop-color="#b58bc4"/><stop offset=".62" stop-color="#e5adcb"/><stop offset=".78" stop-color="#f4d0e3"/></linearGradient>
  <radialGradient id="winGrad" cx=".5" cy=".5" r=".75"><stop offset="0" stop-color="#fff6b8"/><stop offset=".6" stop-color="#ffd36b"/><stop offset="1" stop-color="#ffab4a"/></radialGradient>
  <radialGradient id="winGlow"><stop offset="0" stop-color="#ffd46a" stop-opacity=".55"/><stop offset="1" stop-color="#ffd46a" stop-opacity="0"/></radialGradient>
  <radialGradient id="bulbGlow"><stop offset="0" stop-color="#ffe9a0" stop-opacity=".85"/><stop offset=".4" stop-color="#ffd36b" stop-opacity=".35"/><stop offset="1" stop-color="#ffd36b" stop-opacity="0"/></radialGradient>
  <radialGradient id="flameGlow"><stop offset="0" stop-color="#ffd27a" stop-opacity=".75"/><stop offset=".45" stop-color="#ffb35a" stop-opacity=".25"/><stop offset="1" stop-color="#ffb35a" stop-opacity="0"/></radialGradient>
  <radialGradient id="tableGlow"><stop offset="0" stop-color="#ffd27a" stop-opacity=".55"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>
  <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7e6f2"/><stop offset=".5" stop-color="#ecd2e9"/><stop offset="1" stop-color="#d7b7e0"/></linearGradient>
  <linearGradient id="lampGlass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2a8"/><stop offset="1" stop-color="#ffc25a"/></linearGradient>
  <linearGradient id="cloth" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d9c5e6"/><stop offset=".18" stop-color="#fff6f6"/><stop offset=".55" stop-color="#fffafa"/><stop offset=".85" stop-color="#f3e6f2"/><stop offset="1" stop-color="#d9c5e6"/></linearGradient>
  <radialGradient id="tabletop" cx=".5" cy=".45" r=".6"><stop offset="0" stop-color="#fffdf6"/><stop offset=".7" stop-color="#fff3f4"/><stop offset="1" stop-color="#f0e0f0"/></radialGradient>
  <linearGradient id="balloonGrad" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="200" y2="300"><stop offset="0" stop-color="#ffb3d0"/><stop offset=".5" stop-color="#f68ab4"/><stop offset="1" stop-color="#e46a9e"/></linearGradient>
  <radialGradient id="titleGlow"><stop offset="0" stop-color="#ffd9f0" stop-opacity=".38"/><stop offset="1" stop-color="#ffd9f0" stop-opacity="0"/></radialGradient>
  <linearGradient id="phSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a4690"/><stop offset=".55" stop-color="#c58fc8"/><stop offset="1" stop-color="#f4c4d8"/></linearGradient>
  <radialGradient id="vig" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#2a1550" stop-opacity="0"/><stop offset="1" stop-color="#2a1550" stop-opacity=".42"/></radialGradient>
  <radialGradient id="moonGlow"><stop offset="0" stop-color="#fff3c0" stop-opacity=".6"/><stop offset="1" stop-color="#fff3c0" stop-opacity="0"/></radialGradient>
  <clipPath id="photoClip"><rect x="${POL.phX}" y="${POL.phY}" width="${POL.phW}" height="${POL.phH}" rx="3"/></clipPath>
  <filter id="wob" x="0" y="0" width="${W}" height="${H}" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.016 0.02" numOctaves="2" seed="11" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="5.5" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
  <filter id="grain" x="0" y="0" width="${W}" height="${H}" filterUnits="userSpaceOnUse">
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" result="g"/>
    <feColorMatrix in="g" type="matrix" values="0 0 0 0 .35  0 0 0 0 .22  0 0 0 0 .45  0 0 0 .9 -.2"/>
  </filter>
  </defs>`;
}
function buildMoon(){
  const cx=1748,cy=92,r=50;
  return `<g><circle cx="${cx}" cy="${cy}" r="130" fill="url(#moonGlow)"/>
   <path d="M${cx} ${cy-r} A${r} ${r} 0 1 0 ${cx} ${cy+r} A${r*.7} ${r} 0 1 1 ${cx} ${cy-r}Z" fill="#fff0b8" ${st(4)}/>
   ${star4(cx+62,cy-26,12,'#fff6c8')}${star4(cx+38,cy+52,8,'#ffd1e4')}</g>`;
}
function buildBackBushes(){ return `<g>${bush(34,716,.95,1,1)}${bush(1892,722,.95,-1,2)}</g>`; }
function buildFrontBushes(){ return `<g>${bush(30,1112,1.25,1,0)}${bush(1896,1114,1.3,-1,3)}</g>`; }

/* ============================================================
   СБОРКА
   ============================================================ */
const svg=document.getElementById('svg');
const catsBack='<g id="catsBack"></g>', catsLadder='', catsFront='<g id="catsFront"></g>';
const STARS=[];
for(let i=0;i<34;i++) STARS.push([rnd(30,W-30),rnd(14,470),rnd(5,10),R()*4,R()<.5]);

function build(){
  WIN.length=0; BULBS.length=0;
  const bg=buildBackground()+buildMoon()+buildHills()+buildTown();
  const lights=buildLights();
  const ground=buildGround();
  const props=buildLamp()+buildBackBushes()+buildEasel()+buildLadder()+buildPolaroid();
  const tbl=buildTable()+buildBowFront()+buildTableItems();
  const chairs=buildChairs();
  const date=buildDate();
  const dyn=`
   <g id="twinkle">${STARS.map(([x,y,r,d,b])=>star4(f1(x),f1(y),f1(r),b?'#ffe6f2':'#fff6c8',`class="${b?'tw':'tw2'}" style="animation-delay:-${f1(d)}s"`)).join('')}</g>
   <g id="winGlows">${WIN.map(([x,y,r],i)=>`<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="url(#winGlow)" class="gl" style="animation-delay:-${f1((i*.37)%2.6)}s"/>`).join('')}</g>`;
  const bulbG=`<g id="bulbGlows">${BULBS.map(([x,y,c,i])=>`<circle cx="${f1(x)}" cy="${f1(y)}" r="${c==='#ffa6c9'?24:22}" fill="url(#bulbGlow)" class="${i%2?'tw2':'tw'}" style="animation-delay:-${f1((i*.53)%3.2)}s;opacity:.85"/>`).join('')}</g>`;
  const lanterns=`<circle cx="160" cy="206" r="150" fill="url(#winGlow)" class="gl"/><circle cx="${LAD.cx+LAD.wTop/2+30}" cy="${LAD.top+66}" r="70" fill="url(#winGlow)" class="gl"/>`;
  svg.innerHTML=buildDefs()+
   `<g filter="url(#wob)">${bg}</g>`+dyn+
   `<g filter="url(#wob)">${ground}${lights}</g>`+bulbG+
   `<g filter="url(#wob)">${props}</g>`+
   `<g id="dynProps">${lanterns}<g id="paintG"></g></g>`+
   catsBack+
   buildBalloons()+
   `<g filter="url(#wob)">${tbl}</g>`+
   `<g id="candlesG"></g>`+
   `<g filter="url(#wob)">${chairs}${date}</g>`+
   catsFront+
   `<g filter="url(#wob)">${buildFrontBushes()}${buildTitle()}</g>`+
   `<rect width="${W}" height="${H}" fill="url(#vig)" pointer-events="none"/>`+
   `<rect width="${W}" height="${H}" filter="url(#grain)" opacity=".09" style="mix-blend-mode:multiply" pointer-events="none"/>`;
}

/* ============================================================
   РАНТАЙМ: свечи, холст, снег, фото, API
   ============================================================ */
const OPT={
  burnMs: (+q.get('burn')||120)*1000,   // свеча выгорает за ~2 минуты
  autoRelightMs: q.has('norelight')?null:12000, // пока котика-фонарщика нет — зажигаем сами (null = только вручную через Scene.relight())
};
const CANDLES=[];
[[-48,-90],[-24,-84],[0,-82],[24,-84],[48,-90]].forEach(([lx,ly],i)=>{const x=960+lx*1.12,y=662+ly*1.12;CANDLES.push({kind:'cake',x,y,h:48,w:9.5,fs:.72,col:i%2?'#ffffff':'#ffc2d6',sw:2.4});});
CANDLES.push({kind:'candelabra',x:1250,y:600,h:84,w:15,fs:1,col:'#fff5e0',sw:3.2},{kind:'candelabra',x:1208,y:584,h:66,w:14,fs:.95,col:'#fff5e0',sw:3.2},{kind:'candelabra',x:1292,y:584,h:66,w:14,fs:.95,col:'#fff5e0',sw:3.2});
CANDLES.push({kind:'tea',x:1336,y:712,h:46,w:22,fs:1,col:'#ffe6ee',sw:3.2},{kind:'tea',x:1262,y:744,h:46,w:22,fs:1,col:'#fff5e0',sw:3.2});
let litAt=0, lit=true, extAt=-1e9;
function buildCandles(){
  const g=document.getElementById('candlesG');
  let s=`<ellipse id="tglow" cx="960" cy="640" rx="470" ry="130" fill="url(#tableGlow)"/>`;
  CANDLES.forEach((c,i)=>{
    c.phase=R()*10;
    s+=`<g id="cd${i}">
      <circle id="cg${i}" r="${c.kind==='cake'?46:78}" fill="url(#flameGlow)"/>
      <rect id="cb${i}" x="${c.x-c.w/2}" y="${c.y-c.h}" width="${c.w}" height="${c.h}" rx="${c.w*.3}" fill="${c.col}" stroke="${OUT}" stroke-width="${c.sw}" stroke-linejoin="round"/>
      <path id="cs${i}" d="M${c.x-c.w/2+2} ${c.y-c.h+4} V${c.y-4}" stroke="#fff" stroke-opacity=".7" stroke-width="${c.sw}" stroke-linecap="round"/>
      <path id="cw${i}" d="M${c.x} ${c.y-c.h} v-5" stroke="${OUT}" stroke-width="2.4" stroke-linecap="round"/>
      <g id="cf${i}"><path d="M0 0 C-9 -9 -8 -22 0 -38 C8 -22 9 -9 0 0Z" fill="#ffb347" stroke="${OUT}" stroke-width="${c.kind==='cake'?3.4:2.6}" stroke-linejoin="round"/><path d="M0 -2 C-4.5 -7 -4 -14 0 -22 C4 -14 4.5 -7 0 -2Z" fill="#fff6c0"/></g>
      <path id="cm${i}" d="M0 0 q9 -14 0 -28 q-9 -14 5 -30" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity="0"/>
    </g>`;
  });
  g.innerHTML=s;
  CANDLES.forEach((c,i)=>{c.el={b:$('cb'+i),s:$('cs'+i),w:$('cw'+i),f:$('cf'+i),gl:$('cg'+i),sm:$('cm'+i)};});
}
const $=id=>document.getElementById(id);
function updateCandles(T){
  const p=Math.min(1,(T-litAt)/OPT.burnMs);
  if(lit && (T-litAt)>=OPT.burnMs){ lit=false; extAt=T; }
  if(!lit && OPT.autoRelightMs!=null && T-extAt>OPT.autoRelightMs){ relight(T); }
  let nLit=0;
  CANDLES.forEach(c=>{
    const k=lit? 1-.42*p : 1-.42;
    const h=c.h*k, top=c.y-h;
    c.el.b.setAttribute('y',f1(top)); c.el.b.setAttribute('height',f1(h));
    c.el.s.setAttribute('d',`M${c.x-c.w/2+2} ${f1(top+4)} V${c.y-4}`);
    c.el.w.setAttribute('d',`M${c.x} ${f1(top)} v-5`);
    const ts=T/1000, fl=1+.13*Math.sin(ts*9+c.phase)+.07*Math.sin(ts*17.3+c.phase*2), rot=5*Math.sin(ts*4.1+c.phase)+2*Math.sin(ts*11+c.phase);
    if(lit){nLit++;
      c.el.f.setAttribute('transform',`translate(${c.x} ${f1(top-3)}) rotate(${f1(rot)}) scale(${f1(c.fs*(1+(fl-1)*.6))} ${f1(c.fs*fl)})`);
      c.el.f.style.opacity=Math.min(1,(T-litAt)/400);
      c.el.gl.setAttribute('cx',c.x); c.el.gl.setAttribute('cy',f1(top-18*c.fs));
      c.el.gl.style.opacity=f1(Math.min(1,(T-litAt)/500)*(.82+.18*Math.sin(ts*7+c.phase)));
      c.el.sm.style.opacity=0;
    } else {
      c.el.f.style.opacity=0; c.el.gl.style.opacity=0;
      const e=(T-extAt)/3800;
      if(e<1){c.el.sm.setAttribute('transform',`translate(${c.x+ 2*Math.sin(ts*3+c.phase)} ${f1(top-6-e*22)}) scale(${c.fs>.7?1:.7})`);c.el.sm.style.opacity=f1(.75*(1-e));}
      else c.el.sm.style.opacity=0;
    }
  });
  const tg=$('tglow'); if(tg) tg.style.opacity=f1(lit?(.72+.1*Math.sin(T/1000*5)):0.12);
}
function relight(T){ lit=true; litAt=(T===undefined?curT:T); }
function extinguish(T){ if(lit){lit=false; extAt=(T===undefined?curT:T);} }

/* ---------- холст мольберта: надпись «проявляется» ---------- */
let paint=null;
const meas=document.createElement('canvas').getContext('2d');
function wrapText(text,maxW){
  for(let fs=44;fs>=20;fs-=2){
    meas.font=`${fs}px "Marck Script", cursive`;
    const words=text.split(/\s+/), lines=[]; let cur='';
    let ok=true;
    for(const w of words){
      if(meas.measureText(w).width>maxW){ok=false;break;}
      const t=cur?cur+' '+w:w;
      if(meas.measureText(t).width<=maxW) cur=t; else {lines.push(cur);cur=w;}
    }
    if(!ok) continue;
    lines.push(cur);
    if(lines.length*fs*1.08<=EASEL.cvH-34) return {fs,lines,widths:lines.map(l=>meas.measureText(l).width)};
  }
  return {fs:20,lines:[text],widths:[100]};
}
function paintGreeting(text,ms=6000){
  eraseNow();
  const e=EASEL, cxm=e.cvX+e.cvW/2, cym=e.cvY+e.cvH/2;
  const wr=wrapText(text,e.cvW-30), lh=wr.fs*1.08, y0=cym-(wr.lines.length-1)*lh/2+wr.fs*.3;
  let s=`<g transform="rotate(-1.5 ${e.cx} ${e.cvY+e.cvH/2})">`;
  wr.lines.forEach((l,i)=>{
    s+=`<clipPath id="pcl${i}"><rect id="pcr${i}" x="${e.cvX}" y="${e.cvY}" width="0" height="${e.cvH}"/></clipPath>
        <g clip-path="url(#pcl${i})"><text x="${f1(cxm-wr.widths[i]/2)}" y="${f1(y0+i*lh)}" font-family="'Marck Script','Caveat',cursive" font-size="${wr.fs}" fill="#d83a6b" stroke="#d83a6b" stroke-width=".8" stroke-linejoin="round">${l}</text></g>`;
  });
  $('paintG').innerHTML=s+'</g>';
  paint={t0:null,ms,mode:'paint',wr,lh,y0,cxm,lines:wr.lines.length};
}
function eraseGreeting(ms=3000){ if(paint&&paint.mode==='paint'){paint.mode='erase';paint.t0=null;paint.ms=ms;} }
function eraseNow(){ paint=null; const g=$('paintG'); if(g) g.innerHTML=''; }
function updatePaint(T){
  if(!paint) return;
  if(paint.t0===null) paint.t0=T;
  const e=EASEL, p=Math.max(0,Math.min(1,(T-paint.t0)/paint.ms));
  paint.p=p;
  const N=paint.lines;
  if(paint.mode==='paint'){
    for(let i=0;i<N;i++){const f=Math.max(0,Math.min(1,p*N-i));const r=$('pcr'+i);if(!r)return;
      const x0=paint.cxm-paint.wr.widths[i]/2-4, w=paint.wr.widths[i]+10;
      r.setAttribute('x',f1(x0)); r.setAttribute('width',f1(w*f));}
    // кончик кисти
    const i=Math.min(N-1,Math.floor(p*N-1e-6)), f=Math.max(0,Math.min(1,p*N-i));
    paint.tip=toAbs(paint.cxm-paint.wr.widths[i]/2+paint.wr.widths[i]*f, paint.y0+i*paint.lh-paint.wr.fs*.3);
    paint.done=p>=1;
  } else {
    for(let i=0;i<N;i++){const r=$('pcr'+i);if(!r)return;
      const x0=paint.cxm-paint.wr.widths[i]/2-4, w=paint.wr.widths[i]+10;
      const cut=Math.max(0,Math.min(1,p*1.0))*(w);
      r.setAttribute('x',f1(x0+cut)); r.setAttribute('width',f1(Math.max(0,w-cut)));}
    paint.tip=toAbs(e.cvX+(e.cvW)*p, e.cvY+e.cvH/2);
    if(p>=1){ eraseNow(); }
  }
}
function toAbs(x,y){ // учесть поворот холста -1.5°
  const e=EASEL,cx=e.cx,cy=e.cvY+e.cvH/2,a=-1.5*Math.PI/180,dx=x-cx,dy=y-cy;
  return {x:f1(cx+dx*Math.cos(a)-dy*Math.sin(a)),y:f1(cy+dx*Math.sin(a)+dy*Math.cos(a))};
}

/* ---------- фото в полароиде ---------- */
let photoIdx=-1, photoTimer=0;
function setPhoto(url){
  const img=$('photoImg'); if(!img) return;
  if(!url){ img.style.opacity=0; return; }
  img.style.transition='opacity .6s'; img.style.opacity=0;
  setTimeout(()=>{img.setAttribute('href',url); img.style.opacity=1;},650);
}
function nextPhoto(){
  const list=window.PHOTOS||[]; if(!list.length) return;
  photoIdx=(photoIdx+1)%list.length; setPhoto(list[photoIdx]);
}

/* ---------- снег (canvas) ---------- */
const sc=document.getElementById('snow'), sx=sc.getContext('2d');
const spr=document.createElement('canvas'); spr.width=spr.height=32;
(function(){const g=spr.getContext('2d'),gr=g.createRadialGradient(16,16,0,16,16,16);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.45,'rgba(255,255,255,.85)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,32,32);})();
const FL=[]; for(let i=0;i<190;i++){const z=R();FL.push({x:R()*W,y:R()*H,z,s:2.2+z*z*9,v:22+z*70,amp:10+R()*26,f:.4+R()*.9,ph:R()*6.28,dr:6+z*10,a:.5+z*.45});}
const BURST=[];
function snowBurst(x,y,n=50,dir=1){ for(let i=0;i<n;i++) BURST.push({x,y,vx:(60+R()*260)*dir*(.4+R()),vy:-(60+R()*220),s:3+R()*7,life:1.6+R()*1.8,t:0,ph:R()*6.28}); }
function drawSnow(T,dt){
  sx.clearRect(0,0,W,H);
  const t=T/1000;
  for(const f of FL){
    const y=((f.y+t*f.v)%(H+40))-20, x=((f.x+Math.sin(t*f.f+f.ph)*f.amp+t*f.dr)%(W+40)+W+40)%(W+40)-20;
    sx.globalAlpha=f.a; const s=f.s; sx.drawImage(spr,x-s,y-s,s*2,s*2);
  }
  for(let i=BURST.length-1;i>=0;i--){const b=BURST[i]; b.t+=dt/1000; b.vy+=90*dt/1000; b.vx*=1-.8*dt/1000; b.x+=b.vx*dt/1000; b.y+=b.vy*dt/1000+Math.sin(t*3+b.ph)*.3;
    if(b.t>b.life){BURST.splice(i,1);continue;} sx.globalAlpha=Math.min(1,(1-b.t/b.life)*1.4); sx.drawImage(spr,b.x-b.s,b.y-b.s,b.s*2,b.s*2);}
  sx.globalAlpha=1;
}

/* ---------- точки для котиков ---------- */
window.SCENE_ANCHORS={
  _doc:'x,y — точка «под лапками» (низ котика), scale — относительно высоты котика ≈ 220px, layer — куда добавлять в Scene.layers',
  size:{w:W,h:H},
  painter:     {x:402, y:680, scale:1.1,  flip:false, layer:'front', brush:'Scene.paint.tip() — текущая точка кисти на холсте'},
  waiterA:     {x:170, y:860, scale:1.0,  flip:false, layer:'front'},
  waiterB:     {x:408, y:892, scale:1.0,  flip:false, layer:'front'},
  compliment:  {x:640, y:622, scale:1.0,  flip:false, layer:'back', bubble:{x:520,y:372}},
  dancer:      {x:560, y:1000,scale:1.0,  flip:false, layer:'front'},
  lamplighter: {x:LAD.cx, y:LAD.top+2, scale:.9, flip:false, layer:'back', note:'стоит на верхней площадке стремянки; свечи — см. candles'},
  photographer:{x:1590,y:846, scale:1.0,  flip:true,  layer:'front', lookAt:{x:1760,y:420}},
  snowCat:     {x:1742,y:956, scale:1.0,  flip:true,  layer:'front', snowOrigin:{x:1700,y:830}},
  easelCanvas: {x:EASEL.cvX,y:EASEL.cvY,w:EASEL.cvW,h:EASEL.cvH},
  polaroid:    {x:POL.phX,y:POL.phY,w:POL.phW,h:POL.phH},
  table:       {cx:TB.cx,cy:TB.cy,rx:TB.rx,ry:TB.ry},
  chairs:      {left:{x:796,y:962},right:{x:1132,y:962}},
  cake:        {x:960,y:662,candles:CANDLES.filter(c=>c.kind==='cake').map(c=>({x:c.x,y:c.y-c.h}))},
  candelabra:  {x:1250,y:664,candles:CANDLES.filter(c=>c.kind==='candelabra').map(c=>({x:c.x,y:c.y-c.h}))},
  teaCandles:  CANDLES.filter(c=>c.kind==='tea').map(c=>({x:c.x,y:c.y-c.h})),
  date:        {x:960,y:1012},
  title:       {x:960,y:136}
};

/* ---------- цикл ---------- */
let curT=0, lastT=0, manual=false, started=false;
function render(T){
  const dt=Math.max(0,Math.min(100,T-lastT)); lastT=T; curT=T;
  updateCandles(T); updatePaint(T); drawSnow(T,dt);
  if(window.SceneHooks&&window.SceneHooks.onFrame) window.SceneHooks.onFrame(T,dt);
}
let t0=null;
function loop(now){
  if(manual) return;
  if(t0===null) t0=now; render(now-t0);
  if(photoTimer>0 && (window.PHOTOS||[]).length && (now-photoTimer)>14000){photoTimer=now;nextPhoto();}
  requestAnimationFrame(loop);
}

window.Scene={
  svg, anchors:window.SCENE_ANCHORS, options:OPT,
  layers:{ get back(){return $('catsBack');}, get front(){return $('catsFront');} },
  candles:{ list:CANDLES, relight, extinguish, get lit(){return lit;}, get progress(){return Math.min(1,(curT-litAt)/OPT.burnMs);} },
  paintGreeting, eraseGreeting, paint:{ tip:()=>paint&&paint.tip||null, get active(){return !!paint;}, get progress(){return paint?paint.p||0:0;}, get done(){return !!(paint&&paint.done);} },
  setPhoto, nextPhoto, snowBurst,
  now:()=>curT,
  step(ms){ manual=true; if(!started) init(); render(ms); }   // для детерминированных кадров (превью)
};

/* ---------- заголовок: подгоняем по ширине ---------- */
function fitTitle(){
  const a=$('titleFront'),b=$('titleBack'); if(!a) return;
  a.setAttribute('font-size',124); b.setAttribute('font-size',124);
  const w=a.getBBox().width, k=Math.min(1.4,1300/w), fs=Math.round(124*k);
  a.setAttribute('font-size',fs); b.setAttribute('font-size',fs);
}

/* ---------- масштаб, полный экран ---------- */
const stage=document.getElementById('stage');
function fit(){ const s=Math.min(innerWidth/W,innerHeight/H); stage.style.transform=`scale(${s}) translate(-${W/2}px,-${H/2}px)`; }
addEventListener('resize',fit);
const fsBtn=document.getElementById('fsBtn'); let fsTimer;
function showFs(){ fsBtn.classList.add('visible'); document.body.classList.remove('hide-cursor'); clearTimeout(fsTimer);
  fsTimer=setTimeout(()=>{fsBtn.classList.remove('visible');document.body.classList.add('hide-cursor');},2500); }
function toggleFs(){ if(!document.fullscreenElement) document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen(); else document.exitFullscreen&&document.exitFullscreen(); }
fsBtn.textContent='⛶ '+((C.ui&&C.ui.fullscreen)||'На весь экран');
fsBtn.addEventListener('click',toggleFs);
addEventListener('mousemove',showFs);
stage.addEventListener('dblclick',toggleFs);
addEventListener('keydown',e=>{ if('fFаА'.includes(e.key)) toggleFs(); });

function init(){
  if(started) return; started=true;
  build(); buildCandles(); fit(); fitTitle();
  if(document.fonts&&document.fonts.load){ document.fonts.load('40px "Marck Script"','Яа').then(()=>{fitTitle();}); }
  if((window.PHOTOS||[]).length){ nextPhoto(); photoTimer=performance.now(); }
}
const go=()=>{ init(); if(!q.has('manual')) requestAnimationFrame(loop); else manual=true; if(q.has('demo')) startDemo(); setTimeout(()=>document.body.classList.add('hide-cursor'),3000); };
function startDemo(){
  const list=(C.paintedGreetings||['С днём рождения, Маша']); let i=0;
  const cycle=()=>{ paintGreeting(list[i++%list.length],6000); setTimeout(()=>eraseGreeting(2500),9000); setTimeout(cycle,13000); };
  setTimeout(cycle,800);
}
if(document.fonts&&document.fonts.load){ Promise.all([document.fonts.load('40px "Marck Script"','Яа'),document.fonts.load('bold 20px Caveat','Яа')]).then(go,go); } else go();
})();
