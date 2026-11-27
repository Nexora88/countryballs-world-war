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
    // Hand-authored simplified continent silhouettes; intentionally original,
    // pending replacement with attributed Natural Earth / CC0 vector geometry.
    const continents = [
      [[.035,.19],[.075,.10],[.15,.055],[.23,.09],[.285,.17],[.27,.25],[.235,.32],[.205,.43],[.16,.49],[.105,.45],[.075,.35],[.045,.27]],
      [[.105,.48],[.15,.48],[.18,.54],[.15,.59],[.11,.55]],
      [[.17,.57],[.22,.52],[.29,.54],[.345,.63],[.33,.73],[.30,.82],[.265,.92],[.22,.88],[.19,.78],[.16,.66]],
      [[.275,.06],[.33,.035],[.38,.075],[.365,.14],[.31,.17]],
      [[.405,.21],[.435,.17],[.48,.18],[.515,.23],[.515,.29],[.49,.34],[.45,.35],[.415,.31],[.39,.26]],
      [[.49,.12],[.525,.085],[.55,.13],[.56,.20],[.535,.25],[.505,.20]],
      [[.515,.27],[.56,.24],[.605,.28],[.61,.34],[.58,.39],[.535,.38],[.50,.33]],
      [[.425,.40],[.48,.37],[.55,.39],[.60,.46],[.625,.57],[.60,.66],[.565,.75],[.515,.80],[.47,.75],[.435,.65],[.405,.52]],
      [[.56,.43],[.62,.41],[.665,.47],[.655,.54],[.615,.58],[.575,.54]],
      [[.555,.12],[.64,.085],[.74,.085],[.84,.105],[.93,.14],[.955,.21],[.91,.27],[.82,.30],[.72,.29],[.63,.27],[.57,.23]],
      [[.63,.30],[.70,.285],[.755,.33],[.735,.39],[.675,.42],[.625,.37]],
      [[.675,.42],[.725,.395],[.775,.445],[.79,.52],[.755,.61],[.715,.58],[.685,.51]],
      [[.735,.29],[.80,.245],[.88,.255],[.93,.31],[.91,.39],[.865,.445],[.80,.43],[.755,.39]],
      [[.88,.32],[.91,.30],[.935,.35],[.91,.39]],
      [[.925,.34],[.955,.32],[.98,.37],[.955,.42]],
      [[.77,.49],[.84,.475],[.91,.515],[.93,.57],[.885,.64],[.825,.65],[.78,.59]],
      [[.80,.64],[.86,.625],[.93,.66],[.90,.71],[.83,.70]],
      [[.79,.73],[.855,.69],[.94,.70],[.98,.77],[.96,.85],[.91,.89],[.85,.87],[.80,.82]],
      [[.965,.87],[.98,.85],[.995,.90],[.98,.94]]
    ];

    for (const poly of continents) {
      const pts = poly.map(([x,y]) => this.worldToScreen(x,y));
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i=1;i<pts.length;i++) {
        const prev=pts[i-1], cur=pts[i];
        const mx=(prev.x+cur.x)/2, my=(prev.y+cur.y)/2;
        ctx.quadraticCurveTo(prev.x,prev.y,mx,my);
      }
      ctx.closePath();
      const land = ctx.createLinearGradient(0, this.height*.12, this.width*.2, this.height*.88);
      land.addColorStop(0,'#29465b'); land.addColorStop(.5,'#1d394c'); land.addColorStop(1,'#142c40');
      ctx.shadowColor='rgba(0,0,0,.48)'; ctx.shadowBlur=22; ctx.shadowOffsetY=9;
      ctx.fillStyle=land; ctx.fill();
      ctx.shadowBlur=0; ctx.shadowOffsetY=0;
      ctx.strokeStyle='rgba(126,184,204,.52)'; ctx.lineWidth=1.35; ctx.stroke();
      ctx.strokeStyle='rgba(190,220,222,.09)'; ctx.lineWidth=4; ctx.stroke();
    }

    // Terrain texture: deterministic specks, no runtime randomness.
    for (let i=0;i<180;i++) {
      const x=((i*7919)%997)/997*this.width;
      const y=90+((i*3571)%887)/887*(this.height-130);
      ctx.beginPath(); ctx.arc(x,y, i%5===0?1.5:.7,0,Math.PI*2);
      ctx.fillStyle='rgba(172,205,192,.10)'; ctx.fill();
    }

    // Latitude / longitude guides.
    ctx.strokeStyle='rgba(159,203,226,.11)'; ctx.lineWidth=1;
    for(let i=1;i<6;i++){
      const y=this.worldToScreen(0,i/6).y;
      ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(this.width,y);ctx.stroke();
    }
    for(let i=1;i<12;i++){
      const x=this.worldToScreen(i/12,0).x;
      ctx.beginPath();ctx.moveTo(x,65);ctx.lineTo(x,this.height);ctx.stroke();
    }
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
    if(colors.length>1){
      const stripeW=(r*2.2)/colors.length;
      colors.forEach((color,i)=>{ctx.fillStyle=color;ctx.globalAlpha=.34;ctx.fillRect(pos.x-r*1.1+i*stripeW,pos.y-r*1.1,stripeW+1,r*2.2);});
      ctx.globalAlpha=1;
    }
    ctx.restore();
    ctx.beginPath();ctx.arc(pos.x,pos.y,r,0,Math.PI*2);
    ctx.strokeStyle='rgba(235,247,255,.75)';ctx.lineWidth=1.8;ctx.stroke();
    ctx.beginPath();ctx.arc(pos.x-r*.28,pos.y-r*.34,r*.23,Math.PI*1.05,Math.PI*1.65);
    ctx.strokeStyle='rgba(255,255,255,.48)';ctx.lineWidth=2;ctx.stroke();

    this.drawEyes(ctx,pos.x,pos.y,r,country);
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
