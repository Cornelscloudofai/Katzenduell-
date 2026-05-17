'use strict';

window.KATZENBURG_FX = (() => {
  const SLIDERS = [
    ['Trail','trail'],
    ['Smoke','smoke'],
    ['Sparks','sparks'],
    ['Flame','flame'],
    ['Recoil','recoil']
  ];


  function createSpawners({ particles, getParticles, getDevFX, math }){
    const { add, mul, norm, cross } = math;

    function spawnParticle(kind,pos,vel,life,size,color){
      const target = getParticles ? getParticles() : particles;
      target.push({kind,pos:pos.slice(),vel:vel.slice(),life,maxLife:life,size,color});
    }

    function spawnMuzzleBurst(origin,dir,fireMode=false){
      const devFX = getDevFX();
      const up=[0,1,0], right=norm(cross(dir,up));
      const sparkCount=Math.round((fireMode?18:14)*(devFX.sparks||1));
      for(let i=0;i<sparkCount;i++){
        const spread=add(add(mul(dir,3.0+Math.random()*3.4),mul(right,(Math.random()-.5)*(fireMode?2.8:1.6))),[0,Math.random()*(fireMode?2.4:1.4),0]);
        spawnParticle(fireMode?'ember':'spark', origin, spread, .55+Math.random()*.55, .22+Math.random()*.22, fireMode?[1,.55,.10]:[1,.82,.35]);
      }
      const smokeCount=Math.round((fireMode?12:5)*(devFX.smoke||1));
      for(let i=0;i<smokeCount;i++){
        spawnParticle('smoke', origin, [ (Math.random()-.5)*(fireMode?1.6:1.0), (fireMode?1.9:1.0)+Math.random()*(fireMode?1.8:0.9), (Math.random()-.5)*(fireMode?1.6:1.0)], 1.1+Math.random()*(fireMode?0.9:0.6), .48+Math.random()*(fireMode?0.42:0.22), [.16,.16,.18]);
      }
    }

    function spawnFireSmokeColumn(origin, intensity=1, fireMode=true){
      const devFX = getDevFX();
      const count=Math.max(1,Math.round(4*intensity*(devFX.smoke||1)));
      for(let i=0;i<count;i++){
        const angle=Math.random()*Math.PI*2;
        const r=Math.random()*0.85*intensity;
        const pos=[
          origin[0]+Math.cos(angle)*r,
          origin[1]+0.20+Math.random()*0.65,
          origin[2]+Math.sin(angle)*r
        ];
        spawnParticle('smoke', pos,
          [(Math.random()-.5)*0.75, 1.25+Math.random()*1.65, (Math.random()-.5)*0.75],
          1.35+Math.random()*1.25,
          0.32+Math.random()*0.34,
          [.15,.15,.17]
        );
      }
      const emberCount=Math.max(1,Math.round(2*intensity*(devFX.sparks||1)));
      for(let i=0;i<emberCount;i++){
        spawnParticle('ember', origin,
          [(Math.random()-.5)*1.0, .65+Math.random()*1.2, (Math.random()-.5)*1.0],
          .55+Math.random()*.45,
          .10+Math.random()*.08,
          [1,.48,.10]
        );
      }
    }

    function spawnImpactBurst(hitPos,fireMode=false){
      const devFX = getDevFX();
      for(let i=0;i<Math.round((fireMode?58:24)*(devFX.sparks||1));i++){
        spawnParticle(fireMode?'ember':'spark', hitPos,
          [(Math.random()-.5)*(fireMode?10.5:7.2), Math.random()*(fireMode?7.5:5.5), (Math.random()-.5)*(fireMode?10.5:7.2)],
          .8+Math.random()*.8, .20+Math.random()*.42,
          fireMode ? [1,.45,.10] : [1,.55,.22]);
      }
      for(let i=0;i<Math.round((fireMode?36:12)*(devFX.smoke||1));i++){
        spawnParticle('smoke', hitPos,
          [(Math.random()-.5)*4.4, 2.2+Math.random()*3.9, (Math.random()-.5)*4.4],
          1.6+Math.random()*1.6, .56+Math.random()*.72,
          fireMode?[.18,.18,.20]:[.22,.20,.18]);
      }
    }

    return { spawnParticle, spawnMuzzleBurst, spawnFireSmokeColumn, spawnImpactBurst };
  }


  function createFireState({
    getGroundFires,
    setGroundFires,
    getScorchMarks,
    setScorchMarks,
    players,
    terrainHeight,
    isFlammableBlock,
    destructionRewardForBlock,
    normalizeGold,
    constants
  }){
    const {
      FIRE_BURN_TURNS,
      GROUND_FIRE_TURNS,
      GROUND_FIRE_RADIUS,
      GROUND_FIRE_INNER_RADIUS,
      GROUND_FIRE_DAMAGE,
      SCORCH_LIFE
    } = constants;

    function igniteBlock(block,attackerIdx){
      if(!isFlammableBlock(block)) return false;
      block.onFire = Math.max(block.onFire||0, FIRE_BURN_TURNS);
      block.fireOwner = attackerIdx;
      return true;
    }

    function createGroundFire(hitPos,owner){
      getGroundFires().push({x:hitPos[0],z:hitPos[2],y:terrainHeight(hitPos[0],hitPos[2]),radius:GROUND_FIRE_RADIUS,innerRadius:GROUND_FIRE_INNER_RADIUS,turns:GROUND_FIRE_TURNS,owner});
      const marks=[
        [0,0,0.34],
        [0.42,-0.18,0.18],
        [-0.36,0.24,0.16],
        [0.12,0.46,0.13],
        [-0.52,-0.32,0.12],
        [0.58,0.22,0.10]
      ];
      for(const m of marks){
        getScorchMarks().push({
          x:hitPos[0]+m[0]*GROUND_FIRE_RADIUS,
          z:hitPos[2]+m[1]*GROUND_FIRE_RADIUS,
          radius:GROUND_FIRE_RADIUS*m[2],
          life:SCORCH_LIFE,
          maxLife:SCORCH_LIFE
        });
      }
    }

    function applyGroundFireTick(){
      let affected=0, destroyed=0;
      const survivors=[];
      for(const gf of getGroundFires()){
        for(const pl of players){
          for(const b of [...pl.blocks]){
            if(!isFlammableBlock(b)) continue;
            const dx=b.x-gf.x, dz=b.z-gf.z;
            const dist2=dx*dx+dz*dz;
            const outer = gf.radius + Math.max(b.w,b.d)*0.35;
            const inner = gf.innerRadius + Math.max(b.w,b.d)*0.28;
            if(dist2 <= outer*outer){
              affected++;
              igniteBlock(b,gf.owner);
              if(dist2 <= inner*inner){
                b.hp -= GROUND_FIRE_DAMAGE;
                if(b.hp<=0){
                  const reward=destructionRewardForBlock(b);
                  if(players[gf.owner]){ players[gf.owner].gold += reward; normalizeGold(players[gf.owner]); }
                  pl.blocks = pl.blocks.filter(x=>x!==b);
                  destroyed++;
                }
              }
            }
          }
        }
        gf.turns -= 1;
        if(gf.turns>0) survivors.push(gf);
      }
      setGroundFires(survivors);
      setScorchMarks(getScorchMarks().map(s=>({...s,life:s.life-1})).filter(s=>s.life>0));
      return {affected,destroyed};
    }

    return { igniteBlock, createGroundFire, applyGroundFireTick };
  }


  function createParticleUpdater({
    getParticles,
    setParticles,
    groundFires,
    getGroundFires,
    players,
    terrainHeight,
    spawnFireSmokeColumn,
    math
  }){
    const { add, mul } = math;

    function updateParticles(dt){
      const particles = getParticles().filter(p=>p.life>0);
      setParticles(particles);
      for(const p of particles){
        p.life-=dt;
        if(p.kind==='smoke'){
          p.vel[0]*=(1-dt*0.78);
          p.vel[2]*=(1-dt*0.78);
          p.vel[1]+=0.86*dt;
          p.size*=1+dt*0.84;
        }else if(p.kind==='ember' || p.kind==='spark'){
          p.vel[1]-=4.2*dt;
          p.size*=1-dt*0.18;
        }else{
          p.vel[1]-=5*dt;
        }
        p.pos=add(p.pos,mul(p.vel,dt));
      }

      if(Math.random()<0.38){
        const fires = getGroundFires ? getGroundFires() : groundFires;
        for(const gf of fires){
          const pos=[gf.x||0,terrainHeight(gf.x||0,gf.z||0)+0.06,gf.z||0];
          spawnFireSmokeColumn(pos,0.75,true);
        }
        for(const pl of players){
          for(const b of pl.blocks){
            if((b.onFire||0)>0){
              spawnFireSmokeColumn([b.x,(b.y||0)+Math.min(2.5,(b.h||3)*0.55),b.z],0.62,true);
            }
          }
        }
      }
    }

    return { updateParticles };
  }


  function createScorchRenderer({ scorchMarks, getScorchMarks, drawSphere, matrix }){
    const { m4Identity, translate, rotY, scale } = matrix;

    function drawFlatSpherePatch(x,y,z,sx,sy,sz,color,VP,ry=0){
      let M=m4Identity();
      M=translate(M,x,y,z);
      M=rotY(M,ry);
      M=scale(M,sx,sy,sz);
      drawSphere(M,color,VP);
    }

    function drawScorchMarks(VP){
      const marks = getScorchMarks ? getScorchMarks() : scorchMarks;
      for(const s of marks){
        const fade = Math.max(.18, s.life/Math.max(1,s.maxLife));
        const r=s.radius;
        drawFlatSpherePatch(s.x,0.142,s.z,r*.95,.009,r*.62,[.075*fade,.045*fade,.032*fade],VP,.18);
        drawFlatSpherePatch(s.x+r*.16,0.164,s.z-r*.06,r*.42,.007,r*.28,[.18*fade,.060*fade,.032*fade],VP,-.35);
        if(r>0.65){
          drawFlatSpherePatch(s.x-r*.16,0.184,s.z+r*.10,r*.30,.006,r*.22,[.055*fade,.038*fade,.030*fade],VP,.50);
        }
      }
    }

    return { drawScorchMarks };
  }


  function createBurningStructuresRenderer({
    players,
    isFlammableBlock,
    visualBlockHeightScale,
    drawCone,
    basisModel,
    drawSoftSmokePuff,
    spawnFireSmokeColumn
  }){
    function drawBurningStructures(VP,burnTime){
      for(const pl of players)for(const b of pl.blocks){
        const topY=b.y + b.h*visualBlockHeightScale(b);
        if((b.onFire||0)>0 && isFlammableBlock(b)){
          const flick=.18*Math.sin(burnTime*3.0 + b.x*0.3 + b.z*0.2);
          for(let j=0;j<5;j++){
            const ox=(j-2)*0.24, oz=((j%2)?-.28:.28);
            drawCone(basisModel([b.x+ox, topY+.52+flick, b.z+oz],[1,0,0],[0,1,0],[0,0,1],.22,.54,.22), [1.0,.68,.12], VP);
            drawCone(basisModel([b.x+ox*.58, topY+.84+flick, b.z+oz*.58],[1,0,0],[0,1,0],[0,0,1],.12,.31,.12), [1.0,.22,.08], VP);
          }
          drawSoftSmokePuff([b.x,topY+1.28,b.z],.52,VP,.82);
          if(Math.random()<0.06) spawnFireSmokeColumn([b.x,topY+0.45,b.z],0.45,true);
        }
      }
    }

    return { drawBurningStructures };
  }


  function createGroundFireRenderer({
    groundFires,
    getGroundFires,
    drawCube,
    drawCone,
    modelCube,
    basisModel,
    drawSoftSmokePuff,
    spawnFireSmokeColumn
  }){
    function drawGroundFires(VP,burnTime){
      const fires = getGroundFires ? getGroundFires() : groundFires;
      for(const gf of fires){
        for(let k=0;k<14;k++){
          const ang=(k/14)*Math.PI*2 + burnTime*0.10;
          const rr=gf.radius*(0.12 + (k%5)*0.11);
          const px=gf.x + Math.cos(ang)*rr, pz=gf.z + Math.sin(ang)*rr;
          const sx=gf.radius*(0.12 + (k%3)*0.035);
          const sz=gf.radius*(0.10 + (k%4)*0.030);
          drawCube(modelCube(px,0.085+0.001*k,pz,sx,.022,sz),[(k%2)?.34:.24,.09,.035],VP);
        }
        for(let k=0;k<9;k++){
          const ang=(k/9)*Math.PI*2 + burnTime*0.2;
          const rr=gf.radius*(0.18 + (k%4)*0.12);
          const px=gf.x + Math.cos(ang)*rr, pz=gf.z + Math.sin(ang)*rr;
          const fh=.30 + 0.16*Math.sin(burnTime*4.0 + k);
          drawCone(basisModel([px,.32+fh,pz],[1,0,0],[0,1,0],[0,0,1],.24,.58,.24),[1.0,.66,.12],VP);
          drawCone(basisModel([px,.62+fh,pz],[1,0,0],[0,1,0],[0,0,1],.13,.34,.13),[1.0,.22,.08],VP);
          if(k%3===0) drawSoftSmokePuff([px,.95+fh,pz],.38,VP,.78);
        }
        if(Math.random()<0.04) spawnFireSmokeColumn([gf.x,0.08,gf.z],0.65,true);
      }
    }

    return { drawGroundFires };
  }



  function createSmokeRenderer({ drawSphere, modelCube }){
    function drawSoftSmokePuff(pos,size,VP,shade=1){
      const s=size;
      drawSphere(modelCube(pos[0],pos[1],pos[2],s*.92,s*.72,s*.92),[.18*shade,.18*shade,.20*shade],VP);
      drawSphere(modelCube(pos[0]+s*.22,pos[1]+s*.16,pos[2]-s*.16,s*.58,s*.50,s*.58),[.24*shade,.24*shade,.26*shade],VP);
    }

    return { drawSoftSmokePuff };
  }

  function createProjectileRenderer({ getProjectile, getDevFX, drawSphere, drawCube, modelCube }){
    function drawProjectile(VP){
      const projectile = getProjectile();
      if(!projectile) return;
      const devFX = getDevFX();
      const fireMode = projectile.kind==='firecatapult';
      for(let i=0;i<projectile.trail.length;i++){
        const t=projectile.trail[i], k=i/Math.max(1,projectile.trail.length-1);
        const s=(fireMode ? .42 : .24)*(k+.20)*(devFX.trail||1);
        const glow = fireMode ? [1,.45+.30*k,.08] : [.72,.72,.76];
        drawSphere(modelCube(t[0],t[1],t[2],s,s,s),glow,VP);
        if(fireMode && i%2===0){
          drawCube(modelCube(t[0],t[1]+0.12,t[2],s*.58,s*.58,s*.58),[1,.88,.32],VP);
          drawCube(modelCube(t[0],t[1]+.30,t[2],s*.68,s*.34,s*.68),[.13,.13,.15],VP);
        }else if(!fireMode && i%4===0){
          drawCube(modelCube(t[0],t[1]+.06,t[2],s*.45,s*.20,s*.45),[.18,.18,.20],VP);
        }
      }
      if(fireMode){
        drawSphere(modelCube(projectile.pos[0],projectile.pos[1],projectile.pos[2],.66,.66,.66),[.16,.09,.05],VP);
        drawSphere(modelCube(projectile.pos[0],projectile.pos[1]+.20,projectile.pos[2],.42,.42,.42),[1,.48,.08],VP);
        drawSphere(modelCube(projectile.pos[0],projectile.pos[1]+.36,projectile.pos[2],.22,.22,.22),[1,.88,.32],VP);
      }else{
        drawSphere(modelCube(projectile.pos[0],projectile.pos[1],projectile.pos[2],.56,.56,.56),[.05,.05,.07],VP);
        drawSphere(modelCube(projectile.pos[0],projectile.pos[1],projectile.pos[2],.32,.32,.32),[.30,.30,.32],VP);
      }
    }

    return { drawProjectile };
  }


  function createParticleRenderer({ getParticles, drawCube, modelCube, drawSoftSmokePuff }){
    function drawParticles(VP){
      for(const p of getParticles()){
        const r=Math.max(.08,p.life/Math.max(.0001,p.maxLife||1));
        const s=(p.size||.45)*Math.max(.18,r);
        let col=p.color||[1,.42,.18];
        if(p.kind==='smoke'){
          const shade=.80+.28*r;
          drawSoftSmokePuff(p.pos,s*1.18,VP,shade);
          continue;
        }
        if(p.kind==='ember') col=[1,.28+.34*r,.08];
        if(p.kind==='spark') col=[1,.55+.20*r,.20];
        drawCube(modelCube(p.pos[0],p.pos[1],p.pos[2],s*.74,s*.74,s*.74),col,VP);
        if(p.kind==='ember' || p.kind==='spark') drawCube(modelCube(p.pos[0],p.pos[1],p.pos[2],s*.34,s*.34,s*.34),[1,.92,.45],VP);
      }
    }

    return { drawParticles };
  }

  function create({ $, getDevFX, setDevFX, toast }){
    function update(){
      const devFX = getDevFX();
      for(const [id,key] of SLIDERS){
        const el=$('fx'+id), val=$('fx'+id+'Val');
        if(el){ el.value=devFX[key]; }
        if(val){ val.textContent=Number(devFX[key]).toFixed(1); }
      }
    }

    function setFX(key,val){
      const next = { ...getDevFX(), [key]: Number(val) };
      setDevFX(next);
      update();
    }

    function bind(){
      for(const [id,key] of SLIDERS){
        const el=$('fx'+id);
        if(el) el.addEventListener('input',()=>setFX(key,el.value));
      }

      $('weaponDevHandle').onclick=()=>{
        $('weaponDevDrawer').classList.toggle('open');
        $('weaponDevHandle').textContent=$('weaponDevDrawer').classList.contains('open')?'▶':'◀';
      };
      $('fxResetBtn').onclick=()=>{
        setDevFX({trail:1,smoke:1,sparks:1,flame:1,recoil:1});
        update();
        toast('FX zurückgesetzt');
      };
      $('fxPresetBtn').onclick=()=>{
        setDevFX({trail:1.4,smoke:1.6,sparks:1.5,flame:1.25,recoil:1.15});
        update();
        toast('FX Preset: Drama');
      };
    }

    return { bind, update, setFX };
  }

  return { create, createSpawners, createFireState, createParticleUpdater, createScorchRenderer, createBurningStructuresRenderer, createGroundFireRenderer, createSmokeRenderer, createProjectileRenderer, createParticleRenderer };
})();
