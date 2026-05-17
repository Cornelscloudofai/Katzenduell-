'use strict';

window.KATZENBURG_BUILD = (() => {
  function create({
    $,
    canvas,
    getDPR,
    getPhase,
    getTurn,
    getActive,
    getSelectedBuild,
    getBuildPreview,
    getBuildHandleScreen,
    buildCam,
    types,
    players,
    weaponTypeForBuild,
    BUILD_GRID_UNIT,
    clamp,
    transformPoint,
    add,
    mul,
    norm,
    sub,
    cross,
    terrainHeight,
    terrainRayHit,
    canPlaceBlock,
    computeWallDrawPreview,
    updateUI,
    toast
  }){
    function projectToScreen(world,VP){
      const q=transformPoint(VP,world);
      if(Math.abs(q[3])<0.00001) return {visible:false,x:0,y:0};
      const ndc=[q[0]/q[3],q[1]/q[3],q[2]/q[3]];
      const dpr = getDPR();
      return {
        visible: q[3] > 0 && ndc[0] >= -1.25 && ndc[0] <= 1.25 && ndc[1] >= -1.25 && ndc[1] <= 1.25,
        x:(ndc[0]*0.5+0.5)*(canvas.width/dpr),
        y:(1-(ndc[1]*0.5+0.5))*(canvas.height/dpr)
      };
    }

    function buildHandleWorldPos(){
      const buildPreview = getBuildPreview();
      const t=types[getSelectedBuild()];
      const ry=buildPreview.ry||0;
      const side = Math.max(t.w,t.d)*0.62;
      const fx=Math.sin(ry), fz=Math.cos(ry);
      const rx=Math.cos(ry), rz=-Math.sin(ry);
      // leicht schräg neben dem Objekt
      const baseY=terrainHeight(buildPreview.x,buildPreview.z);
      return [
        buildPreview.x + rx*side + fx*0.55,
        baseY + Math.max(1.5,t.h*0.76),
        buildPreview.z + rz*side + fz*0.55
      ];
    }

    function pointerHitsBuildHandle(ev){
      const buildHandleScreen = getBuildHandleScreen();
      if(getPhase()!=='build' || !buildHandleScreen.visible) return false;
      const rect=canvas.getBoundingClientRect();
      const x=ev.clientX-rect.left, y=ev.clientY-rect.top;
      const dx=x-buildHandleScreen.x, dy=y-buildHandleScreen.y;
      return dx*dx + dy*dy <= buildHandleScreen.r*buildHandleScreen.r;
    }

    function getBuildCameraBasis(){
      const eye=buildCam.eye || [0,0,0];
      const target=buildCam.target || [buildCam.targetX,2.5,buildCam.targetZ];
      const forward=norm(sub(target,eye));
      const right=norm(cross(forward,[0,1,0]));
      const up=norm(cross(right,forward));
      return {eye,forward,right,up};
    }

    function terrainHitFromScreenNormalized(nx,ny){
      const basis=getBuildCameraBasis();
      const aspect=(canvas.clientWidth||window.innerWidth)/Math.max(1,(canvas.clientHeight||window.innerHeight));
      const fov=58*Math.PI/180;
      const tan=Math.tan(fov/2);
      const dir=norm(add(add(basis.forward,mul(basis.right,nx*tan*aspect)),mul(basis.up,ny*tan)));
      return terrainRayHit(basis.eye,dir,760,1.35);
    }

    function buildCenterWorldPoint(){
      // Bildschirmmitte leicht oberhalb des Feuerkreuzes, damit die Vorschau wirklich im aktuellen Blickfeld startet.
      const p=getActive();
      return terrainHitFromScreenNormalized(0,0.05) || [p.x, terrainHeight(p.x,0), 0];
    }

    function buildAreaSpan(){
      // V75: größere Bauzone, damit Assets sich räumlich entfalten können.
      return {x:110,z:82};
    }

    function buildGridPoint(x,z){
      const p=getActive();
      const g=BUILD_GRID_UNIT || 0.85;
      return {
        x:Math.round((x-p.x)/g)*g+p.x,
        z:Math.round(z/g)*g
      };
    }

    function wallLineNodes(start,end){
      const dx=end.x-start.x, dz=end.z-start.z;
      const useX=Math.abs(dx)>=Math.abs(dz);
      const a=useX?start.x:start.z;
      const b=useX?end.x:end.z;
      const step=(b>=a)?BUILD_GRID_UNIT:-BUILD_GRID_UNIT;
      const count=Math.max(1,Math.round(Math.abs(b-a)/BUILD_GRID_UNIT));
      const nodes=[];
      for(let i=0;i<=count;i++){
        const x=useX ? start.x + Math.sign(step)*BUILD_GRID_UNIT*i : start.x;
        const z=useX ? start.z : start.z + Math.sign(step)*BUILD_GRID_UNIT*i;
        nodes.push(buildGridPoint(x,z));
      }
      return nodes;
    }

    function wallSegmentsFromNodes(nodes){ return nodes.map(n=>({x:n.x,z:n.z,ry:0})); }

    function wallLineCost(segs){ return segs.length; }

    function footprintFor(type,ry=0){
      const t=types[type];
      let baseW=t.w, baseD=t.d;

      const rotated = Math.abs(Math.sin(ry||0)) > 0.5;
      let w = rotated ? baseD : baseW;
      let d = rotated ? baseW : baseD;

      // Zusätzlicher Sicherheitsabstand für mobile Platzierung und größere GLBs.
      if(type==='wall'){ w += 0.00; d += 0.00; }
      if(type==='tower'){ w += 5.0; d += 5.0; }
      if(type==='weapon_tower'){ w += 4.0; d += 4.0; }
      if(type==='fish'){ w += 1.4; d += 1.8; }
      else if(type==='granary'){ w += 1.2; d += 1.0; }
      else if(type==='barracks'){ w += 1.8; d += 1.4; }
      else if(type==='catmint'){ w += 1.8; d += 1.6; }
      else if(type!=='wall' && type!=='tower' && type!=='weapon_tower'){ w += 0.9; d += 0.9; }
      return {w,d};
    }

    function nearestEmptyWeaponTower(owner,x,z,weapon){
      const p=players[owner];
      let best=null, bestD=999999;
      for(const b of p.blocks){
        if(b.type!=='weapon_tower'||b.hp<=0) continue;
        if(b.weaponSlot && b.weaponSlot!==weapon) continue;
        if(b.hasWeapon) continue;
        const dx=b.x-x,dz=b.z-z,d=dx*dx+dz*dz;
        if(d<bestD){bestD=d;best=b;}
      }
      return best;
    }

    function canPlaceWeaponOnTower(owner,type,x,z){
      const weapon=weaponTypeForBuild(type);
      if(weapon!=='cannon') return null;
      const tower=nearestEmptyWeaponTower(owner,x,z,'cannon');
      if(!tower) return {ok:false,msg:'Kanonen brauchen einen freien Waffenturm.'};
      return {ok:true,msg:'',snapX:tower.x,snapZ:tower.z,tower};
    }

    function snapBuildPosition(owner,x,z,type=getSelectedBuild()){
      const p=players[owner];
      if(type==='cannon_weapon'){
        const tower=nearestEmptyWeaponTower(owner,x,z,'cannon');
        if(tower) return {x:tower.x,z:tower.z};
      }
      const area=buildAreaSpan();
      x=clamp(x,p.x-area.x/2,p.x+area.x/2);
      z=clamp(z,-area.z/2,area.z/2);
      const grid=BUILD_GRID_UNIT;
      x=Math.round((x-p.x)/grid)*grid+p.x;
      z=Math.round(z/grid)*grid;
      return {x,z};
    }

    function setBuildPreviewFromLocal(localX,localZ){
      const p=getActive();
      const turn=getTurn();
      const selectedBuild=getSelectedBuild();
      const buildPreview=getBuildPreview();
      const pos=snapBuildPosition(turn, p.x + localX, localZ, selectedBuild);
      buildPreview.x=pos.x;
      buildPreview.z=pos.z;
      buildPreview.valid=canPlaceBlock(turn,selectedBuild,buildPreview.x,buildPreview.z,true).ok;
      if(selectedBuild==='wall') computeWallDrawPreview();
      if(selectedBuild==='wall') computeWallDrawPreview();
    }

    function setBuildPreviewFromWorld(x,z){
      const turn=getTurn();
      const selectedBuild=getSelectedBuild();
      const buildPreview=getBuildPreview();
      const pos=snapBuildPosition(turn,x,z,selectedBuild);
      buildPreview.x=pos.x;
      buildPreview.z=pos.z;
      buildPreview.valid=canPlaceBlock(turn,selectedBuild,buildPreview.x,buildPreview.z,true).ok;
    }

    function placeBuildFromSceneEvent(ev,showMessage=false){
      if(getPhase()!=='build') return;
      const rect=canvas.getBoundingClientRect();
      const sx=clamp(ev.clientX-rect.left,0,rect.width);
      const sy=clamp(ev.clientY-rect.top,0,rect.height);
      const nx=(sx/rect.width)*2-1;
      const ny=1-(sy/rect.height)*2;

      const hit=terrainHitFromScreenNormalized(nx,ny);
      if(!hit) return;
      setBuildPreviewFromWorld(hit[0],hit[2]);

      if(showMessage) toast(getBuildPreview().valid ? 'Vorschau gesetzt. Mit ✓ bauen.' : 'Position ungültig.');
      updateUI();
    }

    function placeBuildFromMapEvent(ev,showMessage=false){
      if(getPhase()!=='build') return;
      const canvasEl=$('mapOwn');
      const rect=canvasEl.getBoundingClientRect();
      const mx=clamp(ev.clientX-rect.left,0,rect.width);
      const my=clamp(ev.clientY-rect.top,0,rect.height);
      const span=buildAreaSpan();
      const localX=(mx/rect.width)*span.x - span.x/2;
      const localZ=(my/rect.height)*span.z - span.z/2;
      setBuildPreviewFromLocal(localX,localZ);
      if(showMessage) toast(getBuildPreview().valid ? 'Position gesetzt. Mit ✓ bauen.' : 'Position ungültig.');
      updateUI();
    }

    function resetBuildCamForTurn(){
      const p=getActive();
      buildCam.targetX=p.x;
      buildCam.targetZ=0;
      buildCam.yaw = getTurn()===0 ? -0.72 : Math.PI-0.72;
      buildCam.pitch = 0.58;
      buildCam.dist = 64;
    }

    function panBuildCam(dx,dy){
      // Baukamera: dx horizontal, dy jetzt invertiert für natürliches Hoch/Runter.
      const scale=0.11;
      const screenRight=[Math.sin(buildCam.yaw),0,-Math.cos(buildCam.yaw)];
      const screenUpGround=[Math.cos(buildCam.yaw),0,Math.sin(buildCam.yaw)];

      buildCam.targetX = clamp(buildCam.targetX - screenRight[0]*dx*scale - screenUpGround[0]*dy*scale, -92, 92);
      buildCam.targetZ = clamp(buildCam.targetZ - screenRight[2]*dx*scale - screenUpGround[2]*dy*scale, -44, 44);
    }

    return {
      projectToScreen,
      buildHandleWorldPos,
      pointerHitsBuildHandle,
      getBuildCameraBasis,
      terrainHitFromScreenNormalized,
      buildCenterWorldPoint,
      buildAreaSpan,
      buildGridPoint,
      wallLineNodes,
      wallSegmentsFromNodes,
      wallLineCost,
      footprintFor,
      nearestEmptyWeaponTower,
      canPlaceWeaponOnTower,
      snapBuildPosition,
      setBuildPreviewFromLocal,
      setBuildPreviewFromWorld,
      placeBuildFromSceneEvent,
      placeBuildFromMapEvent,
      resetBuildCamForTurn,
      panBuildCam
    };
  }

  return { create };
})();
