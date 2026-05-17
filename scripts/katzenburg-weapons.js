'use strict';

window.KATZENBURG_WEAPONS = (() => {
  // V76: zentrale Höhen-/Skalierungslogik für Turm-Assets.
  // So vermeiden wir, dass Waffen schweben oder Türme kleiner als Mauern wirken.
  const TOWER_VISUAL_SCALE = 2.00;          // V78: Hauptturm heroisch, ca. doppelte Masse
  const WEAPON_TOWER_VISUAL_SCALE = 1.50;   // V78: Waffenturm 150 %
  const WEAPON_SCALE = 0.70;                // V78: Kanone/Katapult 70 %
  const WALL_LENGTH_SCALE = 1.22;            // V79: optisch längere Mauern, schließt Segmentlücken
  const WALL_HEIGHT_SCALE = 1.00;

  const WEAPON_TOWER_PLATFORM_LOCAL_Y = 4.62; // V81: reale obere Montagefläche des Waffenturms
  const WEAPON_TOWER_PAD_RADIUS = 1.16;      // lokale Radiusgröße der zentralen Waffenplattform
  const WEAPON_TOWER_PAD_HEIGHT = 0.20;      // lokale Höhe der Abdeck-/Montageplattform
  const CANNON_BASE_OFFSET_FROM_CP = 0.18;   // V81: Kanone sitzt näher auf der Plattform
  const CATAPULT_BASE_OFFSET_FROM_CP = 0.20; // V81: Katapult sitzt höher und sauber auf dem Turm

  function visualDimensionsForBlock(b){
    // V80: zentrale effektive Treffer-/Kollisionsgröße.
    // Wenn ein Modell optisch skaliert wird, muss die Hitbox mitziehen.
    let w=b.w, h=b.h, d=b.d;
    if(b.type==='wall'){
      w *= WALL_LENGTH_SCALE;
      h *= WALL_HEIGHT_SCALE;
    }
    return {w,h,d};
  }

  function weaponTowerTopY(tower){
    // V81: nicht mehr die alte innere Holzstruktur als Referenz,
    // sondern die obere zentrale Montagefläche des Waffenturms.
    return (tower?.y||0) + WEAPON_TOWER_PLATFORM_LOCAL_Y * WEAPON_TOWER_VISUAL_SCALE;
  }

  function makeWeaponStates(){
    // V82: Standard-Waffenperspektive näher am gewünschten Screenshot:
    // Waffe dominant links/vorne, Ziel/Fadenkreuz bleibt frei.
    return {
      cannon:{aimYaw:0, aimPitch:35, power:62, camSide:-0.35, camHeight:0.30, camZoom:-1.75, camSideRender:-0.35, camHeightRender:0.30, camZoomRender:-1.75},
      firecatapult:{aimYaw:0, aimPitch:45, power:88, camSide:0.28, camHeight:-0.24, camZoom:-7.56, camSideRender:0.28, camHeightRender:-0.24, camZoomRender:-7.56}
    };
  }

  function createAccessors({
    players,
    weaponTypes,
    getTurn,
    terrainHeight,
    loadWeaponState,
    switchWeapon,
    updateUI,
    toast
  }){
    function baseYaw(i=getTurn()){return i===0?0:180}
    function active(){return players[getTurn()]}
    function enemyIndex(){return 1-getTurn()}
    function currentWeapon(i=getTurn()){return players[i].weapon || 'cannon'}
    function isWeaponBuildType(type){return type==='cannon_weapon'||type==='catapult_weapon'}
    function weaponTypeForBuild(type){return type==='cannon_weapon'?'cannon':(type==='catapult_weapon'?'firecatapult':null)}
    function weaponLabel(type){return type==='cannon'?'Kanone':'Katapult'}
    function setPlayerWeaponState(p,weapon,alive){ if(weapon==='firecatapult') p.catapultAlive=alive; else p.cannonAlive=alive; }
    function towerForWeapon(i=getTurn(), weapon=currentWeapon(i)){
      const p=players[i];
      return p.blocks.find(b=>b.isWeaponTower && b.weaponSlot===weapon && b.hp>0) || null;
    }
    function groundCatapultBlock(i=getTurn()){
      return players[i].blocks.find(b=>b.type==='catapult_weapon' && b.hp>0) || null;
    }
    function weaponAvailable(i=getTurn(), weapon=currentWeapon(i)){
      const p=players[i];
      if(weapon==='cannon') return p.cannonAlive!==false && !!towerForWeapon(i,'cannon');
      if(weapon==='firecatapult') return p.catapultAlive!==false && (!!towerForWeapon(i,'firecatapult') || !!groundCatapultBlock(i));
      return false;
    }
    function ensureActiveWeaponAvailable(i=getTurn()){
      const p=players[i];
      if(weaponAvailable(i,currentWeapon(i))) return;
      if(weaponAvailable(i,'cannon')){ p.weapon='cannon'; loadWeaponState(p,'cannon'); return; }
      if(weaponAvailable(i,'firecatapult')){ p.weapon='firecatapult'; loadWeaponState(p,'firecatapult'); return; }
    }
    function weaponOrder(){return ['cannon','firecatapult']}
    function switchWeaponStep(dir=1){
      const order=weaponOrder();
      const turn=getTurn();
      const idx=Math.max(0,order.indexOf(currentWeapon(turn)));
      switchWeapon(order[(idx+dir+order.length)%order.length]);
      updateUI();
      toast(currentWeapon(turn)==='firecatapult'?'Waffe: Feuerkatapult':'Waffe: Kanone');
    }
    function weaponSlotBlock(i=getTurn(), weapon=currentWeapon(i)){
      const p=players[i];
      const tower=towerForWeapon(i,weapon);
      if(tower) return tower;
      if(weapon==='firecatapult'){
        const ground=groundCatapultBlock(i);
        if(ground) return ground;
      }
      return p.blocks.find(b=>b.main) || {x:p.x,z:p.z,y:terrainHeight(p.x,0),h:5};
    }
    function weaponCfg(i=getTurn()){return weaponTypes[currentWeapon(i)] || weaponTypes.cannon}
    function isFireWeapon(i=getTurn()){return currentWeapon(i)==='firecatapult'}

    return {
      baseYaw,
      active,
      enemyIndex,
      currentWeapon,
      isWeaponBuildType,
      weaponTypeForBuild,
      weaponLabel,
      setPlayerWeaponState,
      towerForWeapon,
      groundCatapultBlock,
      weaponAvailable,
      ensureActiveWeaponAvailable,
      weaponOrder,
      switchWeaponStep,
      weaponSlotBlock,
      weaponCfg,
      isFireWeapon
    };
  }

  function create({ players, getTurn, getActive, getCurrentWeapon, clamp, $ }){
    function ensureCameraRenderState(s){
      if(typeof s.camSide!=='number') s.camSide=0;
      if(typeof s.camHeight!=='number') s.camHeight=0;
      if(typeof s.camZoom!=='number') s.camZoom=0;
      if(typeof s.camSideRender!=='number') s.camSideRender=s.camSide;
      if(typeof s.camHeightRender!=='number') s.camHeightRender=s.camHeight;
      if(typeof s.camZoomRender!=='number') s.camZoomRender=s.camZoom;
    }
    function ensureWeaponStates(p){
      if(!p.weaponStates) p.weaponStates = makeWeaponStates();
      if(!p.weaponStates.cannon) p.weaponStates.cannon = {aimYaw:0, aimPitch:35, power:62, camSide:-0.35, camHeight:0.30, camZoom:-1.75, camSideRender:-0.35, camHeightRender:0.30, camZoomRender:-1.75};
      if(!p.weaponStates.firecatapult) p.weaponStates.firecatapult = {aimYaw:0, aimPitch:45, power:88, camSide:0.28, camHeight:-0.24, camZoom:-7.56, camSideRender:0.28, camHeightRender:-0.24, camZoomRender:-7.56};
      ensureCameraRenderState(p.weaponStates.cannon);
      ensureCameraRenderState(p.weaponStates.firecatapult);
    }
    function minPitchForWeapon(weapon=getCurrentWeapon(getTurn())){
      return weapon==='firecatapult' ? 35 : 8;
    }
    function clampPitchForWeapon(value, weapon=getCurrentWeapon(getTurn())){
      return clamp(value, minPitchForWeapon(weapon), 70);
    }
    function saveWeaponState(p=getActive(), weapon=p.weapon){
      ensureWeaponStates(p);
      const s = p.weaponStates[weapon];
      s.aimYaw = p.aimYaw;
      s.aimPitch = p.aimPitch;
      if($('power')) s.power = Number($('power').value || s.power || 62);
    }
    function loadWeaponState(p=getActive(), weapon=p.weapon){
      ensureWeaponStates(p);
      const s = p.weaponStates[weapon];
      p.aimYaw = s.aimYaw;
      p.aimPitch = clampPitchForWeapon(s.aimPitch, weapon);
      s.aimPitch = p.aimPitch;
      if($('power')) $('power').value = s.power;
    }
    function switchWeapon(weapon){
      const p = getActive();
      saveWeaponState(p, p.weapon);
      p.weapon = weapon;
      loadWeaponState(p, weapon);
    }
    function currentCameraState(i=getTurn()){
      const p=players[i];
      ensureWeaponStates(p);
      return p.weaponStates[p.weapon];
    }
    function smoothCameraStates(dt){
      for(const p of players){
        ensureWeaponStates(p);
        for(const key of ['cannon','firecatapult']){
          const s=p.weaponStates[key];
          ensureCameraRenderState(s);
          const k=Math.min(1,dt*8.0);
          s.camSideRender += (s.camSide - s.camSideRender)*k;
          s.camHeightRender += (s.camHeight - s.camHeightRender)*k;
          s.camZoomRender += (s.camZoom - s.camZoomRender)*k;
        }
      }
    }

    return {
      TOWER_VISUAL_SCALE,
      WEAPON_TOWER_VISUAL_SCALE,
      WEAPON_SCALE,
      WALL_LENGTH_SCALE,
      WALL_HEIGHT_SCALE,
      WEAPON_TOWER_PLATFORM_LOCAL_Y,
      WEAPON_TOWER_PAD_RADIUS,
      WEAPON_TOWER_PAD_HEIGHT,
      CANNON_BASE_OFFSET_FROM_CP,
      CATAPULT_BASE_OFFSET_FROM_CP,
      visualDimensionsForBlock,
      weaponTowerTopY,
      makeWeaponStates,
      ensureCameraRenderState,
      ensureWeaponStates,
      saveWeaponState,
      loadWeaponState,
      switchWeapon,
      currentCameraState,
      smoothCameraStates,
      minPitchForWeapon,
      clampPitchForWeapon
    };
  }

  return { create, createAccessors };
})();
