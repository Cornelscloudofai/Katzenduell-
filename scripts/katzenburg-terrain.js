'use strict';

window.KATZENBURG_TERRAIN = (() => {
  function create({ math, onTerrainChanged = () => {} }){
    const {
      add, mul, norm,
      blendRectPlateau, bumpHeight,
      mulberry32, randRange, randInt, pick
    } = math;
    let terrainSeed=1;
    let terrainCfg=null;

    function generateTerrainConfig(){
      terrainSeed = Math.floor(Math.random()*1000000);
      const r = mulberry32(terrainSeed);
      const mode = pick(r,['left_high','right_high','both_high','one_high_one_mid','both_medium']);
      let leftPlateau=randRange(r,3.0,4.2), rightPlateau=randRange(r,3.0,4.2);
      if(mode==='left_high'){ leftPlateau=randRange(r,7.0,11.0); rightPlateau=randRange(r,3.0,4.6); }
      else if(mode==='right_high'){ rightPlateau=randRange(r,7.0,11.0); leftPlateau=randRange(r,3.0,4.6); }
      else if(mode==='both_high'){ leftPlateau=randRange(r,6.5,10.8); rightPlateau=randRange(r,6.5,10.8); }
      else if(mode==='one_high_one_mid'){
        if(r()<0.5){ leftPlateau=randRange(r,7.0,11.0); rightPlateau=randRange(r,4.3,6.5); }
        else{ rightPlateau=randRange(r,7.0,11.0); leftPlateau=randRange(r,4.3,6.5); }
      }else{
        leftPlateau=randRange(r,4.3,6.2); rightPlateau=randRange(r,4.3,6.2);
      }
      const plateauLabel = mode==='both_high' ? 'beide Burgen auf hohen Plateaus' :
        mode==='left_high' ? 'linke Burg auf hohem Plateau' :
        mode==='right_high' ? 'rechte Burg auf hohem Plateau' :
        mode==='one_high_one_mid' ? 'eine Burg hoch, eine mittelhoch' :
        'beide Burgen auf mittleren Plateaus';

      const cfg={
        mode, plateauLabel, leftPlateau, rightPlateau,
        phaseA:randRange(r,-Math.PI,Math.PI), phaseB:randRange(r,-Math.PI,Math.PI),
        phaseC:randRange(r,-Math.PI,Math.PI), phaseD:randRange(r,-Math.PI,Math.PI),
        valleyDepth:randRange(r,-1.15,-0.55),
        valleyWide:randRange(r,-0.35,-0.14),
        backRidgeAmp:randRange(r,16,24),
        backRidgeY:randRange(r,-165,-145),
        backRidge2Amp:randRange(r,9,15),
        backRidge2Y:randRange(r,-198,-174),
        sideMassAmp:randRange(r,3.5,6.5),
        hills:[], peaks:[], wheatFields:[]
      };

      for(let i=0;i<10;i++){
        cfg.hills.push({
          x:randRange(r,-95,95),
          z:randRange(r,-78,78),
          rx:randRange(r,18,38),
          rz:randRange(r,10,24),
          h:randRange(r,0.7,1.9)
        });
      }
      for(let i=0;i<12;i++){
        cfg.peaks.push({
          x:randRange(r,-220,220),
          z:randRange(r,-188,132),
          rx:randRange(r,18,65),
          rz:randRange(r,10,28),
          h:randRange(r,4.0,18.0)*(i<5?1.25:1.0)
        });
      }
      cfg.peaks.push({x:randRange(r,-24,24), z:randRange(r,-172,-148), rx:randRange(r,24,42), rz:randRange(r,10,16), h:randRange(r,18,25)});
      cfg.peaks.push({x:randRange(r,-80,-30), z:randRange(r,-166,-142), rx:randRange(r,20,36), rz:randRange(r,10,16), h:randRange(r,12,20)});
      cfg.peaks.push({x:randRange(r,30,80), z:randRange(r,-166,-142), rx:randRange(r,20,36), rz:randRange(r,10,16), h:randRange(r,12,20)});

      for(let i=0;i<randInt(r,3,5);i++){
        const side = r()<0.5?-1:1;
        cfg.wheatFields.push({x:randRange(r,18,95)*side,z:randRange(r,-72,72),rx:randRange(r,12,24),rz:randRange(r,8,16)});
      }
      terrainCfg=cfg;
      onTerrainChanged();
      return terrainCfg;
    }

    function terrainHeight(x,z){
      const c=terrainCfg || {leftPlateau:4,rightPlateau:4,phaseA:0,phaseB:0,phaseC:0,phaseD:0,valleyDepth:-0.8,valleyWide:-0.2,backRidgeAmp:18,backRidgeY:-154,backRidge2Amp:10,backRidge2Y:-186,sideMassAmp:4.5,hills:[],peaks:[],wheatFields:[]};
      let h=0.05;

      h += Math.sin(x*0.050+c.phaseA)*0.12 + Math.cos(z*0.052+c.phaseB)*0.10;
      h += Math.sin((x+z)*0.030+c.phaseC)*0.07 + Math.cos((x-z)*0.022+c.phaseD)*0.055;

      h += blendRectPlateau(x,z,-82,0,20,18,c.leftPlateau,13.5);
      h += blendRectPlateau(x,z, 82,0,20,18,c.rightPlateau,13.5);

      h += bumpHeight(x,z,0,0,62,32,c.valleyDepth);
      h += bumpHeight(x,z,0,0,118,44,c.valleyWide);

      for(const k of c.hills) h += bumpHeight(x,z,k.x,k.z,k.rx,k.rz,k.h);

      h += bumpHeight(x,z,-138,0,56,92,c.sideMassAmp);
      h += bumpHeight(x,z, 138,0,56,92,c.sideMassAmp);
      h += bumpHeight(x,z,0,120,132,26,2.7);

      h += bumpHeight(x,z,0,c.backRidgeY,176,30,c.backRidgeAmp);
      h += bumpHeight(x,z,0,c.backRidge2Y,210,38,c.backRidge2Amp);
      h += bumpHeight(x,z,-184,-96,52,28,c.backRidgeAmp*0.62);
      h += bumpHeight(x,z, 184,-96,52,28,c.backRidgeAmp*0.62);

      for(const p of c.peaks) h += bumpHeight(x,z,p.x,p.z,p.rx,p.rz,p.h);

      h += bumpHeight(x,z,-96,-112,24,14,-1.1);
      h += bumpHeight(x,z, 96,-116,24,14,-1.1);
      h += bumpHeight(x,z,  0,-126,44,12,-0.95);

      return Math.max(0,h);
    }
    function terrainColor(x,z,h){
      const e=0.55;
      const hx=terrainHeight(x+e,z)-terrainHeight(x-e,z);
      const hz=terrainHeight(x,z+e)-terrainHeight(x,z-e);
      const slope=Math.min(1,Math.hypot(hx,hz)*0.9);
      let col;
      if(isWheatField(x,z,h) && slope<0.22){
        col=[0.64,0.56,0.21];
      }else if(h>4.8 || slope>0.56){
        col=[0.38,0.40,0.42]; // Fels
      }else if(h<0.14){
        col=[0.24,0.30,0.15]; // nur wenig dunkle Erde
      }else if(slope>0.30){
        col=[0.25,0.33,0.17]; // erdige Hangzone, aber grüner als zuvor
      }else if(h<0.75){
        col=[0.24,0.40,0.18];
      }else{
        col=[0.28,0.46,0.24];
      }
      const chk=((Math.floor((x+200)*0.33)+Math.floor((z+200)*0.33))&1)?1.04:0.96;
      return col.map(v=>Math.max(0,Math.min(1,v*chk)));
    }
    function terrainFlatnessAt(x,z,w=3.8,d=3.8){
      const ys=[
        terrainHeight(x,z),
        terrainHeight(x-w*0.5,z-d*0.5), terrainHeight(x+w*0.5,z-d*0.5),
        terrainHeight(x-w*0.5,z+d*0.5), terrainHeight(x+w*0.5,z+d*0.5)
      ];
      return Math.max(...ys)-Math.min(...ys);
    }
    function terrainRayHit(origin,dir,maxT=700,step=1.35){
      let prev=origin.slice();
      let prevDelta=prev[1]-terrainHeight(prev[0],prev[2]);
      for(let t=step;t<=maxT;t+=step){
        const p=add(origin,mul(dir,t));
        const delta=p[1]-terrainHeight(p[0],p[2]);
        if(delta<=0){
          const a=prevDelta/(prevDelta-delta||1e-6);
          const hit=[
            prev[0]+(p[0]-prev[0])*a,
            prev[1]+(p[1]-prev[1])*a,
            prev[2]+(p[2]-prev[2])*a
          ];
          const gy=terrainHeight(hit[0],hit[2]);
          hit[1]=gy;
          return hit;
        }
        prev=p; prevDelta=delta;
      }
      return null;
    }
    function terrainNormalAt(x,z){
      const e=1.35;
      const hx=terrainHeight(x+e,z)-terrainHeight(x-e,z);
      const hz=terrainHeight(x,z+e)-terrainHeight(x,z-e);
      return norm([-hx/(2*e),1,-hz/(2*e)]);
    }
    function isWheatField(x,z,h){
      if(!terrainCfg) return false;
      if(h<0.18 || h>1.95) return false;
      for(const f of terrainCfg.wheatFields||[]){
        const q=((x-f.x)*(x-f.x))/(f.rx*f.rx)+((z-f.z)*(z-f.z))/(f.rz*f.rz);
        if(q<1) return true;
      }
      return false;
    }
    function terrainMaterialKey(x,z,h){
      const e=1.2;
      const sx=terrainHeight(x+e,z)-terrainHeight(x-e,z);
      const sz=terrainHeight(x,z+e)-terrainHeight(x,z-e);
      const slope=Math.hypot(sx,sz)*0.45;
      if(isWheatField(x,z,h) && slope<0.22) return 'wheat';
      if(h>4.8 || slope>0.56) return 'rock';
      if(h<0.14) return 'earth';
      if(slope>0.30) return 'dirt';
      return 'grass';
    }


    function getTerrainSeed(){ return terrainSeed; }
    function getTerrainConfig(){ return terrainCfg; }

    return {
      generateTerrainConfig,
      terrainHeight,
      terrainColor,
      terrainFlatnessAt,
      terrainRayHit,
      terrainNormalAt,
      isWheatField,
      terrainMaterialKey,
      getTerrainSeed,
      getTerrainConfig
    };
  }

  return { create };
})();
