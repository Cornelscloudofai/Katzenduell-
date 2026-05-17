'use strict';
(function(){
  function createWeaponRenderer({
    players,
    getMode,
    getTurn,
    currentWeapon,
    weaponAvailable,
    cannonPos,
    aimDir,
    drawCannonModel,
    drawCatapultModel
  }){
    function drawWeaponAtSlot(playerIndex, weapon, VP, ownActive=false){
      const player=players[playerIndex];
      const oldWeapon=player.weapon;
      const oldYaw=player.aimYaw;
      const oldPitch=player.aimPitch;

      player.weapon=weapon;
      if(!ownActive){
        player.aimYaw=0;
        player.aimPitch=weapon==='firecatapult'?45:35;
      }

      const cp=cannonPos(playerIndex);
      const dir=aimDir(playerIndex);
      if(weapon==='firecatapult') drawCatapultModel(playerIndex,cp,dir,player.color,VP,ownActive);
      else drawCannonModel(cp,dir,player.color,VP,ownActive);

      player.weapon=oldWeapon;
      player.aimYaw=oldYaw;
      player.aimPitch=oldPitch;
    }

    function drawWeapons(VP){
      const mode=getMode();
      const turn=getTurn();
      for(let i=0;i<players.length;i++){
        if(weaponAvailable(i,'cannon')){
          drawWeaponAtSlot(i,'cannon',VP,mode==='cannon' && i===turn && currentWeapon(i)==='cannon');
        }
        if(weaponAvailable(i,'firecatapult')){
          drawWeaponAtSlot(i,'firecatapult',VP,mode==='cannon' && i===turn && currentWeapon(i)==='firecatapult');
        }
      }
    }

    return { drawWeapons };
  }

  window.KATZENBURG_WEAPON_RENDERER = { createWeaponRenderer };
})();
