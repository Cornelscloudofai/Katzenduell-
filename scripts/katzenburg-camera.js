'use strict';

window.KATZENBURG_CAMERA = (() => {
  function create({
    getMode,
    getProjectile,
    getProjectileCamSmooth,
    buildCam,
    getTurn,
    getLastHit,
    getW,
    getH,
    players,
    weaponTypes,
    currentWeapon,
    cannonPos,
    cameraAimDir,
    cameraFlatDir,
    currentCameraState,
    ensureCameraRenderState,
    projectileFollowCamera,
    norm,
    add,
    mul,
    clamp,
    terrainHeight,
    perspective,
    rad,
    lookAt,
    m4Mul
  }){
    function camera(){
      const mode=getMode();
      const turn=getTurn();
      const projectile=getProjectile();
      const lastHit=getLastHit();
      let eye,target;
      if(mode==='cannon'){
        const cp=cannonPos();
        const d=cameraAimDir(turn);
        const flat=cameraFlatDir(turn);
        const right=norm([-flat[2],0,flat[0]]);

        const camState=currentCameraState(turn);
        ensureCameraRenderState(camState);
        const camSide=camState.camSideRender||0;
        const camHeight=camState.camHeightRender||0;
        const camZoom=camState.camZoomRender||0;
        if(currentWeapon(turn)==='firecatapult'){
          const back=clamp(3.05-camZoom,1.65,14.5);
          eye=add(add(add(cp,mul(flat,-back)),mul(right,1.18 + camSide)),[0,1.42 + camHeight,0]);
          target=add(add(cp,mul(flat,74)),[0,0.42,0]);
        }else{
          const back=clamp(4.05-camZoom,1.90,14.5);
          eye=add(add(add(cp,mul(flat,-back)),mul(right,1.44 + camSide)),[0,0.88 + camHeight,0]);
          target=add(add(cp,mul(d,66)),[0,-5.4,0]);
        }
      }else if(mode==='follow'&&projectile){
        const sm=projectileFollowCamera(projectile, weaponTypes, getProjectileCamSmooth());
        eye=sm.eye;
        target=sm.target;
      }else if(mode==='buildcam'){
        const cp=Math.cos(buildCam.pitch), sp=Math.sin(buildCam.pitch);
        eye=[
          buildCam.targetX + Math.cos(buildCam.yaw)*cp*buildCam.dist,
          sp*buildCam.dist + 8,
          buildCam.targetZ + Math.sin(buildCam.yaw)*cp*buildCam.dist
        ];
        target=[buildCam.targetX, 2.5, buildCam.targetZ];
        buildCam.eye=eye.slice();
        buildCam.target=target.slice();
      }else if(mode==='bird'){
        eye=[0,92,66];target=[0,0,0];
      }else if(mode==='hit'&&lastHit.valid){
        const d=norm(lastHit.dir||[turn===0?1:-1,0,0]);
        const side=norm([-d[2],0,d[0]]);
        const dist=lastHit.kind==='firecatapult'?28:24;
        const sideOffset=lastHit.kind==='firecatapult'?5.0:3.5;
        const height=lastHit.kind==='firecatapult'?15.5:13.0;
        eye=[
          lastHit.x - d[0]*dist + side[0]*sideOffset,
          Math.max(terrainHeight(lastHit.x,lastHit.z)+height,lastHit.y+height),
          lastHit.z - d[2]*dist + side[2]*sideOffset
        ];
        target=[
          lastHit.x + d[0]*2.2,
          Math.max(terrainHeight(lastHit.x,lastHit.z)+1.6,lastHit.y+1.6),
          lastHit.z + d[2]*2.2
        ];
      }else{
        const p=players[turn];eye=[p.x-24*(turn===0?1:-1),20,30];target=[p.x,5,0];
      }
      let fov=58;
      if(mode==='cannon' && currentWeapon(turn)==='firecatapult') fov=50;
      const P=perspective(rad(fov),getW()/getH(),.1,820);
      const V=lookAt(eye,target,[0,1,0]);
      return m4Mul(P,V);
    }

    return { camera };
  }

  return { create };
})();
