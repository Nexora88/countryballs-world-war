import { WORLD_COUNTRIES } from '../data/world-countries.js';

/**
 * Renderer — Sovereign visual pass.
 * Original Canvas 2D artwork: layered ocean, stylized geographic land,
 * countryball flag treatments, animated army convoys and tactical overlays.
 */
export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = 0;
    this.height = 0;
    this.time = 0;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.width = Math.max(320, rect.width);
    this.height = Math.max(320, rect.height);
    this.canvas.width = Math.round(this.width * dpr);
    this.canvas.height = Math.round(this.height * dpr);
    this.canvas.style.width = this.width + 'px';
    this.canvas.style.height = this.height + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  worldToScreen(nx, ny) {
    const padL = this.width * 0.035;
    const padR = this.width * 0.035;
    const padT = 76;
    const padB = 38;
    return {
      x: padL + nx * (this.width - padL - padR),
      y: padT + ny * Math.max(100, this.height - padT - padB)
    };
  }

  clear() {
    const ctx = this.ctx;
    const g = ctx.createLinearGradient(0, 0, this.width, this.height);
    g.addColorStop(0, '#071426');
    g.addColorStop(0.52, '#0b2037');
    g.addColorStop(1, '#07111f');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this.width, this.height);

    // Ocean depth rings and subtle navigation grid.
    for (let i = 0; i < 7; i++) {
      ctx.beginPath();
      ctx.ellipse(this.width * 0.52, this.height * 0.49, this.width * (0.16 + i * 0.085), this.height * (0.12 + i * 0.064), -0.08, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(72, 139, 190,' + (0.035 - i * 0.003) + ')';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(133,190,224,0.055)';
    ctx.lineWidth = 1;
    for (let x = 0; x < this.width; x += 64) {
      ctx.beginPath(); ctx.moveTo(x, 52); ctx.lineTo(x, this.height); ctx.stroke();
    }
    for (let y = 88; y < this.height; y += 64) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(this.width, y); ctx.stroke();
    }
    this.drawWorldMap();
    this.drawMapChrome();
  }

  drawWorldMap() {
    const ctx = this.ctx;
    const playableIso = { canada:'CAN',usa:'USA',mexico:'MEX',brazil:'BRA',uk:'GBR',france:'FRA',germany:'DEU',poland:'POL',russia:'RUS',turkey:'TUR',egypt:'EGY',israel:'ISR',saudi:'SAU',iran:'IRN',india:'IND',china:'CHN',south_korea:'KOR',japan:'JPN',indonesia:'IDN',australia:'AUS' };
    const countryByIso = new Map(Object.entries(playableIso).map(([id,iso])=>[iso,id]));
    const worldFill = ctx.createLinearGradient(0,this.height*.12,this.width*.2,this.height*.88);
    worldFill.addColorStop(0,'#34576b');worldFill.addColorStop(.52,'#254558');worldFill.addColorStop(1,'#193447');
    for(const feature of WORLD_COUNTRIES.features){
      const id=countryByIso.get(feature.properties.iso),fill=id?this.countryColor(id):worldFill;
      ctx.beginPath();this.traceGeoGeometry(feature.geometry);ctx.fillStyle=fill;
      ctx.shadowColor='rgba(0,0,0,.24)';ctx.shadowBlur=id?7:3;ctx.fill();ctx.shadowBlur=0;
      ctx.strokeStyle=id?'rgba(157,207,222,.72)':'rgba(139,183,201,.36)';ctx.lineWidth=id?1.05:.72;ctx.stroke();
    }
    ctx.save();ctx.strokeStyle='rgba(159,203,226,.10)';ctx.lineWidth=1;
    for(let lat=-60;lat<=60;lat+=30){const y=this.worldToScreen(0,(90-lat)/180).y;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(this.width,y);ctx.stroke();}
    for(let lon=-150;lon<=180;lon+=30){const x=this.worldToScreen((lon+180)/360,0).x;ctx.beginPath();ctx.moveTo(x,65);ctx.lineTo(x,this.height);ctx.stroke();}
    ctx.restore();
  }

  traceGeoGeometry(geometry){
    const polygons=geometry.type==='Polygon'?[geometry.coordinates]:geometry.coordinates;
    for(const polygon of polygons)for(const ring of polygon){if(!ring.length)continue;
      const first=ring[0],start=this.worldToScreen((first[0]+180)/360,(90-first[1])/180);this.ctx.moveTo(start.x,start.y);
      for(let i=1;i<ring.length;i++){const point=ring[i],p=this.worldToScreen((point[0]+180)/360,(90-point[1])/180);this.ctx.lineTo(p.x,p.y);}
      this.ctx.closePath();
    }
  }

  countryColor(id){
    const colors={canada:'#8b3e49',usa:'#384b77',mexico:'#2f795d',brazil:'#397a4c',uk:'#354c80',france:'#355d9a',germany:'#8b3d3d',poland:'#a54c58',russia:'#42618e',turkey:'#a83c48',egypt:'#9b514a',israel:'#4269a8',saudi:'#3e765d',iran:'#47815b',india:'#b77b3d',china:'#a84842',south_korea:'#42658e',japan:'#a34d5b',indonesia:'#a94b4b',australia:'#3e568d'};
    return colors[id]||'#29465b';
  }

  drawMapChrome() {
    const ctx=this.ctx;
    ctx.save();
    ctx.fillStyle='rgba(8,18,31,.72)';
    ctx.strokeStyle='rgba(117,177,210,.18)';
    this.roundRect(18,66,142,30,9);ctx.fill();ctx.stroke();
    ctx.fillStyle='#a9c8dc';ctx.font='700 10px Inter,system-ui';ctx.textAlign='left';ctx.textBaseline='middle';
    ctx.fillText('TACTICAL WORLD MAP',30,81);
    ctx.textAlign='right';ctx.fillStyle='rgba(177,205,222,.58)';ctx.font='600 9px Inter,system-ui';
    ctx.fillText('SOVEREIGN  •  GLOBAL THEATER',this.width-20,81);
    ctx.restore();
  }

  roundRect(x,y,w,h,r) {
    const c=this.ctx;c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();
  }

  drawCountry(country) {
    const ctx=this.ctx, pos=this.worldToScreen(country.x,country.y), r=country.radius;
    const pulse=(Math.sin(this.time*.003+country.x*13)*.5+.5);
    if(country.isPlayer||country.selected||country.hover){
      ctx.beginPath();ctx.arc(pos.x,pos.y,r+9+pulse*4,0,Math.PI*2);
      ctx.fillStyle=country.isPlayer?'rgba(65,160,255,.13)':'rgba(226,241,255,.10)';ctx.fill();
      ctx.strokeStyle=country.isPlayer?'rgba(93,181,255,.62)':'rgba(220,235,245,.36)';ctx.lineWidth=1.5;ctx.stroke();
    }
    // Drop shadow and flag-painted sphere.
    ctx.beginPath();ctx.ellipse(pos.x+2,pos.y+r*.82,r*.82,r*.28,0,0,Math.PI*2);
    ctx.fillStyle='rgba(0,0,0,.34)';ctx.fill();
    const body=ctx.createRadialGradient(pos.x-r*.34,pos.y-r*.42,r*.05,pos.x,pos.y,r*1.08);
    body.addColorStop(0,this.lighten(country.color,65));body.addColorStop(.48,country.color);body.addColorStop(1,this.darken(country.color,55));
    ctx.beginPath();ctx.arc(pos.x,pos.y,r,0,Math.PI*2);ctx.fillStyle=body;ctx.fill();
    ctx.save();ctx.beginPath();ctx.arc(pos.x,pos.y,r*.91,0,Math.PI*2);ctx.clip();
    const colors=country.flagColors||[country.color];
    const horizontal=['germany','russia','egypt','poland','indonesia'].includes(country.id);
    if(colors.length>1)colors.forEach((color,i)=>{ctx.fillStyle=color;ctx.globalAlpha=.66;if(horizontal){const h=r*2.2/colors.length;ctx.fillRect(pos.x-r*1.1,pos.y-r*1.1+i*h,r*2.2,h+1);}else{const w=r*2.2/colors.length;ctx.fillRect(pos.x-r*1.1+i*w,pos.y-r*1.1,w+1,r*2.2);}});
    ctx.globalAlpha=1;this.drawFlagEmblem(ctx,pos.x,pos.y,r,country);ctx.restore();
    ctx.beginPath();ctx.arc(pos.x,pos.y,r,0,Math.PI*2);
    ctx.strokeStyle='rgba(235,247,255,.75)';ctx.lineWidth=1.8;ctx.stroke();
    ctx.beginPath();ctx.arc(pos.x-r*.28,pos.y-r*.34,r*.23,Math.PI*1.05,Math.PI*1.65);
    ctx.strokeStyle='rgba(255,255,255,.48)';ctx.lineWidth=2;ctx.stroke();

    this.drawEyes(ctx,pos.x,pos.y,r,country);
    this.drawAccessory(ctx,pos.x,pos.y,r,country);
    if(country.nuclear){
      ctx.beginPath();ctx.arc(pos.x+r*.72,pos.y-r*.7,5.5,0,Math.PI*2);ctx.fillStyle='#ffc857';ctx.fill();
      ctx.strokeStyle='#6b4b13';ctx.lineWidth=1;ctx.stroke();
    }
    // Nameplate with readable contrast.
    ctx.font='700 10px Inter,system-ui';const label=country.short;
    const tw=ctx.measureText(label).width+13;
    ctx.fillStyle='rgba(5,13,23,.84)';this.roundRect(pos.x-tw/2,pos.y+r+5,tw,17,6);ctx.fill();
    ctx.strokeStyle=country.isPlayer?'rgba(88,176,255,.8)':'rgba(175,205,225,.18)';ctx.lineWidth=1;ctx.stroke();
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#e9f4fc';ctx.fillText(label,pos.x,pos.y+r+13.5);
    if(country.isPlayer){ctx.font='800 8px Inter';ctx.fillStyle='#79c7ff';ctx.fillText('YOU',pos.x,pos.y+r+31);}
  }

  drawFlagEmblem(ctx,cx,cy,r,country){
    ctx.save();
    if(country.id==='japan'){ctx.beginPath();ctx.arc(cx,cy,r*.34,0,Math.PI*2);ctx.fillStyle='#bc002d';ctx.fill();}
    else if(country.id==='turkey'){ctx.beginPath();ctx.arc(cx-r*.05,cy,r*.34,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();ctx.beginPath();ctx.arc(cx+r*.07,cy-r*.06,r*.28,0,Math.PI*2);ctx.fillStyle=country.color;ctx.fill();this.drawStar(ctx,cx+r*.34,cy-r*.02,r*.11,'#fff');}
    else if(country.id==='brazil'){ctx.beginPath();ctx.moveTo(cx,cy-r*.34);ctx.lineTo(cx+r*.43,cy);ctx.lineTo(cx,cy+r*.34);ctx.lineTo(cx-r*.43,cy);ctx.closePath();ctx.fillStyle='#ffdf00';ctx.fill();ctx.beginPath();ctx.arc(cx,cy,r*.19,0,Math.PI*2);ctx.fillStyle='#002776';ctx.fill();}
    else if(country.id==='usa'){for(let row=0;row<3;row++)for(let col=0;col<3;col++)this.drawStar(ctx,cx-r*.36+col*r*.18,cy-r*.26+row*r*.22,r*.045,'#fff');}
    else if(country.id==='china'){this.drawStar(ctx,cx-r*.18,cy-r*.16,r*.17,'#ffde00');this.drawStar(ctx,cx+r*.18,cy-r*.28,r*.065,'#ffde00');}
    else if(country.id==='india'){ctx.beginPath();ctx.arc(cx,cy,r*.17,0,Math.PI*2);ctx.strokeStyle='#1b3f91';ctx.lineWidth=1.5;ctx.stroke();for(let i=0;i<12;i++){const a=i*Math.PI/6;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(a)*r*.16,cy+Math.sin(a)*r*.16);ctx.stroke();}}
    else if(country.id==='germany'){ctx.beginPath();ctx.arc(cx,cy+r*.02,r*.1,0,Math.PI*2);ctx.fillStyle='#ffce00';ctx.fill();}
    ctx.restore();
  }
  drawStar(ctx,cx,cy,r,color){ctx.save();ctx.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2===0?r:r*.43,x=cx+Math.cos(a)*rr,y=cy+Math.sin(a)*rr;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.closePath();ctx.fillStyle=color;ctx.fill();ctx.restore();}
  drawAccessory(ctx,cx,cy,r,country){
    ctx.save();ctx.lineCap='round';
    if(country.id==='russia'){ctx.fillStyle='#65748b';ctx.beginPath();ctx.ellipse(cx,cy-r*.72,r*.76,r*.22,0,Math.PI,Math.PI*2);ctx.fill();ctx.fillRect(cx-r*.76,cy-r*.72,r*1.52,r*.17);ctx.strokeStyle='rgba(255,255,255,.38)';ctx.lineWidth=1.2;ctx.stroke();}
    else if(country.id==='france'){ctx.fillStyle='#8b3445';ctx.beginPath();ctx.ellipse(cx,cy-r*.77,r*.68,r*.18,-.08,Math.PI,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(cx-r*.68,cy-r*.77);ctx.quadraticCurveTo(cx,cy-r*.48,cx+r*.68,cy-r*.77);ctx.fill();}
    else if(country.id==='uk'){ctx.strokeStyle='#d5dbe5';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(cx-r*.42,cy-r*.68);ctx.lineTo(cx+r*.42,cy-r*.68);ctx.stroke();ctx.fillStyle='#263b68';ctx.fillRect(cx-r*.48,cy-r*.82,r*.96,r*.15);}
    else if(country.id==='japan'){ctx.strokeStyle='#bc002d';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(cx-r*.72,cy-r*.65);ctx.quadraticCurveTo(cx,cy-r*.94,cx+r*.72,cy-r*.65);ctx.stroke();}
    else if(country.id==='usa'){ctx.fillStyle='#253d68';ctx.beginPath();ctx.moveTo(cx-r*.55,cy-r*.55);ctx.lineTo(cx-r*.25,cy-r*.9);ctx.lineTo(cx+r*.05,cy-r*.55);ctx.closePath();ctx.fill();}
    else if(country.id==='china'){ctx.fillStyle='#ffde00';ctx.beginPath();ctx.arc(cx+r*.57,cy-r*.55,r*.12,0,Math.PI*2);ctx.fill();}
    ctx.restore();
  }

  drawEyes(ctx,cx,cy,r,country){
    const ey=cy-r*.12,sp=r*.31,er=r*.17;
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(cx-sp,ey,er,0,Math.PI*2);ctx.arc(cx+sp,ey,er,0,Math.PI*2);ctx.fill();
    let oy=0,scale=1;if(country.expression==='angry'){oy=2;scale=.82;}if(country.expression==='worried'){oy=1;scale=1.08;}
    ctx.fillStyle='#15202b';ctx.beginPath();ctx.arc(cx-sp,ey+oy,er*.46*scale,0,Math.PI*2);ctx.arc(cx+sp,ey+oy,er*.46*scale,0,Math.PI*2);ctx.fill();
    if(country.expression==='angry'||country.atWarWith.size>0){
      ctx.strokeStyle='#20232b';ctx.lineWidth=2.4;ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(cx-sp-er,ey-er*.9);ctx.lineTo(cx-sp+er*.7,ey-er*.55);ctx.moveTo(cx+sp+er,ey-er*.9);ctx.lineTo(cx+sp-er*.7,ey-er*.55);ctx.stroke();
    }
  }

  drawConnection(from,to,type){
    const ctx=this.ctx,a=this.worldToScreen(from.x,from.y),b=this.worldToScreen(to.x,to.y);
    ctx.save();ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);
    ctx.setLineDash(type==='war'?[7,6]:[]);
    ctx.strokeStyle=type==='war'?'rgba(255,91,100,.48)':'rgba(81,221,171,.32)';
    ctx.lineWidth=type==='war'?2.5:1.8;ctx.shadowColor=ctx.strokeStyle;ctx.shadowBlur=type==='war'?9:4;ctx.stroke();ctx.restore();
  }

  drawArmy(army,world){
    const from=world.getCountry(army.fromId),to=world.getCountry(army.toId);if(!from||!to)return;
    const a=this.worldToScreen(from.x,from.y),b=this.worldToScreen(to.x,to.y),t=army.progress;
    const x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;
    const ctx=this.ctx,owner=world.getCountry(army.ownerId),color=owner?owner.color:'#f2f5f8';
    ctx.save();
    ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(x,y);
    ctx.strokeStyle='rgba(255,190,96,.38)';ctx.lineWidth=5;ctx.shadowColor='#ff9f43';ctx.shadowBlur=10;ctx.stroke();
    ctx.setLineDash([5,7]);ctx.strokeStyle='rgba(255,226,177,.86)';ctx.lineWidth=1.5;ctx.lineDashOffset=-this.time*.025;ctx.stroke();ctx.setLineDash([]);
    const bob=Math.sin(this.time*.012+army.id)*2;
    ctx.beginPath();ctx.arc(x,y+bob,9+Math.min(army.strength*.025,4),0,Math.PI*2);
    ctx.fillStyle=color;ctx.shadowColor=color;ctx.shadowBlur=15;ctx.fill();ctx.shadowBlur=0;
    ctx.strokeStyle='#fff';ctx.lineWidth=1.5;ctx.stroke();
    // Tiny marching-unit silhouettes.
    for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(x-5+i*5,y-13+bob+Math.sin(this.time*.018+i)*1.5,2.1,0,Math.PI*2);ctx.fillStyle='#eaf5ff';ctx.fill();}
    ctx.fillStyle='#081522';this.roundRect(x-13,y+10,26,13,5);ctx.fill();
    ctx.font='800 8px Inter';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff';ctx.fillText(Math.floor(army.strength),x,y+16.5);
    ctx.restore();
  }

  render(world){
    this.time+=16;this.clear();
    const countries=world.getAllCountries();
    for(const c of countries){
      for(const id of c.atWarWith){const other=world.getCountry(id);if(other&&c.id<id)this.drawConnection(c,other,'war');}
      for(const id of c.allies){const other=world.getCountry(id);if(other&&c.id<id)this.drawConnection(c,other,'ally');}
    }
    if(world.combat)for(const army of world.combat.getArmies())if(!army.retreating)this.drawArmy(army,world);
    for(const country of countries)this.drawCountry(country);
  }

  lighten(hex,p){const n=parseInt(hex.replace('#',''),16),r=Math.min(255,(n>>16)+p),g=Math.min(255,((n>>8)&255)+p),b=Math.min(255,(n&255)+p);return 'rgb('+r+','+g+','+b+')';}
  darken(hex,p){const n=parseInt(hex.replace('#',''),16),r=Math.max(0,(n>>16)-p),g=Math.max(0,((n>>8)&255)-p),b=Math.max(0,(n&255)-p);return 'rgb('+r+','+g+','+b+')';}

  hitTest(sx,sy,world){
    const countries=world.getAllCountries();
    for(let i=countries.length-1;i>=0;i--){const c=countries[i],p=this.worldToScreen(c.x,c.y),dx=sx-p.x,dy=sy-p.y;if(dx*dx+dy*dy<=(c.radius+7)*(c.radius+7))return c;}
    return null;
  }
}
