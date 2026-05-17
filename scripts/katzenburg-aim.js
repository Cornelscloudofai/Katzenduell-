'use strict';

window.KATZENBURG_AIM = (() => {
  function create({
    players,
    getTurn,
    baseYaw,
    currentWeapon,
    weaponSlotBlock,
    rad,
    norm,
    add,
    mul,
    terrainHeight,
    weaponTowerTopY,
    CATAPULT_BASE_OFFSET_FROM_CP,
    CANNON_BASE_OFFSET_FROM_CP
  }){
    function aimDir(i=getTurn()){
      const p=players[i], yaw=rad(baseYaw(i)+p.aimYaw), pitch=rad(p.aimPitch);
      return norm([Math.cos(pitch)*Math.cos(yaw),Math.sin(pitch),Math.cos(pitch)*Math.sin(yaw)]);
    }

    function aimDirFlat(i=getTurn()){
      const p=players[i], yaw=rad(baseYaw(i)+p.aimYaw);
      return norm([Math.cos(yaw),0,Math.sin(yaw)]);
    }

    function cameraAimDir(i=getTurn()){
      // Wichtig: Beim Feuerkatapult bleibt die Kamera am Horizont.
      // Der Höhenwinkel verändert nur die Schussparabel, nicht den Blick nach oben.
      if(currentWeapon(i)==='firecatapult'){
        const flat=aimDirFlat(i);
        return norm([flat[0], -0.08, flat[2]]); // minimal nach unten aufs Schlachtfeld, nie in den Himmel
      }
      return aimDir(i);
    }

    function cameraFlatDir(i=getTurn()){
      return aimDirFlat(i);
    }

    function predictGroundImpact(pos, vel, gravity){
      const dt=0.08;
      let prev=pos.slice();
      for(let t=dt;t<=12;t+=dt){
        const p=[pos[0]+vel[0]*t, pos[1]+vel[1]*t-0.5*gravity*t*t, pos[2]+vel[2]*t];
        const gy=terrainHeight(p[0],p[2]);
        if(p[1]<=gy) return [p[0],gy,p[2]];
        prev=p;
      }
      return [prev[0], terrainHeight(prev[0],prev[2]), prev[2]];
    }

    function cannonPos(i=getTurn()){
      const weapon=currentWeapon(i);
      const holder=weaponSlotBlock(i,weapon);
      if(holder.isWeaponTower){
        const platformY = weaponTowerTopY(holder);
        const offset = weapon==='firecatapult' ? CATAPULT_BASE_OFFSET_FROM_CP : CANNON_BASE_OFFSET_FROM_CP;
        return [holder.x, platformY + offset, holder.z];
      }
      if(weapon==='firecatapult' && holder.type==='catapult_weapon'){
        return [holder.x, holder.y + 0.18, holder.z];
      }
      return [holder.x,holder.y+holder.h+0.75,holder.z];
    }

    function smoothProjectileCamera(rawEye,rawTarget,state){
      if(!state.eye || !state.target){
        state.eye=rawEye.slice();
        state.target=rawTarget.slice();
        return {eye:rawEye,target:rawTarget};
      }
      const k=0.16;
      for(let i=0;i<3;i++){
        state.eye[i] += (rawEye[i]-state.eye[i])*k;
        state.target[i] += (rawTarget[i]-state.target[i])*k;
      }
      return {eye:state.eye.slice(),target:state.target.slice()};
    }

    function projectileFollowCamera(projectile, weaponTypes, state){
      const dir=norm(projectile.vel);
      const flat=norm([dir[0],0,dir[2]]);
      const side=norm([-flat[2],0,flat[0]]);
      const gravity = projectile.kind==='firecatapult' ? weaponTypes.firecatapult.gravity : weaponTypes.cannon.gravity;
      const impact = predictGroundImpact(projectile.pos, projectile.vel, gravity);
      const rawEye=add(add(add(projectile.pos,mul(dir,-8.5)),mul(side,2.3)),[0,3.8,0]);
      const rawTarget=[
        projectile.pos[0]*0.30 + impact[0]*0.70,
        Math.max(1.1, projectile.pos[1]*0.24 + impact[1]*0.20),
        projectile.pos[2]*0.30 + impact[2]*0.70
      ];
      return smoothProjectileCamera(rawEye,rawTarget,state);
    }

    return {
      aimDir,
      aimDirFlat,
      cameraAimDir,
      cameraFlatDir,
      predictGroundImpact,
      cannonPos,
      projectileFollowCamera
    };
  }

  return { create };
})();
