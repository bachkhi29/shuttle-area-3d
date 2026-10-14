"""Chromium/WebGL integration + mouse-only scenarios; no third-party services.
Run: python test/browser.py (requires Python playwright and Chromium).
Fixtures place the initial rally only; scoring always runs through the game tick.
"""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from threading import Thread
import json, os, traceback
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
OUT=Path(os.environ.get('QA_OUTPUT',str(ROOT/'work/qa')));OUT.mkdir(parents=True,exist_ok=True)
class Handler(SimpleHTTPRequestHandler):
 def log_message(self,*args): pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Handler,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
BASE=f'http://127.0.0.1:{server.server_port}'
results=[];errors=[]
def check(name,fn):
 try:
  evidence=fn();results.append({'name':name,'status':'PASS','evidence':evidence});print('PASS',name,flush=True)
 except Exception as e:
  results.append({'name':name,'status':'FAIL','error':str(e)});print('FAIL',name,str(e),flush=True);traceback.print_exc()
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=os.environ.get('CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 context=browser.new_context(viewport={'width':1440,'height':1050})
 # Deterministic stepping instead of racing requestAnimationFrame.
 context.add_init_script('window.requestAnimationFrame=()=>0')
 page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(BASE+'/shuttle-arena/index.html#qa');page.wait_for_function('!!window.__rally')
 def run(js):return page.evaluate(js)
 def fresh():
  run("()=>{const q=__rally;q.startMatch('arcade11','inter');q.state.assist=true;q.state.aim=0;q.state.shotType='standard';q.state.keys.clear();q.state.held=false;q.draw()}")
 def menu():
  assert page.title().startswith('Shuttle Arena 3D');run('__rally.draw()');page.screenshot(path=str(OUT/'menu.png'))
  page.locator('#beginMatch').click();assert run('__rally.match.active');assert page.locator('#matchOptions').is_hidden()
 check('Menu starts accepted v0.6 runtime with local assets',menu)
 def swipe_classifier():
  r=run('''()=>{const q=__rally;return{short:q.classifySwipe(10,4,100),up:q.classifySwipe(50,-110,140),fastDown:q.classifySwipe(-55,120,120),held:q.classifySwipe(0,60,420),flat:q.classifySwipe(90,5,130)}}''')
  assert r['short'] is None
  assert (r['up']['aim'],r['up']['shot'])==(1,'clear')
  assert (r['fastDown']['aim'],r['fastDown']['shot'])==(-1,'smash')
  assert r['held']['aim']==0 and r['held']['shot']=='drop'
  assert r['flat']['aim']==1 and r['flat']['shot']=='standard'
  return r
 check('Swipe classifier maps dead-zone, lane, direction and hold deterministically',swipe_classifier)
 def pointer_swipe():
  fresh();box=page.locator('#view').bounding_box();sx=box['x']+box['width']*.45;sy=box['y']+box['height']*.62
  page.mouse.move(sx,sy);page.mouse.down();page.mouse.move(sx+85,sy-120,steps=5);page.mouse.up()
  r=run("({aim:__rally.state.aim,shot:__rally.state.shotType,queued:__rally.state.queuedUntil>__rally.state.clock,gesture:__rally.state.lastGesture,feedback:document.getElementById('gestureFeedback').textContent})")
  assert r['aim']==1 and r['shot']=='clear' and r['queued']
  assert r['gesture']['aim']==1 and r['gesture']['shot']=='clear' and r['feedback']=='CLEAR · PHẢI'
  return r
 check('Real canvas pointer swipe creates one queued ShotCommand through the normal resolver',pointer_swipe)
 def mouse_play():
  fresh();box=page.locator('#view').bounding_box();cx=box['x']+box['width']*.5;cy=box['y']+box['height']*.53
  page.mouse.click(cx,cy);run('__rally.advance(1.3)')
  serve=run('({phase:__rally.match.phase,side:__rally.state.ball?.side,last:__rally.match.lastHitter})')
  assert serve=={'phase':'RALLY','side':'ai','last':'player'}
  fresh();run("()=>{const q=__rally;q.match.phase='RALLY';q.match.lastHitter='ai';q.launch(q.V(0,1.75,-4.5),q.V(0,.08,4.5),'player')}")
  page.mouse.move(cx,cy);page.mouse.down();page.mouse.move(cx+70,cy+105,steps=6);page.mouse.up()
  planned=run('({x:__rally.state.mouseShot.targetX,depth:__rally.state.mouseShot.depth,shot:__rally.state.shotType})')
  assert planned['shot']=='smash' and 1<planned['x']<1.3
  run("()=>{const q=__rally;for(let i=0;i<360&&!q.state.contacts.length;i++)q.tick(1/120)}")
  result=run('({contacts:__rally.state.contacts,shot:__rally.state.lastShot,ball:__rally.state.ball&&{T:__rally.state.ball.T,vy:__rally.state.ball.v.y,startY:__rally.state.ball.start.y,endX:__rally.state.ball.end.x,net:__rally.netCrossY(__rally.state.ball,__rally.state.ball.start)}})')
  assert result['contacts'] and result['contacts'][0]['who']=='player'
  assert abs(result['contacts'][0]['target']['x']-planned['x'])<.001
  assert abs(result['contacts'][0]['target']['z']+planned['depth'])<.001
  assert result['shot'] in ['Smash','Drive','Lift']
  assert result['ball'] and result['ball']['net']>=1.55 and result['ball']['vy']<3
  return {'serve':serve,'planned':planned,'contact':result['contacts'][0],'shot':result['shot'],'flight':result['ball']}
 check('Mouse click serves; down-right swipe aims continuously and resolves through real contact',mouse_play)
 def config():
  fresh();c=run('__rally.config.match');assert c=={'interceptHeight':2.1,'errorOffset':{'side':1.1,'deep':2},'ai':{'speedCap':4.65,'reactionDelay':.22,'interceptNoise':.18}}
  return c
 check('Spec constants CONFIG.match',config)
 def motion_contract():
  fresh();r=run('''()=>{const q=__rally;q.state.running=false;q.launch(q.V(0,1.75,-4.5),q.V(0,.08,4.5),'player');const start=q.player.split;q.player.split=q.animTiming.splitStep*.45;q.renderActor(q.player);const split={start,footSpan:Math.abs(q.player.legs[1].foot.position.x-q.player.legs[0].foot.position.x),hip:q.player.pelvis.position.y};q.state.clock=10;q.player.split=0;q.player.shot={at:9.95,point:q.V(.45,2.25,4.12),kind:'Smash'};q.renderActor(q.player);return{split,smash:{racketY:q.player.racket.position.y,footY:q.player.legs.map(x=>x.foot.position.y),torsoYaw:q.player.torso.rotation.y}}}''')
  assert r['split']['start']==.66 and r['split']['footSpan']>.60 and r['split']['hip']<.88
  assert r['smash']['racketY']>2.20 and min(r['smash']['footY'])>.14 and r['smash']['torsoYaw']<0
  return r
 check('M1 motion contract: split-step landing and overhead smash contact pose',motion_contract)
 def rally():
  fresh();run("()=>{const q=__rally;for(let i=0;i<24*120;i++){q.state.held=true;q.tick(1/120)}q.draw()}")
  c=run('__rally.state.contacts');assert len(c)>=8;assert all(x['quality']=='clean' for x in c)
  assert {x['who'] for x in c}=={'ai','player'}
  for x in c:assert x['gap']<=.7 and x['height']>=.9
  page.screenshot(path=str(OUT/'rally.png'));return {'contacts':len(c),'first':c[0]}
 check('Assisted footwork produces clean extended rallies for both actors',rally)
 def ai_attack_rallies(shot):
  fresh();r=page.evaluate('''shot=>{const q=__rally,m=q.match,s=q.state;let aiOut=0,aiHits=0,stretched=0;for(let i=0;i<120*90;i++){s.held=true;s.shotType=shot;const before=m.pointLog.length;q.tick(1/120);if(m.pointLog.length>before){const p=m.pointLog.at(-1);if(p.reason==='OUT'&&p.hitter==='ai')aiOut++}}for(const c of s.contacts)if(c.who==='ai'){aiHits++;if(c.quality==='stretched')stretched++}return{aiOut,aiHits,stretched,rallies:m.totalRallies}}''',shot)
  assert r['aiHits']>=12 and r['aiOut']==0 and r['stretched']==0
  return r
 for shot in ['drop','smash']:check(f'AI returns {shot} exchanges without repeated stretched OUT faults',lambda shot=shot:ai_attack_rallies(shot))
 def reaction():
  fresh();r=run('''()=>{const q=__rally,m=q.match,s=q.state,o=q.opponent;m.phase='RALLY';m.lastHitter='player';Object.assign(o,{x:0,z:-4.4,vx:0,vz:0});q.launch(q.V(0,1.75,4.4),q.V(1.65,.08,-4.9),'ai');const noise=m.aiNoise;for(let i=0;i<27;i++)q.tick(1/120);const before={x:o.x,z:o.z};q.tick(1/120);return {before,after:{x:o.x,z:o.z},noise,seed:s.seed}}''')
  assert abs(r['before']['x'])<1e-12 and r['before']['z']==-4.4
  assert r['after']['x']>0
  return r
 check('AI waits 0.22 simulated seconds before pursuing interception',reaction)
 def noise():
  js='''()=>{const q=__rally;q.startMatch();let out=[];for(let i=0;i<12;i++){q.match.phase='RALLY';const n=q.match.aiNoise,a=q.match.aiAim;let xs=[];for(let j=0;j<3;j++){q.launch(q.V(0,1.75,4.4),q.V(1,.08,-4.9),'ai');xs.push(q.state.ball.intercept.x)}out.push({id:q.match.rallyId,n,a,xs});q.pointEnd(i%2?'player':'ai','OUT');q.advance(1.21)}return out}'''
  a=run(js);b=run(js);assert a==b
  for x in a:assert abs(x['n'])<=.18 and len(set(x['xs']))==1
  for i in range(1,len(a)):assert a[i]['a']!=a[i-1]['a']
  assert {x['a'] for x in a[:3]}=={-1,0,1}
  return a[:3]
 check('Seeded noise stable per rally; replayable; aim cycles by rallyId',noise)
 def speeds():
  r=run('''()=>{const q=__rally;function measure(a){Object.assign(a,{x:0,z:a.side==='ai'?-4.4:4.4,vx:0,vz:0});let max=0,jump=0;for(let i=0;i<600;i++){let x=a.x,z=a.z;q.move(a,i<300?100:-100,a.z,1/120);max=Math.max(max,a.speed);jump=Math.max(jump,Math.hypot(a.x-x,a.z-z))}return {max,jump}}q.startMatch();let player=measure(q.player),ai=measure(q.opponent);q.startTraining();let training=measure(q.opponent);return{player,ai,training}}''')
  for key in ['player','ai']:assert 4.64<r[key]['max']<=4.650000001 and r[key]['jump']<=4.65/120+1e-9
  assert 5.59<r['training']['max']<=5.600000001
  return r
 check('Shared motor caps: player/Match AI 4.65; Training AI 5.6; no teleport',speeds)
 def invalid_contact():
  fresh();r=run('''()=>{const q=__rally,m=q.match,s=q.state;m.phase='RALLY';m.lastHitter='player';q.launch(q.V(0,1.75,4.4),q.V(0,.08,-4.9),'ai');const b=s.ball;let out=[];out.push(q.contact(q.player));Object.assign(q.opponent,{x:2.7,z:-.58});b.t=b.intercept.t;out.push(q.contact(q.opponent));b.t=b.T;out.push(q.contact(q.opponent));s.ball=null;out.push(q.contact(q.opponent));return {out,count:s.contacts.length}}''')
  assert r=={'out':[False]*4,'count':0};return r
 check('Shared resolver rejects wrong side, out of reach, grounded and absent shuttle',invalid_contact)
 def late_out(aim):
  fresh();accepted=page.evaluate('''a=>{const q=__rally;q.match.phase='RALLY';q.match.lastHitter='ai';q.aim(a);q.state.shotType='standard';q.launch(q.V(0,1.75,-4.5),q.V(0,.08,4.5),'player');const b=q.state.ball;b.t=b.intercept.t;const p=q.sample(b,b.t);Object.assign(q.player,{x:p.x-.8,z:p.z,vx:0,vz:0});return q.contact(q.player)}''',aim)
  assert accepted
  c=run('__rally.state.contacts.at(-1)');assert c['who']=='player' and c['quality']=='stretched';assert c['height']<.9 or c['gap']>.7
  assert c['target']=={'x':aim*2.75 if aim else 0,'z':-4.9 if aim else -6.9}
  run('''()=>{const q=__rally;for(let i=0;i<500&&q.match.phase==='RALLY';i++)q.tick(1/120);q.draw()}''')
  r=run('({score:__rally.match.score,reason:__rally.match.lastReason,text:document.getElementById("cueDetail").textContent})')
  assert r['score']=={'player':0,'ai':1};assert r['reason']=='Cầu ngoài sân';assert 'Cầu ngoài sân' in r['text']
  page.screenshot(path=str(OUT/f'out-{aim}.png'));return {'contact':c,**r}
 for a in [-1,0,1]:check(f'7.3 scenario 2: stretched contact, aim {a}, OUT to AI',lambda a=a:late_out(a))
 def ai_stretch():
  fresh();r=run('''()=>{const q=__rally,m=q.match;m.phase='RALLY';m.lastHitter='player';q.launch(q.V(0,1.75,4.5),q.V(0,.08,-4.5),'ai');const b=q.state.ball;b.t=b.intercept.t;const p=q.sample(b,b.t);Object.assign(q.opponent,{x:p.x+.8,z:p.z,vx:0,vz:0});const accepted=q.contact(q.opponent);const c=q.state.contacts.at(-1);q.state.assist=false;Object.assign(q.player,{x:-2.7,z:.58,vx:0,vz:0});q.state.keys.clear();q.state.held=false;for(let i=0;i<500&&m.phase==='RALLY';i++)q.tick(1/120);return{accepted,c,score:m.score,reason:m.lastReason}}''')
  assert r['accepted'];assert r['c']['quality']=='stretched';assert r['score']=={'player':1,'ai':0};assert r['reason']=='Cầu ngoài sân';return r
 check('Symmetric AI stretched contact loses OUT point',ai_stretch)
 def net(who):
  fresh();r=page.evaluate("""who=>{const q=__rally,m=q.match;m.phase='RALLY';m.lastHitter=who;const z=who==='player'?1:-1;q.launch(q.V(0,.7,z),q.V(0,.08,-z),who==='player'?'ai':'player',{T:.2,fixedT:true});for(let i=0;i<80&&m.phase==='RALLY';i++)q.tick(1/120);q.draw();return{score:m.score,reason:m.lastReason,code:m.lastReasonCode,hud:document.getElementById('cueDetail').textContent}}""",who)
  assert r['code']=='NET' and r['reason']=='Cầu chạm lưới' and 'Cầu chạm lưới' in r['hud']
  assert r['score']==({'player':0,'ai':1} if who=='player' else {'player':1,'ai':0})
  page.screenshot(path=str(OUT/f'net-{who}.png'));return r
 for who in ['player','ai']:check(f'7.3 scenario 3: low trajectory into net from {who}',lambda who=who:net(who))
 def pause():
  fresh();run('()=>{const q=__rally;q.arm();q.advance(1)}');page.locator('#pause').click()
  before=run('({clock:__rally.state.clock,t:__rally.state.ball.t,score:{...__rally.match.score}})');run('__rally.advance(3)');assert before==run('({clock:__rally.state.clock,t:__rally.state.ball.t,score:{...__rally.match.score}})')
  page.locator('#begin').click();run('__rally.advance(.1)');assert run('__rally.state.clock')>before['clock']
  run("window.dispatchEvent(new Event('blur'))");assert not run('__rally.state.running')
 check('Pause/resume and blur freeze simulation and timers',pause)
 def duplicate():
  fresh();r=run('''()=>{const q=__rally,m=q.match;m.phase='RALLY';const old=m.rallyId;q.pointEnd('player','FLOOR_IN',old);q.pointEnd('player','FLOOR_IN',old);q.advance(1.21);m.phase='RALLY';q.pointEnd('ai','NET',old);return{score:m.score,log:m.pointLog.length}}''');assert r=={'score':{'player':1,'ai':0},'log':1}
 check('Duplicate and delayed rally terminal events cannot score twice',duplicate)
 def all_reasons():
  cases=[
   ('FLOOR_IN','player','player',False),
   ('FLOOR_IN','ai','ai',False),
   ('WHIFF','player','player',True),
   ('WHIFF','ai','ai',True),
  ]
  output=[]
  for reason,last_hitter,winner,receiver_seen in cases:
   fresh();result=page.evaluate("""c=>{const q=__rally,m=q.match;m.phase='RALLY';m.lastHitter=c.lastHitter;const receiveSide=c.lastHitter==='player'?'ai':'player';const z=receiveSide==='player'?4.5:-4.5;const startZ=receiveSide==='player'?.8:-.8;q.launch(q.V(0,.7,startZ),q.V(0,.08,z),receiveSide,{T:.2,fixedT:true});m.receiverInRange=c.receiverSeen;q.state.assist=false;Object.assign(receiveSide==='player'?q.player:q.opponent,{x:2.7,z:receiveSide==='player'?.58:-.58,vx:0,vz:0});for(let i=0;i<80&&m.phase==='RALLY';i++)q.tick(1/120);return{code:m.lastReasonCode,text:m.lastReason,winner:m.lastWinner,score:{...m.score}}}""",{'lastHitter':last_hitter,'receiverSeen':receiver_seen})
   assert result['code']==reason and result['winner']==winner
   assert result['text']==('Cầu rơi trong sân' if reason=='FLOOR_IN' else 'Không đón kịp cầu')
   output.append(result)
  return output
 check('FLOOR_IN and WHIFF reasons use exact text and award the last hitter',all_reasons)
 def serve_rotation():
  fresh();r=run('''()=>{const q=__rally,m=q.match,out=[];function snap(label){q.advance(m.server==='player'?1.6:.75);out.push({label,server:m.server,score:{...m.score},player:{x:q.player.x,z:q.player.z},ai:{x:q.opponent.x,z:q.opponent.z},phase:m.phase})}snap('player-even');m.phase='RALLY';m.lastHitter='ai';q.pointEnd('ai','FLOOR_IN');q.advance(1.21);snap('ai-odd');m.phase='RALLY';m.lastHitter='ai';q.pointEnd('ai','FLOOR_IN');q.advance(1.21);snap('ai-even');m.phase='RALLY';m.lastHitter='player';q.pointEnd('player','FLOOR_IN');q.advance(1.21);snap('player-odd');return out}''')
  expected=[
   ('player-even','player',1.30,5.0,-1.30,-4.5),
   ('ai-odd','ai',-1.30,4.5,1.30,-5.0),
   ('ai-even','ai',1.30,4.5,-1.30,-5.0),
   ('player-odd','player',-1.30,5.0,1.30,-4.5),
  ]
  for item,e in zip(r,expected):
   assert item['label']==e[0] and item['server']==e[1]
   assert item['phase']=='PRE_SERVE'
   assert abs(item['player']['x']-e[2])<.05 and abs(item['player']['z']-e[3])<.05
   assert abs(item['ai']['x']-e[4])<.05 and abs(item['ai']['z']-e[5])<.05
  return r
 check('7.3 scenario 4: rally winner serves next; even/odd service boxes mirror correctly',serve_rotation)
 def inherited_modes():
  rulesets={'preview15':(15,21,2),'classic21':(21,30,2)};output={}
  for ruleset,(target,cap,games) in rulesets.items():
   run(f"__rally.startMatch('{ruleset}','rookie')")
   cfg=run('({label:__rally.levelCfg().label,speed:__rally.levelCfg().speed,reaction:__rally.levelCfg().reaction,noise:__rally.levelCfg().noise})')
   assert cfg['speed']==4.05 and cfg['reaction']==.60 and cfg['noise']==.40
   for game in range(games):
    run(f'''()=>{{const q=__rally,m=q.match;for(let i=0;i<{target};i++){{m.phase='RALLY';m.lastHitter='player';q.pointEnd('player','FLOOR_IN');if(i<{target-1})q.advance(1.21)}}q.advance(1.21)}}''')
    if game<games-1:
     assert run('__rally.match.phase')=='GAME_END';run('__rally.nextGame()')
   assert run('__rally.match.phase')=='MATCH_END'
   output[ruleset]=run('({games:{...__rally.match.games},score:{...__rally.match.score},phase:__rally.match.phase})')
  run("__rally.startMatch('arcade11','expert')")
  expert=run('({label:__rally.levelCfg().label,speed:__rally.levelCfg().speed,reaction:__rally.levelCfg().reaction,noise:__rally.levelCfg().noise})')
  assert expert['speed']==4.65 and expert['reaction']==.18 and expert['noise']==.10
  output['expert']=expert
  return output
 check('Inherited 15/21 best-of-three flow and Rookie/Expert parameters remain playable',inherited_modes)
 def fullmatch():
  fresh();r=run('''()=>{const q=__rally,m=q.match,s=q.state;let seen=0;for(let i=0;i<120*600&&m.phase!=='MATCH_END';i++){if(m.phase==='PRE_SERVE')s.held=true;else s.held=m.rallyHits<6;if(s.contacts.length!==seen){seen=s.contacts.length;s.aim=seen%2?1:-1;s.shotType=['standard','drop','clear','smash'][seen%4]}q.tick(1/120)}q.draw();return{phase:m.phase,score:m.score,total:m.totalRallies,contacts:s.contacts.length,log:m.pointLog}}''')
  assert r['phase']=='MATCH_END';assert r['total']==sum(r['score'].values());assert page.locator('#rematchBtn').is_visible()
  page.screenshot(path=str(OUT/'match-end.png'))
  for i in range(3):
   page.locator('#rematchBtn').click();assert run('JSON.stringify(__rally.match.score)')=='{"player":0,"ai":0}'
   assert run('__rally.match.server')=='player' and run('__rally.state.contacts.length')==0
   if i<2:run("()=>{const q=__rally;q.match.phase='RALLY';q.match.score.player=10;q.pointEnd('player','FLOOR_IN');q.advance(1.3);q.draw()}")
  return r
 check('Full Arcade 11 match through actual simulation + three rematches',fullmatch)
 # Compare deterministic Training trajectories with both original source versions.
 def training_parity():
  paths=['/Shuttle_Arena_3D_Rally_Lab_v0.3.html','/Shuttle_Arena_3D_v0.6_Package/Shuttle_Arena_3D_v0.6.html','/shuttle-arena/index.html']
  snapshots=[]
  for path in paths:
   p=context.new_page();p.goto(BASE+path+'#qa');p.wait_for_function('!!window.__rally')
   data=p.evaluate('''()=>{const q=__rally,output=[];for(const drill of ['center','wide','mixed'])for(const pace of [.8,1]){if(q.startTraining)q.startTraining();else q.reset();Object.assign(q.state,{drill,pace,assist:true,aim:0,held:true,shotType:'standard'});for(let i=0;i<120*60*pace;i++)q.tick(1/120);const s=q.state;output.push({drill,pace,hits:s.hits,drops:s.drops,feeds:s.feeds,seed:s.seed,contacts:s.contacts.map(c=>({who:c.who,gap:c.gap,height:c.height,netSide:c.netSide})),player:{x:q.player.x,z:q.player.z},ai:{x:q.opponent.x,z:q.opponent.z}})}return output}''')
   snapshots.append(data);p.close()
  assert snapshots[0]==snapshots[1]==snapshots[2]
  return [{'drill':x['drill'],'pace':x['pace'],'hits':x['hits'],'drops':x['drops']} for x in snapshots[2]]
 check('Training exact parity with v0.3 AND v0.6: 3 drills × 2 paces × 60s',training_parity)
 def switches():
  fresh();run("()=>{const q=__rally;q.match.phase='RALLY';q.pointEnd('ai','OUT');q.startTraining();q.advance(2);q.startMatch();q.draw()}")
  assert run('__rally.state.hits+__rally.state.drops+__rally.state.contacts.length')==0
  assert run('__rally.match.score.player+__rally.match.score.ai')==0
  assert run('__rally.state.pace')==1
 check('Training ↔ Match clears stats and restores Match pace',switches)
 def v06_shots():
  fresh();r=run('''()=>{const q=__rally;let o={};for(const type of ['clear','drop','smash']){q.state.shotType=type;const p=q.V(.2,2.5,2),sh=q.shotFor('player',p,0,0);q.launch(p,q.V(sh.end.x,.08,sh.end.z),'ai',sh.opt);o[type]={name:sh.name,end:sh.end,T:q.state.ball.T,net:q.netCrossY(q.state.ball,p)}}return o}''')
  assert r['clear']['end']['z']==-5.95 and r['clear']['net']>1.95
  assert r['drop']['end']['z']==-2.5 and r['drop']['T']<1.45
  assert r['smash']['name']=='Smash' and r['smash']['T']==.5 and r['smash']['net']>1.58
  return r
 check('Accepted v0.6 Clear/Drop/Smash trajectories remain available',v06_shots)
 def training_after_end():
  fresh();run("()=>{const q=__rally;q.match.phase='RALLY';q.match.score.player=10;q.pointEnd('player','FLOOR_IN');q.advance(1.3);q.draw()}")
  page.locator('#begin').click();run('()=>{const q=__rally;for(let i=0;i<1200;i++){q.state.held=true;q.tick(1/120)}q.draw()}');assert run('__rally.state.hits')>0
  page.locator('#pause').click();assert page.locator('#welcomeTitle').inner_text()=='Trở lại sân đấu.';assert page.locator('#matchOptions').is_hidden()
 check('Results → Training works with automatic footwork; pause overlay stays correct',training_after_end)
 def mobile():
  page.set_viewport_size({'width':390,'height':844});run('__rally.draw()');page.screenshot(path=str(OUT/'narrow.png'),full_page=True)
  assert run('document.documentElement.scrollWidth')<=390
  page.set_viewport_size({'width':1440,'height':1050})
 check('Narrow layout has no horizontal overflow',mobile)
 def missing_vendor_message():
  broken=context.new_page();broken.route('**/vendor/three.min.js',lambda route:route.abort())
  broken.goto(BASE+'/shuttle-arena/index.html');broken.wait_for_load_state('domcontentloaded')
  message=broken.locator('#intro').inner_text();disabled=[broken.locator('#begin').is_disabled(),broken.locator('#beginMatch').is_disabled()]
  assert 'Three.js' in message and 'không phải lỗi WebGL' in message and all(disabled)
  broken.close();return {'message':message,'launchButtonsDisabled':disabled}
 check('Missing/corrupt Three.js reports packaging error instead of blaming WebGL',missing_vendor_message)
 def settings_persist():
  run("localStorage.removeItem('shuttle-arena.settings.v1')")
  page.reload();page.wait_for_function('!!window.__rally')
  page.locator('#drill').select_option('mixed');page.locator('#pace').select_option('1');page.locator('#rulesetSel').select_option('classic21');page.locator('#aiSel').select_option('expert');page.locator('#audio').click()
  stored=run("JSON.parse(localStorage.getItem('shuttle-arena.settings.v1'))")
  page.reload();page.wait_for_function('!!window.__rally')
  restored=run("({assist:__rally.state.assist,sound:__rally.state.sound,drill:__rally.state.drill,pace:__rally.state.pace,ruleset:document.getElementById('rulesetSel').value,ai:document.getElementById('aiSel').value})")
  assert stored['version']==1 and restored=={'assist':True,'sound':True,'drill':'mixed','pace':1,'ruleset':'classic21','ai':'expert'}
  run("localStorage.removeItem('shuttle-arena.settings.v1')")
  return restored
 check('v1 settings persist with a versioned localStorage schema',settings_persist)
 def clean_console():assert not errors,errors
 check('No JavaScript runtime exceptions in browser scenarios',clean_console)
 browser.close()
server.shutdown()
(OUT/'results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
print(json.dumps({'pass':sum(x['status']=='PASS' for x in results),'fail':sum(x['status']=='FAIL' for x in results),'output':str(OUT)},ensure_ascii=False))
raise SystemExit(any(x['status']=='FAIL' for x in results))
