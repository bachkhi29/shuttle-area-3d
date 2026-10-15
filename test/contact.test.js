'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {CONFIG,isCleanContact,applyStretchedError}=require('../src/rules');
for(const who of ['player','ai']){
 const sign=who==='player'?-1:1;
 for(const aim of [-1,0,1]){
  const target={x:aim*1.65,z:sign*4.9};
  test(`7.1.4 ${who} aim ${aim}: clean including exact boundary`,()=>{
   for(const c of [{gap:.7,height:.9},{gap:0,height:2.65}]){
    assert.equal(isCleanContact(c.gap,c.height),true);
    const result=applyStretchedError(Object.freeze(target),Object.freeze(c),aim,who);
    assert.deepEqual(result,target);assert.notEqual(result,target);
   }
  });
  for(const c of [{gap:.70000001,height:1.2},{gap:.5,height:.89999999},{gap:.8,height:.7}]){
   test(`7.1.4 ${who} aim ${aim}: stretched ${JSON.stringify(c)}`,()=>{
    assert.equal(isCleanContact(c.gap,c.height),false);
    assert.deepEqual(applyStretchedError(target,c,aim,who),{x:aim?aim*2.75:0,z:sign*(aim?4.9:6.9)});
   });
  }
 }
}
test('quality ignores travel, RNG roll and unrelated measurements',()=>{
 const t={x:1.65,z:-4.9},c={gap:.5,height:1.2,travel:100,roll:0,q:100};
 assert.deepEqual(applyStretchedError(t,c,1,'player'),t);
});
test('v0.6 Drop/Clear retain clean targets and receive metre offsets',()=>{
 const drop=applyStretchedError({x:1.05,z:-2.5},{gap:.8,height:1},1,'player');
 assert.ok(Math.abs(drop.x-2.15)<1e-12);assert.equal(drop.z,-2.5);
 assert.deepEqual(applyStretchedError({x:0,z:5.95},{gap:.8,height:1},0,'ai'),{x:0,z:7.95});
});
test('error tuning has one source CONFIG.match.errorOffset',()=>{
 const old={...CONFIG.match.errorOffset};
 try{
  CONFIG.match.errorOffset.side=.5;CONFIG.match.errorOffset.deep=1;
  assert.equal(applyStretchedError({x:1.65,z:-4.9},{gap:.8,height:1},1,'player').x,2.15);
  assert.equal(applyStretchedError({x:0,z:-4.9},{gap:.8,height:1},0,'player').z,-5.9);
 }finally{Object.assign(CONFIG.match.errorOffset,old)}
});
