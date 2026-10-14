// v1.3 Mouse Playtest — directional swipe, assisted footwork, reliable rallies.
'use strict';
(() => {
const $=id=>document.getElementById(id),clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),lerp=(a,b,t)=>a+(b-a)*t;
function startupError(message){
 const intro=$('intro');
 intro.textContent=message;
 intro.className='error';
 ['begin','beginMatch','rematchBtn'].forEach(id=>{const button=$(id);if(button)button.disabled=true});
}
if(typeof THREE==='undefined'){
 startupError('Không tải được thư viện đồ họa Three.js. Hãy giữ nguyên thư mục vendor cạnh index.html hoặc tải lại trọn bộ game. Đây không phải lỗi WebGL của trình duyệt.');
 return;
}
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas:$('view'),antialias:true,powerPreference:'high-performance'});}catch(e){startupError('Không tạo được ngữ cảnh WebGL. Hãy mở game bằng Chrome/Edge hiện hành và kiểm tra tăng tốc đồ họa trong cài đặt trình duyệt.');return;}
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.7));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
const scene=new THREE.Scene();scene.background=new THREE.Color('#8db8f0');scene.fog=new THREE.Fog('#f3ad8e',24,49);
const camera=new THREE.PerspectiveCamera(43,1,.1,100);camera.position.set(.2,8.6,15.1);camera.lookAt(0,.15,0);
scene.add(new THREE.HemisphereLight(0xfff0e4,0x594d8d,2.5));const light=new THREE.DirectionalLight(0xffc78a,3.6);light.position.set(-4,13,4);light.castShadow=true;light.shadow.mapSize.set(2048,2048);Object.assign(light.shadow.camera,{left:-10,right:10,top:10,bottom:-10,near:1,far:35});light.shadow.bias=-.0005;light.shadow.normalBias=.025;scene.add(light);let fill=new THREE.DirectionalLight(0x8bcbff,1.4);fill.position.set(7,6,-6);scene.add(fill);
const mats={};function mat(c,rough=.8,metal=0){const k=c+' '+rough+' '+metal;return mats[k]||(mats[k]=new THREE.MeshStandardMaterial({color:c,roughness:rough,metalness:metal}));}
function box(w,h,d,c,x,y,z,parent=scene){let m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(c));m.position.set(x,y,z);m.receiveShadow=true;parent.add(m);return m}
function cylinder(a,b,r,c,parent=scene,r2=r){let m=new THREE.Mesh(new THREE.CylinderGeometry(r2,r,a.distanceTo(b),10),mat(c,.62));m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(V(0,1,0),b.clone().sub(a).normalize());m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
function line(a,b,c,parent=scene){const geo=new THREE.BufferGeometry().setFromPoints([a,b]);const mesh=new THREE.Line(geo,new THREE.LineBasicMaterial({color:c,transparent:true,opacity:.76}));parent.add(mesh);return mesh}
box(30,.2,37,'#db8f79',0,-.15,0);box(8.4,.035,16.4,'#3b3cc6',0,-.025,0);box(6.1,.025,13.4,'#735cef',0,0,0);
function mark(x,z,w,d){box(w,.007,d,'#ecf1de',x,.019,z)}
[-3.05,3.05,-2.59,2.59].forEach(x=>mark(x,0,.04,13.4));[-6.7,6.7,-5.94,5.94,-1.98,1.98].forEach(z=>mark(0,z,6.1,.04));[-1,1].forEach(s=>mark(0,s*4.34,.04,4.72));
// Arena seating and wall fixtures keep the playing surface readable.
for(let side of [-1,1]){for(let row=0;row<3;row++){box(1.1,.26+row*.22,15,'#9e6587',side*(6.3+row*1.25),row*.11,0);for(let z=-6;z<=6;z+=.65){box(.48,.13,.45,row%2?'#ffc779':'#7cc8eb',side*(6.25+row*1.25),.38+row*.22,z);box(.48,.48,.1,'#8c638d',side*(6.55+row*1.25),.62+row*.22,z);}}box(.15,3.9,22,'#e9a381',side*11,1.9,0);for(let z=-9;z<=9;z+=6){box(.09,.09,3,'#ffdfbe',side*6.4,5.6,z);}}
box(24,6,.15,'#e5a38c',0,2.9,-11.5);
function label(text,x,y,z,size=1){let c=document.createElement('canvas');c.width=1024;c.height=128;let g=c.getContext('2d');g.fillStyle='#d8e8d8';g.font='700 58px sans-serif';g.textAlign='center';g.fillText(text,512,88);let tex=new THREE.CanvasTexture(c),m=new THREE.Mesh(new THREE.PlaneGeometry(7*size,.9*size),new THREE.MeshBasicMaterial({map:tex,transparent:true}));m.position.set(x,y,z);scene.add(m)}label('SHUTTLE  ARENA',0,3,-11.39,1.35);
// Badminton net: 1.55 m posts, slightly lower centre tape, open bottom.
[-3.05,3.05].forEach(x=>{cylinder(V(x,0,0),V(x,1.55,0),.045,'#697781');box(.32,.08,.44,'#34464c',x,.04,0)});
for(let x=-3.03;x<=3.05;x+=.115)line(V(x,.79,0),V(x,1.524+.026*Math.abs(x)/3.05,0),'#a3b9b1');for(let y=.79;y<1.53;y+=.095)line(V(-3.03,y,0),V(3.03,y,0),'#9daea6');
for(let x=-3.05;x<3.05;x+=.305){cylinder(V(x,1.524+.026*Math.abs(x)/3.05,0),V(x+.305,1.524+.026*Math.abs(x+.305)/3.05,0),.014,'#f6efdf')}
const skin=mat('#f2bb94',.83),shoe=mat('#ffffff',.75),shorts=mat('#2548ad');
function sphere(r,material,parent){let m=new THREE.Mesh(new THREE.SphereGeometry(r,14,10),material);m.castShadow=true;parent.add(m);return m}
function segment(r,material,parent){let m=new THREE.Mesh(new THREE.CylinderGeometry(r*.86,r,1,10),material);m.castShadow=true;parent.add(m);return m}
function setBone(mesh,a,b){mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.scale.y=a.distanceTo(b);mesh.quaternion.setFromUnitVectors(V(0,1,0),b.clone().sub(a).normalize())}
function bend(a,b,l1,l2,hint){let delta=b.clone().sub(a),d=clamp(delta.length(),.001,l1+l2-.001),axis=delta.normalize(),mid=(l1*l1-l2*l2+d*d)/(2*d),height=Math.sqrt(Math.max(0,l1*l1-mid*mid));let side=hint.clone().sub(axis.clone().multiplyScalar(hint.dot(axis))).normalize();return a.clone().addScaledVector(axis,mid).addScaledVector(side,height)}
function actor(side){let group=new THREE.Group();scene.add(group);group.rotation.y=side==='ai'?Math.PI:0;const jersey=mat(side==='ai'?'#40d6a5':'#fff8ec'),actorSkin=side==='ai'?mat('#b87e65'):skin,a={side,group,x:0,z:side==='ai'?-4.5:4.5,vx:0,vz:0,phase:0,shot:null,split:0,feet:[],speed:0};a.torso=new THREE.Mesh(new THREE.CylinderGeometry(.27,.21,.53,12),jersey);a.torso.scale.z=.74;a.torso.castShadow=true;group.add(a.torso);a.pelvis=box(.39,.22,.28,side==='ai'?'#563583':'#2548ad',0,.88,0,group);a.head=sphere(.177,actorSkin,group);a.head.scale.set(.9,1.1,.94);a.hair=sphere(.182,mat(side==='ai'?'#b3418d':'#ed783b'),group);a.hair.scale.set(.93,.59,.96);a.capBrim=box(.28,.025,.13,side==='ai'?'#e865c1':'#39bce8',0,0,0,group);a.neck=segment(.053,actorSkin,group);
 a.legs=[0,1].map(()=>({upper:segment(.085,shorts,group),lower:segment(.058,actorSkin,group),sock:segment(.06,mat('#fff3d5'),group),foot:(()=>{const foot=sphere(.15,shoe,group);foot.scale.set(.72,.38,1.15);return foot})()}));a.arms=[0,1].map(()=>({upper:segment(.058,jersey,group),lower:segment(.047,actorSkin,group),hand:sphere(.055,actorSkin,group)}));a.racket=new THREE.Group();group.add(a.racket);let hoop=new THREE.Mesh(new THREE.TorusGeometry(.135,.012,6,30),mat('#8deaf4',.35,.55));hoop.scale.y=1.36;a.racket.add(hoop);let shaft=cylinder(V(0,-.17,0),V(0,-.48,0),.008,'#d3d9d1',a.racket);cylinder(V(0,-.43,0),V(0,-.57,0),.017,'#33343c',a.racket);for(let i=-3;i<=3;i++){let x=i*.033,h=Math.sqrt(Math.max(0,1-x*x/(.132*.132)))*.178;line(V(x,-h,0),V(x,h,0),'#d9e1d3',a.racket)}for(let i=-4;i<=4;i++){let y=i*.035,w=Math.sqrt(Math.max(0,1-y*y/(.18*.18)))*.132;line(V(-w,y,0),V(w,y,0),'#d9e1d3',a.racket)}resetFeet(a);return a;}
function resetFeet(a){a.feet=[-.19,.19].map((x,i)=>({world:V(a.x+x,.055,a.z),from:V(a.x+x,.055,a.z),to:V(a.x+x,.055,a.z),swing:false}));}
const player=actor('player'),opponent=actor('ai');
const shuttle=new THREE.Group();scene.add(shuttle);let cork=new THREE.Mesh(new THREE.SphereGeometry(.042,10,8),mat('#e5dbc2'));cork.position.y=-.064;shuttle.add(cork);let skirt=new THREE.Mesh(new THREE.ConeGeometry(.095,.18,12,1,true),new THREE.MeshStandardMaterial({color:'#f9f4df',side:THREE.DoubleSide,roughness:.75}));skirt.rotation.z=Math.PI;skirt.position.y=.04;shuttle.add(skirt);for(let i=0;i<12;i++){let angle=i*Math.PI/6;cylinder(V(0,-.06,0),V(Math.cos(angle)*.094,.13,Math.sin(angle)*.094),.0027,'#ffffff',shuttle)}
const trailPoints=Array.from({length:10},()=>V());const trailGeo=new THREE.BufferGeometry().setFromPoints(trailPoints);const trail=new THREE.Line(trailGeo,new THREE.LineBasicMaterial({color:'#6bfff5',transparent:true,opacity:.9}));scene.add(trail);
function floorRing(r,color){let m=new THREE.Mesh(new THREE.RingGeometry(r-.018,r,48),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.8,side:THREE.DoubleSide,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.y=.038;scene.add(m);return m}const landingRing=floorRing(.28,'#e9d79b'),standRing=floorRing(.34,'#bfdbe0'),reachRing=floorRing(.6,'#cdf696');
const ballShadow=new THREE.Mesh(new THREE.CircleGeometry(.13,20),new THREE.MeshBasicMaterial({color:'#101c20',transparent:true,opacity:.5,depthWrite:false}));ballShadow.rotation.x=-Math.PI/2;ballShadow.position.y=.036;scene.add(ballShadow);const aimRing=floorRing(.27,'#ff765c');aimRing.material.opacity=.95;
const S={running:false,started:false,ended:false,clock:0,ball:null,wait:.65,hits:0,drops:0,rally:0,best:0,aim:0,held:false,queuedUntil:-1,mouseIntent:false,mouseShot:null,assist:true,pace:.8,drill:'center',keys:new Set(),seed:73,feeds:0,lastContact:null,lastGesture:null,event:'',eventUntil:0,sound:false,contacts:[],faults:0,mode:'training',shotType:'standard',lastShot:''};
const SETTINGS_KEY='shuttle-arena.settings.v1';
function loadSettings(){try{const value=JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}');return value&&typeof value==='object'?value:{}}catch(e){return {}}}
const savedSettings=loadSettings();
// Footwork is automatic in mouse play; old saved keyboard-assist choices are ignored.
S.assist=true;
if(typeof savedSettings.sound==='boolean')S.sound=savedSettings.sound;
if(['center','wide','mixed'].includes(savedSettings.drill))S.drill=savedSettings.drill;
if([.8,1].includes(+savedSettings.pace))S.pace=+savedSettings.pace;
function saveSettings(){try{localStorage.setItem(SETTINGS_KEY,JSON.stringify({version:1,assist:S.assist,sound:S.sound,drill:S.drill,pace:S.pace,ruleset:$('rulesetSel').value,ai:$('aiSel').value}))}catch(e){}}
$('assist').checked=S.assist;$('drill').value=S.drill;$('pace').value=String(S.pace);
if([...$('rulesetSel').options].some(o=>o.value===savedSettings.ruleset))$('rulesetSel').value=savedSettings.ruleset;
if([...$('aiSel').options].some(o=>o.value===savedSettings.ai))$('aiSel').value=savedSettings.ai;
$('audio').textContent='Âm thanh: '+(S.sound?'bật':'tắt');$('audio').setAttribute('aria-pressed',String(S.sound));
// === v0.4 MATCH (Quick Match Arcade 11) — Spec v0.4 ===
const CONFIG=Rules.CONFIG;
const CFG=CONFIG; // backwards-compatible QA alias
// === RULES (pure, testable) ===
function winsMatch(a,b){return winsGame(a,b,11,15)}
function winsGame(a,b,target,cap){return (a>=target&&a-b>=2)||a===cap}
const RULESETS={arcade11:{label:'Arcade 11',target:11,cap:15,games:1},preview15:{label:'2027 Preview 15',target:15,cap:21,games:2},classic21:{label:'Classic 21',target:21,cap:30,games:2}};
const AI_LEVELS={rookie:{label:'Dễ · Rookie',reaction:.60,noise:.40,speed:4.05,errMul:1.35},inter:{label:'Thường · Intermediate',reaction:.22,noise:.18,speed:4.65},expert:{label:'Khó · Expert',reaction:.18,noise:.10,speed:4.65,errMul:.60}};
const ANIM_TIMING={splitStep:.66,smashFollow:.42};
const INPUT_CONFIG={swipe:{minDistance:22,laneThreshold:18,verticalThreshold:18,fastSpeed:600,smashDownDistance:72,dropHoldMs:280,targetXScale:105}};
function classifySwipe(dx,dy,durationMs){
 const c=INPUT_CONFIG.swipe,distance=Math.hypot(dx,dy),duration=Math.max(16,durationMs),speed=distance/(duration/1000);
 if(distance<c.minDistance)return null;
 const aim=dx<-c.laneThreshold?-1:(dx>c.laneThreshold?1:0),vertical=Math.max(c.verticalThreshold,distance*.22);
 let shot='standard';
 if(dy<-Math.max(c.verticalThreshold,distance*.28))shot='clear';
 else if(dy>vertical)shot=dy>=c.smashDownDistance||(speed>=c.fastSpeed&&dy>=30)?'smash':'drop';
 else if(duration>=c.dropHoldMs)shot='drop';
 const targetX=clamp(dx/c.targetXScale*1.7,-2.3,2.3);
 const depth=shot==='clear'?clamp(5.1+Math.abs(dy)/180,5.1,6.25):shot==='drop'?clamp(2+Math.max(0,dy)/180,2,2.7):shot==='smash'?clamp(3.0+Math.max(0,dy)/220,3,4.15):4.8;
 return{aim,shot,targetX,depth,power:clamp((speed-180)/900,.2,1),speed,distance};
}
const smooth01=t=>{t=clamp(t,0,1);return t*t*(3-2*t)};
function serveSideSign(server,score){const dir=server==='player'?1:-1;return score%2===0?dir:-dir}
function isInSingles(x,z,sideSign){return Math.abs(x)<=2.59&&z*sideSign>0&&Math.abs(z)<=6.70}
// === END RULES ===
const REASONS={FLOOR_IN:'Cầu rơi trong sân',OUT:'Cầu ngoài sân',NET:'Cầu chạm lưới',WHIFF:'Không đón kịp cầu'};
const M={active:false,phase:'MENU',score:{player:0,ai:0},games:{player:0,ai:0},ruleset:'arcade11',level:'inter',gameEnded:false,gameWinner:'',server:'player',rallyId:0,pointDoneFor:-1,pointTimer:0,phaseTimer:0,matchOver:false,totalRallies:0,rallyHits:0,longest:0,lastReason:'',lastWinner:'',aiMoveAt:0,aiShotCount:0,receiverInRange:false};
function levelCfg(){
 if(M.level==='inter')return {label:AI_LEVELS.inter.label,speed:CONFIG.match.ai.speedCap,reaction:CONFIG.match.ai.reactionDelay,noise:CONFIG.match.ai.interceptNoise};
 return AI_LEVELS[M.level]||AI_LEVELS.inter;
}
function setupAiForRally(){
 if(M.noiseRallyId===M.rallyId)return;
 M.noiseRallyId=M.rallyId;
 M.aiNoise=(rnd()*2-1)*levelCfg().noise;
 M.aiAim=[-1,0,1][(M.rallyId-1+M.aiAimStart)%3];
}
function serveSpots(){const sx=serveSideSign(M.server,M.score[M.server])*1.30;const sp=M.server==='player';return{server:{x:sx,z:sp?5.0:-5.0},receiver:{x:-sx,z:sp?-4.5:4.5},target:{x:-sx,z:sp?-4.34:4.34}}}
function pointEnd(winner,reason,rallyId=M.rallyId){if(!M.active||M.phase!=='RALLY'||rallyId!==M.rallyId||M.pointDoneFor===rallyId)return;M.pointDoneFor=M.rallyId;M.score[winner]++;M.lastReason=REASONS[reason]||reason;M.lastWinner=winner;M.lastReasonCode=reason;M.totalRallies++;M.pointLog.push({rallyId,reason,text:M.lastReason,winner,hitter:M.lastHitter,score:{...M.score}});M.longest=Math.max(M.longest,M.rallyHits);const missedWithIntent=S.mouseIntent;S.ball=null;S.queuedUntil=-1;S.mouseIntent=false;S.mouseShot=null;M.phase='POINT_END';M.pointTimer=1.2;const rs=RULESETS[M.ruleset];M.gameEnded=winsGame(M.score[winner],M.score[winner==='player'?'ai':'player'],rs.target,rs.cap);if(M.gameEnded){M.games[winner]++;M.gameWinner=winner;M.matchOver=M.games[winner]>=rs.games}M.server=winner;tone(winner==='player'?720:170,.09);event((winner==='player'?'Bạn ghi điểm · ':'Đối thủ ghi điểm · ')+M.lastReason,1.2);if(reason==='WHIFF'&&winner==='ai')showRallyFeedback(missedWithIntent?'CẦU NGOÀI TẦM':'VUỐT QUÁ MUỘN','miss');else showRallyFeedback((winner==='player'?'BẠN GHI ĐIỂM · ':'AI GHI ĐIỂM · ')+M.lastReason,winner==='player'?'score':'miss')}
function startServeSetup(){M.rallyId++;setupAiForRally();M.rallyHits=0;M.receiverInRange=false;M.phase='PRE_SERVE';M.phaseTimer=0;S.ball=null}
function doServe(){const spots=serveSpots();const srv=M.server==='player'?player:opponent;const start=V(srv.x+(M.server==='player'?.25:-.25),1.75,srv.z+(M.server==='player'?-.35:.35));setShot(srv,start);M.lastHitter=M.server;launch(start,V(spots.target.x,.08,spots.target.z),M.server==='player'?'ai':'player');S.mouseIntent=false;S.mouseShot=null;S.queuedUntil=-1;M.phase='RALLY';tone(660,.05)}
function rnd(){S.seed=(S.seed*1664525+1013904223)>>>0;return S.seed/4294967296}
// Linear drag with gravity. Initial velocity is solved so every flight has a known landing point.
const DRAG=.35,GRAVITY=9.81,FIXED=1/120;
function sample(b,t){t=clamp(t,0,b.T);let f=(1-Math.exp(-DRAG*t))/DRAG;return V(b.start.x+b.v.x*f,b.start.y+(b.v.y+GRAVITY/DRAG)*f-GRAVITY*t/DRAG,b.start.z+b.v.z*f)}
function velocity(b,t){let e=Math.exp(-DRAG*t);return V(b.v.x*e,(b.v.y+GRAVITY/DRAG)*e-GRAVITY/DRAG,b.v.z*e)}
function trajectory(start,end,T){let f=(1-Math.exp(-DRAG*T))/DRAG;return {start:start.clone(),end:end.clone(),v:V((end.x-start.x)/f,(end.y-start.y+GRAVITY*T/DRAG)/f-GRAVITY/DRAG,(end.z-start.z)/f),T,t:0};}
function planIntercept(b,side){for(let t=b.T*.38;t<=b.T;t+=.007){let p=sample(b,t);if(velocity(b,t).y<0&&p.y<(M.active?CONFIG.match.interceptHeight:1.58)&&p.y>.55&&p.z*(side==='player'?1:-1)>.75){return {t,point:p,x:clamp(p.x-(side==='player'?.22:-.22),-2.43,2.43),z:clamp(p.z+(side==='player'?.42:-.42),side==='player'?.7:-6.3,side==='player'?6.3:-.7)}}}let p=sample(b,b.T*.9);return {t:b.T*.9,point:p,x:p.x,z:p.z};}
function netCrossY(b,start){let lo=0,hi=b.T;for(let j=0;j<30;j++){let t=(lo+hi)/2,p=sample(b,t);if((p.z>0)===(start.z>0))lo=t;else hi=t}return sample(b,(lo+hi)/2).y}
function lowArcTime(start,end,clearY,minT=.38,maxT=1.5){let lo=minT,hi=maxT;for(let i=0;i<24;i++){const mid=(lo+hi)/2;if(netCrossY(trajectory(start,end,mid),start)>=clearY)hi=mid;else lo=mid}return hi}
function launch(start,end,side,opt){opt=opt||{};let T=opt.T||2.03;const clearY=opt.clear||1.82;let b;if(opt.arc==='low'){
 T=Math.min(opt.maxT||1.5,lowArcTime(start,end,clearY,opt.minT||.38,opt.maxT||1.5)+(opt.loft||0));b=trajectory(start,end,T);
}else{for(let i=0;i<12;i++){b=trajectory(start,end,T);if(opt.fixedT)break;if(netCrossY(b,start)>clearY)break;T+=.12}}b.side=side;b.intercept=planIntercept(b,side);if(M.active&&side==='ai'){const lc=levelCfg();M.aiMoveAt=S.clock+lc.reaction;b.intercept.x=clamp(b.intercept.x+M.aiNoise,-2.43,2.43)}const recvA=side==='player'?player:opponent;b.travel=Math.hypot(recvA.x-b.intercept.x,recvA.z-b.intercept.z);b.id=S.feeds*1000+S.hits;b.rallyId=M.active?M.rallyId:null;b.previous=start.clone();S.ball=b;S.wait=0;trailPoints.forEach(p=>p.copy(start));opponent.split=side==='ai'?ANIM_TIMING.splitStep:0;player.split=side==='player'?ANIM_TIMING.splitStep:0;}
const SHOTS={standard:{label:'Tiêu chuẩn'},drop:{label:'Drop / Net'},clear:{label:'Clear / Lift'},smash:{label:'Smash / Drive'}};
function setShotType(t){S.shotType=t;refreshAimText();event('Chọn cú: '+SHOTS[t].label)}
function shotFor(side,p,aimLane,inTravel){
  const sgn=side==='player'?-1:1;
  const command=side==='player'?S.mouseShot:null,x=command?command.targetX:aimLane*1.65;
  const trySmash=()=>{if(!(p.y>=2.0&&Math.abs(p.z)<=4.3))return null;const end={x:command?x:aimLane*1.5,z:sgn*(command?command.depth:3.35)},landing=V(end.x,.08,end.z);if(command){const T=lowArcTime(p,landing,1.58,.38,.85),b=trajectory(p,landing,T);return T<=.72&&b.v.y<=0?{end,opt:{T:T+.005,fixedT:true},name:'Smash'}:null}const b=trajectory(p,landing,.5);return netCrossY(b,p)>1.58?{end,opt:{T:.5,fixedT:true},name:'Smash'}:null};
  const drive=()=>p.y<1.62?{end:{x,z:sgn*4.7},opt:{T:1.35,clear:1.58},name:'Lift'}:{end:{x,z:sgn*(command?command.depth:4.7)},opt:command?{arc:'low',clear:1.57,loft:.035}: {T:.85,clear:1.60},name:'Drive'};
  if(side==='player'){
    if(S.shotType==='clear')return{end:{x,z:sgn*(command?command.depth:5.95)},opt:{T:2.03,clear:1.95},name:'Clear'};
    if(S.shotType==='drop')return{end:{x:command?x:aimLane*1.05,z:sgn*(command?command.depth:2.5)},opt:command?{arc:'low',clear:1.58,loft:.065}:{T:1.15,clear:1.58},name:'Drop'};
    if(S.shotType==='smash')return trySmash()||drive();
    return command?drive():{end:{x,z:sgn*4.9},opt:null,name:'Tiêu chuẩn'};
  }
  const pressure=(inTravel||0)>1.9,aggro=M.level==='rookie'?.12:(M.level==='expert'?.32:.22),roll=rnd();
  if(roll<aggro){const sm=trySmash();if(sm)return sm}
  if(pressure)return{end:{x:aimLane*1.65,z:sgn*5.95},opt:{T:2.03,clear:1.95},name:'Clear'};
  if(roll<.30&&player.z>4.55)return{end:{x:aimLane*1.05,z:sgn*2.5},opt:{T:1.15,clear:1.58},name:'Drop'};
  return{end:{x:aimLane*1.65,z:sgn*4.9},opt:null,name:'Tiêu chuẩn'};
}
function feedTarget(){S.feeds++;if(S.drill==='center')return V((rnd()-.5)*.22,.08,4.5);let side=S.feeds%2?1:-1;return V(side*(S.drill==='wide'?1.65:1.25+rnd()*.65),.08,S.drill==='mixed'?2.8+rnd()*2.6:4.5)}
function feed(){let start=V(opponent.x+(opponent.side==='ai'?-.25:.25),1.75,opponent.z+.35);setShot(opponent,start);launch(start,feedTarget(),'player');}
function range(a,p){let face=a.side==='player'?-1:1;let shoulder=V(a.x+(a.side==='player'?.23:-.23),1.42,a.z);let valid=p.y>=.5&&p.y<=2.65&&p.z*(a.side==='player'?1:-1)>.42;let dx=p.x-shoulder.x,dz=p.z-shoulder.z;return valid&&Math.hypot(dx,p.y-shoulder.y,dz)<=1.13&&dz*face>-.65;}
function reachable(a,b){return b&&b.t<b.T&&sample(b,b.t).y>.09&&b.side===a.side&&velocity(b,b.t).y<.4&&range(a,sample(b,b.t))}
// Match contact begins at the planned interception time; avoid hitting at the
// outer edge of reach on the way in. Training retains its original window.
function contactWindow(a,b){return reachable(a,b)&&(!M.active||b.t>=b.intercept.t)}
function aiSwingReady(b){
 if(!contactWindow(opponent,b))return false;
 if(!M.active)return true;
 const p=sample(b,b.t),gap=Math.hypot(p.x-opponent.x,p.z-opponent.z);
 return gap<=CONFIG.contactQuality.cleanGapMax&&p.y>=CONFIG.contactQuality.cleanHeightMin;
}
function intent(){return S.mouseIntent||S.held||S.clock<=S.queuedUntil}
function event(text,seconds=.85){S.event=text;S.eventUntil=S.clock+seconds}
let audioContext;function tone(freq,duration=.04){if(!S.sound)return;try{audioContext=audioContext||new(window.AudioContext||window.webkitAudioContext)();if(audioContext.state==='suspended')audioContext.resume();let o=audioContext.createOscillator(),g=audioContext.createGain();o.type='triangle';o.frequency.setValueAtTime(freq,audioContext.currentTime);o.frequency.exponentialRampToValueAtTime(freq*.6,audioContext.currentTime+duration);g.gain.setValueAtTime(.045,audioContext.currentTime);g.gain.exponentialRampToValueAtTime(.0001,audioContext.currentTime+duration);o.connect(g);g.connect(audioContext.destination);o.start();o.stop(audioContext.currentTime+duration)}catch(e){}}
function setShot(a,point){a.shot={at:S.clock,point:point.clone()};}
function contact(a){
 const b=S.ball;
 if(!b||!contactWindow(a,b)||(M.active&&(M.phase!=='RALLY'||b.rallyId!==M.rallyId)))return false;
 const p=sample(b,b.t);
 setShot(a,p);
 S.lastContact={who:a.side,at:S.clock,point:p.clone()};
 // One measurement, one stored record: quality reads only this contact log.
 S.contacts.push({who:a.side,height:p.y,gap:Math.hypot(p.x-a.x,p.z-a.z),q:Math.hypot(a.x-b.intercept.x,a.z-b.intercept.z),netSide:p.z});
 if(S.contacts.length>1000)S.contacts.shift();
 const recorded=S.contacts[S.contacts.length-1];
 tone(a.side==='player'?860:640);
 showImpact(p,Rules.isCleanContact(recorded.gap,recorded.height));
 if(M.active){
  M.lastHitter=a.side;M.rallyHits++;
  // AI aim is relative to its own view of the net; mirror into world X.
  const lane=a.side==='player'?S.aim:-M.aiAim;
  const sh=shotFor(a.side,p,lane,b.travel);
  a.shot.kind=sh.name;
  const end=Rules.applyStretchedError(sh.end,recorded,lane,a.side);
  recorded.quality=Rules.isCleanContact(recorded.gap,recorded.height)?'clean':'stretched';
  recorded.aim=lane;recorded.target={...end};recorded.rallyId=M.rallyId;
  const stretched=recorded.quality==='stretched';
  S.lastShot=(a.side==='ai'?'AI ':'')+sh.name;
  if(a.side==='player'){
   S.hits++;S.rally++;S.best=Math.max(S.best,S.rally);S.queuedUntil=-1;
   event(stretched?'Cố với · đích cầu bị lệch':'Tiếp xúc sạch · '+sh.name);
   if(S.mouseShot)showShotResult(sh.name,stretched);
   S.shotType='standard';
  }else M.aiShotCount++;
  launch(p,V(end.x,.08,end.z),a.side==='player'?'ai':'player',sh.opt);
  if(a.side==='player'){S.mouseIntent=false;S.mouseShot=null;refreshAimText()}
  return true;
 }
 // Training retains the v0.6 shot choices and v0.3 feed/motor behaviour.
 if(a.side==='player'){
  S.hits++;S.rally++;S.best=Math.max(S.best,S.rally);S.queuedUntil=-1;
  const sh=shotFor('player',p,S.aim,b.travel);a.shot.kind=sh.name;S.lastShot=sh.name;
  event(sh.name==='Tiêu chuẩn'?'Đánh trúng · về vị trí sẵn sàng':'Đánh trúng · '+sh.name);
  launch(p,V(sh.end.x,.08,sh.end.z),'ai',sh.opt);S.mouseIntent=false;S.mouseShot=null;S.shotType='standard';refreshAimText();
 }else launch(p,feedTarget(),'player');
 return true;
}
function drop(reason){if(S.ball?.side==='player')S.drops++;S.rally=0;S.ball=null;S.wait=1.05;S.queuedUntil=-1;S.mouseIntent=false;S.mouseShot=null;event(reason,1.05);tone(170,.1)}
function move(a,tx,tz,dt,manual=false){let dx=tx-a.x,dz=tz-a.z,d=Math.hypot(dx,dz),max=a.side==='ai'?(M.active?levelCfg().speed:5.6):4.65,desired=Math.min(max,d*7),vx=d>.015?dx/d*desired:0,vz=d>.015?dz/d*desired:0;const blend=1-Math.exp(-15*dt);a.vx=lerp(a.vx,vx,blend);a.vz=lerp(a.vz,vz,blend);a.x=clamp(a.x+a.vx*dt,-2.70,2.70);a.z=clamp(a.z+a.vz*dt,a.side==='ai'?-6.35:.58,a.side==='ai'?-.58:6.35);a.speed=Math.hypot(a.vx,a.vz);a.split=Math.max(0,a.split-dt)}
function tick(dt){if(!S.running)return;S.clock+=dt;
 if(M.active&&M.phase==='PRE_SERVE'){M.phaseTimer+=dt;const spots=serveSpots();const pTgt=M.server==='player'?spots.server:spots.receiver,oTgt=M.server==='player'?spots.receiver:spots.server;move(player,pTgt.x,pTgt.z,dt);move(opponent,oTgt.x,oTgt.z,dt);animateFeet(player,dt);animateFeet(opponent,dt);const srvA=M.server==='player'?player:opponent;const settled=Math.hypot(srvA.x-spots.server.x,srvA.z-spots.server.z)<.4;if(M.server==='player'){if(intent()&&M.phaseTimer>.3&&(settled||M.phaseTimer>1.2)){S.held=false;doServe()}}else if((settled&&M.phaseTimer>.85)||M.phaseTimer>1.6){doServe()}return}
 if(M.active&&M.phase==='POINT_END'){move(player,0,4.4,dt);move(opponent,0,-4.4,dt);animateFeet(player,dt);animateFeet(opponent,dt);M.pointTimer-=dt;if(M.pointTimer<=0){if(M.matchOver){showResults()}else if(M.gameEnded){showGameResult()}else{startServeSetup()}}return}
	 let target=S.ball?.side==='player'?S.ball.intercept:{x:0,z:4.4};if(M.active&&S.ball?.side==='player'&&!isInSingles(S.ball.end.x,S.ball.end.z,1))target={x:0,z:4.4};move(player,target.x,target.z,dt);let dest=S.ball?.side==='ai'?S.ball.intercept:{x:0,z:-4.4};if(M.active&&S.ball?.side==='ai'&&(S.ball.t<levelCfg().reaction||!isInSingles(S.ball.end.x,S.ball.end.z,-1)))dest={x:0,z:-4.4};move(opponent,dest.x,dest.z,dt);animateFeet(player,dt);animateFeet(opponent,dt);
 if(!S.ball){if(M.active){startServeSetup();return}S.wait-=dt;if(S.wait<=0)feed();return}let b=S.ball;b.previous.copy(sample(b,b.t));b.t+=dt;let p=sample(b,b.t);
 if(M.active&&((b.side==='player'&&reachable(player,b))||(b.side==='ai'&&reachable(opponent,b))))M.receiverInRange=true;
 if(b.previous.z*p.z<=0&&Math.abs(b.previous.z-p.z)>.00001){let fraction=Math.abs(b.previous.z)/(Math.abs(b.previous.z)+Math.abs(p.z));let h=lerp(b.previous.y,p.y,fraction);if(h<1.55){S.faults++;if(M.active){pointEnd(M.lastHitter==='player'?'ai':'player','NET')}else{drop('Cầu chạm lưới · chuẩn bị lại')}return}}
	 if(b.side==='player'&&intent()&&contactWindow(player,b)){contact(player);return}if(b.side==='ai'&&aiSwingReady(b)&&(!M.active||isInSingles(b.end.x,b.end.z,-1))){contact(opponent);return}if(b.t>=b.T||p.y<=.09){if(M.active){const sideSign=b.side==='player'?1:-1;if(!isInSingles(b.end.x,b.end.z,sideSign)){pointEnd(b.side,'OUT')}else{pointEnd(b.side==='player'?'ai':'player',M.receiverInRange?'WHIFF':'FLOOR_IN')}}else{drop(b.side==='player'?(intent()?'Cầu ngoài tầm với · thử vuốt sớm hơn':'Cầu rơi · vuốt khi cầu đang tới'):'Đối thủ chưa tới kịp · pha mới')}}
}
function animateFeet(a,dt){let moving=a.speed>.15;if(moving)a.phase+=dt*(1.8+a.speed*.25);let sign=a.side==='ai'?-1:1;for(let i=0;i<2;i++){let f=a.feet[i],phase=(a.phase+i*.5)%1,swing=moving&&phase<.48;let rest=V(a.x+sign*(i===0?-.19:.19),.06,a.z+(i===0?.06:-.06));if(swing&&!f.swing){f.from.copy(f.world);f.to.copy(rest).add(V(a.vx*.11,0,a.vz*.11))}if(swing){let u=phase/.48;f.world.copy(f.from).lerp(f.to,u*u*(3-2*u));f.world.y=.06+Math.sin(u*Math.PI)*.12}else if(!moving){f.world.lerp(rest,Math.min(1,dt*8));f.world.y=.06}else if(Math.hypot(f.world.x-a.x,f.world.z-a.z)>.62){f.world.copy(rest)}f.swing=swing;}}
function renderActor(a){
 let group=a.group,shot=a.shot,elapsed=shot?S.clock-shot.at:99,smashing=shot?.kind==='Smash'&&elapsed<ANIM_TIMING.smashFollow;
 let splitT=a.split>0?1-a.split/ANIM_TIMING.splitStep:1;
 let splitHop=a.split>0?Math.sin(Math.PI*clamp((splitT-.16)/.45,0,1))*.075:0;
 let splitLand=a.split>0?smooth01((splitT-.43)/.16)*(1-smooth01((splitT-.82)/.18)):0;
 let splitCrouch=a.split>0?(.025*smooth01(splitT/.18)+.055*splitLand):0;
 let smashLift=smashing ? .11*(1-smooth01(elapsed/.34)) : 0;
 group.position.set(a.x,0,a.z);group.updateMatrixWorld(true);
 let hipY=.91+splitHop+smashLift-splitCrouch,lean=Math.min(.10,a.speed*.013);
 a.torso.position.set(0,hipY+.31,-lean);a.torso.rotation.x=-lean+(smashing ? .10*smooth01(elapsed/.2) : 0);a.torso.rotation.y=smashing ? -.30*smooth01(elapsed/.28) : 0;
 a.pelvis.position.set(0,hipY-.025,0);a.pelvis.rotation.y=smashing ? .18*smooth01(elapsed/.3) : 0;
 a.head.position.set(0,hipY+.84,-lean-.035);a.hair.position.set(0,hipY+.925,-lean-.025);a.capBrim.position.set(0,hipY+.94,-lean-.16);setBone(a.neck,V(0,hipY+.57,-lean),V(0,hipY+.72,-lean));
 for(let i=0;i<2;i++){let leg=a.legs[i],foot=group.worldToLocal(a.feet[i].world.clone());if(a.split>0){foot.x=(i===0?-1:1)*(.19+.15*splitLand);foot.y=.06+splitHop;foot.z=i===0?.055:-.055}if(smashing)foot.y+=smashLift;let hip=V(i===0?-.14:.14,hipY-.06,0),ankle=foot.clone().add(V(0,.05,.04)),knee=bend(hip,ankle,.43,.45,V(0,0,-1));setBone(leg.upper,hip,knee);setBone(leg.lower,knee,ankle);setBone(leg.sock,ankle,ankle.clone().lerp(knee,.3));leg.foot.position.copy(foot);leg.foot.position.z-=.035;}
 let ls=V(-.23,hipY+.54,-lean),rs=V(.23,hipY+.54,-lean),leftHand=V(-.34,hipY+.37,-.32),rightHand=V(.31,hipY+.37,-.28),racketCenter=V(.37,hipY+.61,-.65);
 if(elapsed<ANIM_TIMING.smashFollow){let local=group.worldToLocal(shot.point.clone()),hold=elapsed<.045?0:smooth01((elapsed-.045)/(ANIM_TIMING.smashFollow-.045));let follow=shot.kind==='Smash'?V(-.26,hipY+.43,.12):local.clone().add(V(-.18,-.32,-.20));racketCenter.copy(local).lerp(follow,Math.sin(hold*Math.PI*.5));let fromShoulder=racketCenter.clone().sub(rs).normalize();rightHand.copy(racketCenter).addScaledVector(fromShoulder,-.53);leftHand.set(-.42,hipY+.35,.10)}else if(S.ball?.side===a.side&&S.ball.T-S.ball.t<.9){rightHand.set(.42,hipY+.57,.07);racketCenter.set(.47,hipY+1.07,.1);leftHand.set(-.42,hipY+.43,-.27);
 if(a.side==='ai'||intent()){for(let lead=.008;lead<=.18;lead+=.008){let future=sample(S.ball,S.ball.t+lead);if(velocity(S.ball,S.ball.t+lead).y<.4&&range(a,future)){let local=group.worldToLocal(future),blend=1-lead/.18;racketCenter.lerp(local,blend*blend*(3-2*blend));rightHand.copy(racketCenter).addScaledVector(racketCenter.clone().sub(rs).normalize(),-.53);break}}}}
 let elbowL=bend(ls,leftHand,.31,.30,V(-1,-.3,0)),elbowR=bend(rs,rightHand,.32,.32,V(.5,-.6,.6));[ [ls,elbowL,leftHand],[rs,elbowR,rightHand] ].forEach((p,i)=>{setBone(a.arms[i].upper,p[0],p[1]);setBone(a.arms[i].lower,p[1],p[2]);a.arms[i].hand.position.copy(p[2])});a.racket.position.copy(racketCenter);a.racket.quaternion.setFromUnitVectors(V(0,1,0),racketCenter.clone().sub(rightHand).normalize());
}
function draw(){renderActor(player);renderActor(opponent);let b=S.ball;shuttle.visible=trail.visible=ballShadow.visible=landingRing.visible=standRing.visible=!!b;reachRing.visible=S.running&&b?.side==='player';const preview=aimPreview||S.mouseShot;aimRing.visible=!!(S.running&&preview&&(!M.active||M.phase==='RALLY'));if(aimRing.visible)aimRing.position.set(preview.targetX,.052,-preview.depth);if(b){let p=sample(b,b.t),v=velocity(b,b.t);shuttle.position.copy(p);shuttle.quaternion.setFromUnitVectors(V(0,-1,0),v.normalize());ballShadow.position.set(p.x,.035,p.z);ballShadow.scale.setScalar(1+p.y*.17);landingRing.position.set(b.end.x,.04,b.end.z);standRing.position.set(b.intercept.x,.045,b.intercept.z);standRing.visible=b.side==='player';reachRing.position.set(player.x,.043,player.z);reachRing.material.opacity=reachable(player,b)?.92:.18;for(let i=0;i<trailPoints.length;i++)trailPoints[i].copy(sample(b,Math.max(0,b.t-i*.018)));trailGeo.setFromPoints(trailPoints);}renderer.render(scene,camera);hud();}
function contactHud(){
 const c=S.contacts.at(-1),el=$('contactQuality');
 el.textContent=M.active&&c?.quality?(c.who==='player'?'Bạn':'AI')+' · '+(c.quality==='clean'?'Tiếp xúc sạch':'Cố với · lệch đích'):'Nhân vật đang tự đón cầu';
 el.dataset.quality=M.active&&c?.quality||'waiting';
 $('contactMeasure').textContent=M.active&&c?.quality?'Khoảng cách '+c.gap.toFixed(2)+' m · Độ cao '+c.height.toFixed(2)+' m':'Nhân vật tự di chuyển · vuốt hoặc nhấp để đánh';
}
function hudMatch(){$('rally').textContent=M.rallyHits;$('scoreYou').textContent=M.score.player;$('scoreAi').textContent=M.score.ai;$('serverText').textContent=(M.server==='player'?'Bạn':'Đối thủ')+' · ô '+(M.score[M.server]%2===0?'phải':'trái');$('matchRallies').textContent=M.rallyId;$('matchLongest').textContent=M.longest;$('gamesText').textContent=M.games.player+' – '+M.games.ai;$('boardYou').textContent=M.score.player;$('boardAi').textContent=M.score.ai;
 $('serveYou').classList.toggle('active',M.server==='player');$('serveAi').classList.toggle('active',M.server==='ai');
 $('boardGames').textContent=RULESETS[M.ruleset].label+' · Ván '+M.games.player+'–'+M.games.ai;
 $('pointReason').textContent=M.lastReason||'Bạn giao cầu trước';
 let title='Chuẩn bị',detail='',ready=false;
 if(!S.running){title='Đã tạm dừng';detail='Bấm Tiếp tục để chơi tiếp.'}
 else if(M.phase==='PRE_SERVE'){
  if(M.server==='player'){title='Giao cầu · ô '+(M.score.player%2===0?'phải':'trái');detail='Nhấp hoặc vuốt trên sân để giao cầu.';ready=intent()}
  else{title='Chuẩn bị nhận cầu';detail='AI sắp giao · vuốt khi cầu bay về phía bạn.'}
 }else if(M.phase==='POINT_END'){title=M.lastWinner==='player'?'Bạn ghi điểm ✓':'Đối thủ ghi điểm';detail=M.lastReason+' · Tỉ số '+M.score.player+' – '+M.score.ai}
 else if(S.ball){
  if(S.ball.side==='ai'){title=S.mouseIntent?'Đã chọn cú đánh tiếp theo':'AI đang đón cầu';detail='Nhân vật tự hồi vị. Vuốt để ngắm cú đánh tiếp theo.'}
  else if(!isInSingles(S.ball.end.x,S.ball.end.z,1)){title='Cầu sắp OUT';detail='Không đánh cầu ngoài sân.'}
  else if(reachable(player,S.ball)){ready=true;title=intent()?'Đang đánh trả':'Cầu trong tầm · vuốt ngay';detail='Vuốt lên Clear, xuống Drop/Smash, ngang đổi hướng.'}
  else{title=intent()?'Đã nhận cú đánh':'Cầu đang tới · vuốt để đánh';detail='Nhân vật tự chạy đón. Vòng cam cho biết điểm rơi bạn vừa chọn.'}
 }else{title='Đang đổi điểm';detail='Chuẩn bị pha tiếp theo.'}
 $('cueTitle').textContent=title;$('cueDetail').textContent=detail;$('cue').classList.toggle('ready',ready);$('pause').textContent=S.running?'Tạm dừng':'Tiếp tục'}
function hud(){contactHud();$('pause').disabled=uiMenu||['MATCH_END','GAME_END'].includes(M.phase);$('reset').disabled=uiMenu;if(M.active){hudMatch();return}['hits','drops','best','rally'].forEach(id=>$(id).textContent=S[id]);let total=S.hits+S.drops;$('accuracy').textContent=total?Math.round(S.hits/total*100)+'%':'—';let title='Chuẩn bị nhận cầu',detail='Nhân vật tự đón cầu. Vuốt trên sân để chọn cú đánh.',ready=false;
 if(!S.running){title='Đã tạm dừng';detail='Bấm Tiếp tục để chơi.'}
 else if(!S.ball){title=S.event||'Chuẩn bị cầu tiếp theo';detail='Nhấp hoặc vuốt trên sân khi cầu tới.'}
 else if(S.ball.side==='ai'){title='Đã trả cầu · hồi vị';detail='Vuốt trên sân để chọn cú tiếp theo.'}
 else if(reachable(player,S.ball)){ready=true;title=intent()?'Đang đánh trả':'Cầu trong tầm · vuốt ngay';detail='Chọn hướng bằng nét vuốt.'}
 else if(intent()){title='Đã nhận cú đánh';detail='Nhân vật đang tự tới vị trí đón.'}
 else{title='Cầu đang tới · vuốt để đánh';detail='Nhân vật tự di chuyển. Nét vuốt quyết định hướng và kiểu cú đánh.'}
 $('cueTitle').textContent=title;$('cueDetail').textContent=detail;$('cue').classList.toggle('ready',ready);$('pause').textContent=S.running?'Tạm dừng':'Tiếp tục';}
function setRunning(value){S.running=value;S.started=S.started||value;S.keys.clear();S.held=false;S.queuedUntil=-1;S.mouseIntent=false;S.mouseShot=null;$('overlay').hidden=value;$('matchOptions').hidden=!uiMenu;if(!value&&!uiMenu&&M.phase!=='MATCH_END'){$('eyebrow').textContent='TẠM DỪNG';$('welcomeTitle').textContent='Trở lại sân đấu.';$('intro').textContent='Pha cầu và đồng hồ đang dừng. Bấm Tiếp tục để chơi tiếp.';$('begin').textContent=M.active?'Tiếp tục trận':'Tiếp tục tập';$('beginMatch').style.display='none';$('rematchBtn').style.display='none';$('begin').style.display=''}if(value)$('view').focus();}
let uiMenu=true;
function showMenuOverlay(){uiMenu=true;M.phase=M.active?M.phase:'MENU';$('eyebrow').textContent='CHỌN CHẾ ĐỘ CHƠI';$('welcomeTitle').innerHTML='Làm chủ sân đấu.<br><em>Từng pha cầu.</em>';$('intro').textContent='Nhân vật tự chạy đón cầu. Nhấp hoặc vuốt trực tiếp trên sân để đánh, chọn cú và điểm rơi. Chọn luật, AI rồi bấm ĐẤU NHANH; Training giúp làm quen.';$('beginMatch').style.display='';$('rematchBtn').style.display='none';$('begin').style.display='';$('begin').textContent='Vào sân tập (Training)';setRunning(false);$('overlay').hidden=false}
function startTraining(){uiMenu=false;M.active=false;M.phase='MENU';S.mode='training';S.pace=+$('pace').value;$('matchPanel').hidden=true;$('trainStats').style.display='';$('drillFields').style.display='';$('scoreBoard').style.display='none';$('modeBadge').textContent='TRAINING · AIM ASSIST';$('modeTag').textContent='SÂN TẬP / 01';$('reset').textContent='Tập lại';reset()}
function startMatch(rsSel,lvSel){uiMenu=false;const rs=rsSel||($('rulesetSel')?$('rulesetSel').value:'arcade11');const lv=lvSel||($('aiSel')?$('aiSel').value:'inter');reset();S.mode='match';S.pace=1;Object.assign(M,{active:true,phase:'PRE_SERVE',server:'player',rallyId:0,pointDoneFor:-1,pointTimer:0,phaseTimer:0,matchOver:false,gameEnded:false,gameWinner:'',ruleset:RULESETS[rs]?rs:'arcade11',level:AI_LEVELS[lv]?lv:'inter',totalRallies:0,rallyHits:0,longest:0,lastReason:'',lastWinner:'',aiMoveAt:0,aiShotCount:0,receiverInRange:false,lastHitter:'player',noiseRallyId:-1,aiNoise:0,aiAim:0,aiAimStart:Math.floor(rnd()*3),pointLog:[],lastReasonCode:''});M.score.player=0;M.score.ai=0;M.games.player=0;M.games.ai=0;$('matchPanel').hidden=false;$('trainStats').style.display='none';$('drillFields').style.display='none';$('scoreBoard').style.display='';$('rulesetText').textContent=RULESETS[M.ruleset].label+' · AI '+levelCfg().label;$('modeBadge').textContent='QUICK MATCH · '+RULESETS[M.ruleset].label.toUpperCase();$('modeTag').textContent='ĐẤU NHANH / 02';$('matchHeading').textContent='TRẬN ĐẤU · '+RULESETS[M.ruleset].label.toUpperCase();$('rulesDescription').textContent=M.ruleset==='arcade11'?CONFIG.rulesetDesc:'Thắng 2 trong 3 ván · bản thử arcade, chưa mô phỏng đầy đủ luật BWF';$('reset').textContent='Đấu lại';saveSettings();startServeSetup();event('Trận đấu bắt đầu · Bạn giao cầu trước',1.4)}
function nextGame(){uiMenu=false;M.score.player=0;M.score.ai=0;M.gameEnded=false;M.server=M.gameWinner||'player';M.rallyHits=0;S.ball=null;[player,opponent].forEach(a=>{Object.assign(a,{x:0,z:a.side==='player'?4.5:-4.5,vx:0,vz:0,phase:0,shot:null,split:0,speed:0});resetFeet(a)});setRunning(true);startServeSetup();event('Ván mới · '+(M.server==='player'?'Bạn':'Đối thủ')+' giao cầu trước',1.4)}
function showGameResult(){M.phase='GAME_END';setRunning(false);uiMenu=false;const gw=M.gameWinner;$('eyebrow').textContent='KẾT QUẢ VÁN · '+RULESETS[M.ruleset].label.toUpperCase();$('welcomeTitle').textContent=(gw==='player'?'Bạn thắng ván ':'AI thắng ván ')+M.score.player+' – '+M.score.ai;$('intro').textContent='Tổng ván đang là Bạn '+M.games.player+' – '+M.games.ai+' AI (cần thắng '+RULESETS[M.ruleset].games+' ván). '+(gw==='player'?'Bạn':'AI')+' sẽ giao cầu trước ở ván tiếp theo.';$('beginMatch').style.display='none';$('rematchBtn').style.display='';$('rematchBtn').textContent='Vào ván tiếp theo';$('begin').style.display='';$('begin').textContent='Về Luyện tập';$('overlay').hidden=false}
function showResults(){M.phase='MATCH_END';setRunning(false);uiMenu=false;$('eyebrow').textContent='KẾT QUẢ TRẬN ĐẤU · '+RULESETS[M.ruleset].label.toUpperCase();$('welcomeTitle').textContent=(M.games.player>M.games.ai?'Thắng trận rồi! ':'Thua trận ')+M.games.player+' – '+M.games.ai+' ván';$('intro').textContent='Ván cuối '+M.score.player+' – '+M.score.ai+' · Tổng '+M.rallyId+' pha cầu · Rally dài nhất '+M.longest+' cú đánh · '+(M.games.player>M.games.ai?'Chơi đẹp lắm. Đấu lại để giữ phong độ, hoặc về Luyện tập xả hơi.':'Suýt soát thôi. Đấu lại ngay cho nóng, hoặc về Luyện tập chỉnh lại nhịp đón cầu.');$('beginMatch').style.display='none';$('rematchBtn').style.display='';$('rematchBtn').textContent='Đấu lại (Rematch)';$('begin').style.display='';$('begin').textContent='Về Luyện tập';$('overlay').hidden=false}
function reset(){S.running=false;Object.assign(S,{clock:0,ball:null,wait:.65,hits:0,drops:0,rally:0,best:0,held:false,queuedUntil:-1,mouseIntent:false,mouseShot:null,seed:73,feeds:0,lastContact:null,lastGesture:null,event:'',eventUntil:0,contacts:[],faults:0,shotType:'standard',lastShot:''});S.keys.clear();[player,opponent].forEach(a=>{Object.assign(a,{x:0,z:a.side==='player'?4.5:-4.5,vx:0,vz:0,phase:0,shot:null,split:0,speed:0});resetFeet(a)});setRunning(true);refreshAimText()}
function refreshAimText(){const aimName=S.aim<0?'Trái':(S.aim>0?'Phải':'Giữa'),command=S.mouseShot;$('aimText').textContent=command?'Cú '+SHOTS[S.shotType].label.split(' · ')[0]+' · '+aimName+' · đích '+Math.abs(command.depth).toFixed(1)+' m':'Vuốt trên sân để chọn hướng và điểm rơi'}
function aim(value){S.aim=value;document.querySelectorAll('[data-aim]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.aim===value)));refreshAimText()}
$('begin').onclick=()=>{if(uiMenu||M.phase==='MATCH_END'||M.phase==='GAME_END'){startTraining()}else{setRunning(true)}};$('beginMatch').onclick=()=>startMatch();$('rematchBtn').onclick=()=>{if(M.phase==='GAME_END'){nextGame()}else{startMatch()}};$('modeBtn').onclick=()=>{showMenuOverlay()};$('pause').onclick=()=>{if(!uiMenu&&!['MATCH_END','GAME_END'].includes(M.phase))setRunning(!S.running)};$('reset').onclick=()=>{if(M.active){startMatch()}else{reset()}};$('assist').onchange=e=>{S.assist=e.target.checked;saveSettings();$('view').focus()};$('drill').onchange=e=>{S.drill=e.target.value;saveSettings();$('view').focus()};$('pace').onchange=e=>{S.pace=+e.target.value;saveSettings();$('view').focus()};$('rulesetSel').onchange=saveSettings;$('aiSel').onchange=saveSettings;document.querySelectorAll('[data-aim]').forEach(b=>b.onclick=()=>aim(+b.dataset.aim));$('audio').onclick=()=>{S.sound=!S.sound;$('audio').textContent='Âm thanh: '+(S.sound?'bật':'tắt');$('audio').setAttribute('aria-pressed',String(S.sound));saveSettings();tone(600)};$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch(e){event('Trình duyệt chưa cho phép toàn màn hình')}};
function arm(){if(uiMenu||['MATCH_END','GAME_END'].includes(M.phase))return;if(!S.running)setRunning(true);S.mouseIntent=true;S.queuedUntil=S.clock+.85}
$('touchhit').addEventListener('pointerdown',e=>{e.preventDefault();$('touchhit').setPointerCapture(e.pointerId);arm()});['pointerup','pointercancel','lostpointercapture'].forEach(type=>$('touchhit').addEventListener(type,()=>S.held=false));
// Pointer swipe is an input adapter only. Contact/range/physics remain authoritative.
const arena=document.querySelector('.arena'),swipeTrail=document.createElement('div'),gestureFeedback=document.createElement('div'),swipeHint=document.createElement('div'),impactFlash=document.createElement('div');
swipeTrail.id='swipeTrail';swipeTrail.className='swipe-trail';gestureFeedback.id='gestureFeedback';gestureFeedback.className='gesture-feedback';gestureFeedback.setAttribute('aria-live','polite');swipeHint.id='swipeHint';swipeHint.className='swipe-hint';swipeHint.innerHTML='<b>CHƠI BẰNG CHUỘT</b><span>Nhấp đánh · vuốt lên sâu · xuống nhẹ ngắn · xuống dài mạnh</span>';impactFlash.id='impactFlash';impactFlash.className='impact-flash';arena.append(swipeTrail,gestureFeedback,swipeHint,impactFlash);
let pointerGesture=null,aimPreview=null;
function pointInArena(e){const r=arena.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}}
function drawSwipe(from,to){const dx=to.x-from.x,dy=to.y-from.y;swipeTrail.style.left=from.x+'px';swipeTrail.style.top=from.y+'px';swipeTrail.style.width=Math.hypot(dx,dy)+'px';swipeTrail.style.transform='rotate('+Math.atan2(dy,dx)+'rad)';swipeTrail.classList.add('active')}
function clearSwipe(){pointerGesture=null;aimPreview=null;swipeTrail.classList.remove('active')}
function showGesture(result){const lane=result.aim<0?'TRÁI':(result.aim>0?'PHẢI':'GIỮA'),name={standard:'ĐÁNH',drop:'DROP',clear:'CLEAR',smash:'SMASH'}[result.shot];gestureFeedback.textContent=name+' · '+lane;gestureFeedback.dataset.shot=result.shot;gestureFeedback.classList.remove('show');swipeHint.classList.add('learned');void gestureFeedback.offsetWidth;gestureFeedback.classList.add('show')}
function showShotResult(name,stretched){gestureFeedback.textContent=stretched?'CỐ VỚI · LỆCH ĐÍCH':name.toUpperCase()+' · ĐÚNG ĐÍCH';gestureFeedback.dataset.shot=stretched?'drop':name.toLowerCase();gestureFeedback.classList.remove('show');void gestureFeedback.offsetWidth;gestureFeedback.classList.add('show')}
function showRallyFeedback(message,kind){gestureFeedback.textContent=message;gestureFeedback.dataset.shot=kind;gestureFeedback.classList.remove('show');void gestureFeedback.offsetWidth;gestureFeedback.classList.add('show')}
function showImpact(worldPoint,clean){const p=worldPoint.clone().project(camera),r=arena.getBoundingClientRect();impactFlash.style.left=(p.x*.5+.5)*r.width+'px';impactFlash.style.top=(-p.y*.5+.5)*r.height+'px';impactFlash.dataset.quality=clean?'clean':'stretched';impactFlash.classList.remove('show');void impactFlash.offsetWidth;impactFlash.classList.add('show')}
$('view').addEventListener('pointerdown',e=>{if(!S.running||uiMenu||['MATCH_END','GAME_END'].includes(M.phase))return;e.preventDefault();const p=pointInArena(e);pointerGesture={id:e.pointerId,start:p,last:p,at:performance.now()};$('view').setPointerCapture(e.pointerId);drawSwipe(p,p)});
$('view').addEventListener('pointermove',e=>{if(!pointerGesture||e.pointerId!==pointerGesture.id)return;e.preventDefault();pointerGesture.last=pointInArena(e);aimPreview=classifySwipe(pointerGesture.last.x-pointerGesture.start.x,pointerGesture.last.y-pointerGesture.start.y,performance.now()-pointerGesture.at);drawSwipe(pointerGesture.start,pointerGesture.last)});
$('view').addEventListener('pointerup',e=>{if(!pointerGesture||e.pointerId!==pointerGesture.id)return;e.preventDefault();const g=pointerGesture,end=pointInArena(e),swipe=classifySwipe(end.x-g.start.x,end.y-g.start.y,performance.now()-g.at);clearSwipe();const clickX=clamp((end.x/arena.clientWidth-.5)*4.6,-2.3,2.3);const result=swipe||{aim:clickX<-.45?-1:clickX>.45?1:0,shot:'standard',targetX:clickX,depth:4.8,power:.5,speed:0,distance:0};S.lastGesture=result;S.mouseShot=result;aim(result.aim);setShotType(result.shot);arm();showGesture(result)});
$('view').addEventListener('pointercancel',clearSwipe);$('view').addEventListener('lostpointercapture',()=>{if(pointerGesture)clearSwipe()});
window.addEventListener('keydown',e=>{if(e.code==='Escape'&&!uiMenu&&!['MATCH_END','GAME_END'].includes(M.phase)){e.preventDefault();setRunning(!S.running)}});
document.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{b.blur()}));window.addEventListener('blur',()=>{if(S.running)setRunning(false)});document.addEventListener('visibilitychange',()=>{if(document.hidden&&S.running)setRunning(false)});
function resize(){let r=$('view').getBoundingClientRect();camera.aspect=r.width/r.height;camera.updateProjectionMatrix();renderer.setSize(r.width,r.height,false)}window.addEventListener('resize',resize);resize();
let previous=performance.now(),acc=0;function frame(now){let dt=Math.min(.1,(now-previous)/1000);previous=now;if(S.running&&!(location.hash==='#qa'&&new URLSearchParams(location.search).has('manual'))){acc+=dt*S.pace;while(acc>=FIXED){tick(FIXED);acc-=FIXED}}else acc=0;draw();requestAnimationFrame(frame)}requestAnimationFrame(frame);
// Deterministic QA hook is opt-in. It never runs in ordinary play.
if(location.hash==='#qa')window.__rally={state:S,match:M,config:CONFIG,inputConfig:INPUT_CONFIG,animTiming:ANIM_TIMING,rules:{winsMatch,winsGame,serveSideSign,isInSingles,applyStretchedError:Rules.applyStretchedError,isCleanContact:Rules.isCleanContact,RULESETS,AI_LEVELS},player,opponent,reset,tick,draw,move,renderActor,levelCfg,setupAiForRally,trajectory,V,aim,sample,range,reachable,contactWindow,launch,contact,feed,renderer,camera,scene,advance(seconds){for(let t=0;t<seconds;t+=FIXED)tick(FIXED)},setRunning,arm,startMatch,startTraining,nextGame,pointEnd,doServe,SHOTS,shotFor,setShotType,classifySwipe,netCrossY};
})();
