'use strict';

window.KATZENBURG_PROJECTILE = (() => {
  function createLauncher({
    $,
    getPhase,
    getProjectile,
    setProjectile,
    getTurn,
    getActive,
    setMode,
    getProjectileCameraEnabled,
    currentWeapon,
    weaponAvailable,
    ensureActiveWeaponAvailable,
    saveWeaponState,
    clampPitchForWeapon,
    cannonPos,
    cannonMuzzleWorld,
    aimDir,
    weaponCfg,
    add,
    mul,
    spawnMuzzleBurst,
    updateUI,
    toast
  }){
    function fire(){
      if(getPhase()==='build'){ toast('Erst Bauvorgang abschließen.'); return; }
      if(getProjectile())return;
      const turn=getTurn();
      const active=getActive();
      ensureActiveWeaponAvailable(turn);
      if(!weaponAvailable(turn,currentWeapon(turn))){
        toast('Keine einsatzbereite Waffe vorhanden. Baue Waffenturm/Kanone/Katapult.');
        return;
      }
      saveWeaponState(active, active.weapon);
      active.aimPitch=clampPitchForWeapon(active.aimPitch);
      saveWeaponState(active, active.weapon);
      const cp=cannonPos(),dir=aimDir(),cfg=weaponCfg(turn),speed=Number($('power').value)*cfg.speedMul;
      let launchPos;
      if(currentWeapon(turn)==='firecatapult'){
        launchPos=add(cp,mul(dir,cfg.launchOffset));
      }else{
        launchPos=cannonMuzzleWorld(turn);
      }
      const projectile={pos:launchPos.slice(),vel:mul(dir,speed),age:0,trail:[],kind:currentWeapon(turn)};
      setProjectile(projectile);
      if(projectile.kind==='firecatapult') active.catapultAnim=1.0;
      else active.cannonAnim=1.0;
      spawnMuzzleBurst(launchPos,dir,projectile.kind==='firecatapult');
      setMode(getProjectileCameraEnabled()?'follow':'cannon');
      updateUI();
      toast(cfg.toast + (getProjectileCameraEnabled()?' · Flugkamera':' · Sicht bleibt an der Waffe'));
    }

    return { fire };
  }


  function createMotion({ getWind, weaponTypes, add, mul }){
    function advanceProjectile(projectile,dt){
      projectile.age+=dt;
      const prevPos=projectile.pos.slice();
      const fireMode = projectile.kind==='firecatapult';
      const gravity = fireMode ? weaponTypes.firecatapult.gravity : weaponTypes.cannon.gravity;

      projectile.vel[0]+=getWind()*dt*.08;
      projectile.vel[1]-=gravity*dt;
      if(fireMode){
        projectile.vel[0]*=(1-dt*0.025);
        projectile.vel[2]*=(1-dt*0.025);
      }

      const nextPos=add(projectile.pos,mul(projectile.vel,dt));
      projectile.pos=nextPos;
      projectile.trail.push(projectile.pos.slice());
      if(projectile.trail.length>(fireMode?48:34)) projectile.trail.shift();

      return { prevPos, nextPos, fireMode };
    }

    return { advanceProjectile };
  }


  function createTrailFx({ spawnParticle, random=Math.random }){
    function emitProjectileTrail(projectile,fireMode){
      if(fireMode){
        spawnParticle('ember', projectile.pos, [(random()-.5)*1.5, 0.45+random()*1.35, (random()-.5)*1.5], .50+random()*.34, .18+random()*.16, [1,.52,.12]);
        spawnParticle('ember', projectile.pos, [(random()-.5)*1.0, 0.30+random()*0.9, (random()-.5)*1.0], .35+random()*.26, .14+random()*.10, [1,.78,.24]);
        if(random()<0.92) spawnParticle('smoke', projectile.pos, [(random()-.5)*.95, 0.9+random()*1.2, (random()-.5)*.95], .9+random()*.55, .42+random()*.28, [.16,.16,.18]);
      }else if(random()<0.72){
        spawnParticle('smoke', projectile.pos, [(random()-.5)*.35, 0.12+random()*0.42, (random()-.5)*.35], .42+random()*.24, .18+random()*.08, [.20,.20,.22]);
        if(random()<0.45) spawnParticle('spark', projectile.pos, [(random()-.5)*.85, random()*0.65, (random()-.5)*.85], .22+random()*.18, .08+random()*.06, [1,.82,.35]);
      }
    }

    return { emitProjectileTrail };
  }


  function createImpactCheck({ terrainHeight, norm, bounds={x:170,z:95} }){
    function resolveProjectileImpact({ projectile, hitInfo, fireMode }){
      const hit=hitInfo ? hitInfo.block : null;
      let hitPos=hitInfo ? hitInfo.pos : projectile.pos;
      const groundYNow=terrainHeight(projectile.pos[0],projectile.pos[2]);
      const outOfBounds=Math.abs(projectile.pos[0])>bounds.x || Math.abs(projectile.pos[2])>bounds.z;
      const groundHit=projectile.pos[1]<=groundYNow;
      const impacted=!!hit || groundHit || outOfBounds;
      if(!impacted) return { impacted:false, hit:null, hitPos, groundYNow, lastHit:null };
      if(!hit && groundHit) hitPos=[projectile.pos[0],groundYNow,projectile.pos[2]];
      const lastHit={
        x:hitPos[0],
        y:Math.max(groundYNow,hitPos[1]),
        z:hitPos[2],
        valid:true,
        kind:fireMode?'firecatapult':'cannon',
        dir:norm([projectile.vel[0],0,projectile.vel[2]])
      };
      return { impacted:true, hit, hitPos, groundYNow, lastHit };
    }

    return { resolveProjectileImpact };
  }


  function createFireSplash({
    players,
    createGroundFire,
    igniteBlock,
    isFlammableBlock,
    destructionRewardForBlock,
    normalizeGold,
    getTurn,
    constants
  }){
    function applyFireSplash(hitPos,hit){
      const turn=getTurn();
      createGroundFire(hitPos, turn);
      for(const pl of players){
        for(const b of [...pl.blocks]){
          const dx=b.x-hitPos[0], dz=b.z-hitPos[2];
          const dist2 = dx*dx+dz*dz;
          const outer=constants.GROUND_FIRE_RADIUS + Math.max(b.w,b.d)*0.35;
          const inner=constants.GROUND_FIRE_INNER_RADIUS + Math.max(b.w,b.d)*0.28;
          if(isFlammableBlock(b) && dist2 <= outer*outer) igniteBlock(b, turn);
          if(isFlammableBlock(b) && dist2 <= inner*inner && b!==hit){
            b.hp -= 1;
            if(b.hp<=0){
              const reward = destructionRewardForBlock(b);
              players[turn].gold += reward;
              normalizeGold(players[turn]);
              pl.blocks = pl.blocks.filter(x=>x!==b);
            }
          }
        }
        pl.blocks = pl.blocks.filter(b=>b.hp>0);
      }
    }

    return { applyFireSplash };
  }



  function createDestroyedBlockHandler({
    players,
    getTurn,
    weaponLabel,
    setPlayerWeaponState,
    ensureActiveWeaponAvailable,
    toast
  }){
    function handleDestroyedBlock(block){
      if(!block) return;
      const p=players[block.owner];
      if(block.type==='weapon_tower'){
        if(block.weaponSlot){
          setPlayerWeaponState(p,block.weaponSlot,false);
          toast(`${weaponLabel(block.weaponSlot)} und Waffenturm zerstört!`);
        }
      }else if(block.type==='catapult_weapon'){
        setPlayerWeaponState(p,'firecatapult',false);
        toast('Katapult zerstört!');
      }
      if(block.owner===getTurn()) ensureActiveWeaponAvailable(getTurn());
    }

    return { handleDestroyedBlock };
  }

  function createDirectHitHandler({
    players,
    getTurn,
    clamp,
    impactDamageForBlock,
    ownerDamageForBlock,
    isFlammableBlock,
    igniteBlock,
    handleDestroyedBlock,
    rebuildWallJoints,
    destructionRewardForBlock,
    normalizeGold,
    spawnParticle,
    fmtGold,
    types,
    toast,
    random=Math.random
  }){
    function applyProjectileHit({hit,hitPos,fireMode}){
      const turn=getTurn();
      const defender=players[hit.owner];
      const attacker=players[turn];
      const dmg = fireMode ? (hit.type==='wall' ? 1 : 2) : impactDamageForBlock(hit, hitPos[1]);
      const upper = hit.type==='wall' && (hitPos[1]-hit.y > hit.h*0.5);
      const castleDmg = fireMode ? (hit.type==='wall'?0.4:1.0) : ownerDamageForBlock(hit);

      hit.hp -= dmg;
      defender.hp = clamp(defender.hp - castleDmg, 0, 100);

      let ignited=false;
      if(fireMode && isFlammableBlock(hit) && hit.hp>0){
        ignited = igniteBlock(hit, turn);
      }

      let msg='Treffer!';
      if(hit.hp<=0){
        handleDestroyedBlock(hit,defender);
        defender.blocks = defender.blocks.filter(b=>b.hp>0);
        if(hit.type==='wall') rebuildWallJoints(hit.owner);
        const reward = destructionRewardForBlock(hit);
        if(reward>0){
          attacker.gold = (Number(attacker.gold)||0) + reward;
          normalizeGold(attacker);
        }
        for(let r=0;r<10;r++){
          spawnParticle('debris', hitPos, [(random()-.5)*5, 1.0+random()*3.5, (random()-.5)*5], .9+random()*.8, .24+random()*.24, [.30,.26,.22]);
        }
        msg = `${types[hit.type]?.label||'Gebäude'} zerstört!${reward>0?` +${fmtGold(reward)} Gold`:''}`;
      }else if(hit.type==='wall'){
        msg = `Mauer: -${fmtGold(dmg)} HP${upper?' oben':''} · Rest ${fmtGold(Math.max(0,hit.hp))}/5.0`;
      }else{
        msg = `${types[hit.type]?.label||'Gebäude'} getroffen · ${fmtGold(Math.max(0,hit.hp))}/${fmtGold(hit.maxHp)} HP${ignited?' · Brennt!':''}`;
      }
      toast(msg);
      return {dmg, castleDmg, ignited, destroyed:hit.hp<=0, msg};
    }

    return { applyProjectileHit };
  }


  function createImpactFinalizer({
    spawnImpactBurst,
    setProjectile,
    setProjectileCamSmooth,
    setMode,
    getProjectileCameraEnabled,
    updateUI,
    scheduleNextTurn
  }){
    function finalizeProjectileImpact(hitPos,fireMode){
      spawnImpactBurst(hitPos, fireMode);
      setProjectile(null);
      setProjectileCamSmooth({eye:null,target:null});
      setMode(getProjectileCameraEnabled()?'hit':'cannon');
      updateUI();
      scheduleNextTurn();
    }

    return { finalizeProjectileImpact };
  }


  function createUpdater({
    getProjectile,
    advanceProjectile,
    findProjectileHit,
    emitProjectileTrail,
    resolveProjectileImpact,
    setLastHit,
    applyProjectileHit,
    toast,
    applyFireSplash,
    finalizeProjectileImpact
  }){
    function updateProjectile(dt){
      const projectile=getProjectile();
      if(!projectile) return;
      const { prevPos, nextPos, fireMode } = advanceProjectile(projectile,dt);
      const hitInfo=findProjectileHit(prevPos,nextPos);

      emitProjectileTrail(projectile,fireMode);

      const impact=resolveProjectileImpact({projectile,hitInfo,fireMode});
      if(!impact.impacted) return;

      const { hit, hitPos } = impact;
      setLastHit(impact.lastHit);
      if(hit) applyProjectileHit({hit,hitPos,fireMode});
      else toast(fireMode ? 'Feuriger Einschlag' : 'Einschlag');

      if(fireMode) applyFireSplash(hitPos, hit);

      finalizeProjectileImpact(hitPos, fireMode);
    }

    return { updateProjectile };
  }

  function createHitDetection({ players, visualDimensionsForBlock }){
    function pointHitsBlock(pos,b){
      const dim = visualDimensionsForBlock(b);
      const ry = b.ry || 0;

      const dx = pos[0] - b.x;
      const dz = pos[2] - b.z;
      const c = Math.cos(-ry), s = Math.sin(-ry);
      const lx = dx*c - dz*s;
      const lz = dx*s + dz*c;

      return lx > -dim.w/2 && lx < dim.w/2 &&
             lz > -dim.d/2 && lz < dim.d/2 &&
             pos[1] > b.y && pos[1] < b.y + dim.h;
    }

    function findProjectileHit(prevPos,nextPos){
      const steps=12;
      for(let i=1;i<=steps;i++){
        const t=i/steps;
        const p=[
          prevPos[0]+(nextPos[0]-prevPos[0])*t,
          prevPos[1]+(nextPos[1]-prevPos[1])*t,
          prevPos[2]+(nextPos[2]-prevPos[2])*t
        ];
        for(const owner of players){
          for(const b of owner.blocks){
            if(pointHitsBlock(p,b)) return {block:b,pos:p};
          }
        }
      }
      return null;
    }

    return { pointHitsBlock, findProjectileHit };
  }

  return { createLauncher, createMotion, createTrailFx, createImpactCheck, createFireSplash, createDestroyedBlockHandler, createDirectHitHandler, createImpactFinalizer, createUpdater, createHitDetection };
})();
