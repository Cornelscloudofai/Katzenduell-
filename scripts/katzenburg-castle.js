'use strict';

window.KATZENBURG_CASTLE = (() => {
  function create({ types, players, terrainHeight, BUILD_GRID_UNIT }){
    function makeBlock(owner,type,x,z,y=0,main=false,opts={}){
      const t=types[type];
      const incomeActive = opts.incomeActive === undefined ? true : opts.incomeActive;
      const baseY = (opts.absoluteY===true) ? y : ((y===0 || y===undefined || y===null) ? terrainHeight(x,z) : y);
      return {owner,type,x,y:baseY,z,w:t.w,h:t.h,d:t.d,hp:t.hp,maxHp:t.hp,main,ry:0,incomeActive,onFire:0,fireOwner:null,...opts};
    }

    function buildInitial(i){
      const p=players[i], dir=i===0?1:-1, baseX=p.x;

      // V75: größerer Burgkern für echte 3D-Assets.
      // Ziel: keine überlappenden Mauern/Türme, größere Freiflächen für späteres Bauen.
      const halfX=12.4, halfZ=10.2;
      const frontX=baseX+dir*halfX;
      const rearX=baseX-dir*halfX;

      // V131: Startburg aus 1x1-Mauerblöcken, lückenlos im feinen Raster.
      const wallStep=BUILD_GRID_UNIT;
      for(let z=-halfZ; z<=halfZ+0.001; z+=wallStep){
        p.blocks.push(makeBlock(i,'wall',frontX,z,0,false,{ry:Math.PI/2,incomeActive:false}));
        p.blocks.push(makeBlock(i,'wall',rearX,z,0,false,{ry:Math.PI/2,incomeActive:false}));
      }
      for(let dx=-halfX; dx<=halfX+0.001; dx+=wallStep){
        p.blocks.push(makeBlock(i,'wall',baseX+dir*dx,halfZ,0,false,{ry:0,incomeActive:false}));
        p.blocks.push(makeBlock(i,'wall',baseX+dir*dx,-halfZ,0,false,{ry:0,incomeActive:false}));
      }

      // Hauptturm leicht hinten/innen, Waffenturm frei an der Frontseite.
      p.blocks.push(makeBlock(i,'tower',baseX-dir*8.4,-5.2,0,true,{incomeActive:false}));
      // Zwei Start-Waffentürme. Die Waffen sind logisch daran gebunden.
      p.blocks.push(makeBlock(i,'weapon_tower',baseX+dir*10.9,7.9,0,false,{incomeActive:false,isWeaponTower:true,weaponSlot:'cannon',hasWeapon:'cannon'}));
      p.blocks.push(makeBlock(i,'weapon_tower',baseX+dir*10.9,-7.9,0,false,{incomeActive:false,isWeaponTower:true,weaponSlot:'firecatapult',hasWeapon:'firecatapult'}));

      // Gebäude bewusst außerhalb des Mauerrings verteilen.
      p.blocks.push(makeBlock(i,'fish',baseX-dir*24.0,-17.0,0,false,{incomeActive:false}));
      p.blocks.push(makeBlock(i,'workshop',baseX-dir*25.5,17.0,0,false,{incomeActive:false}));
      p.blocks.push(makeBlock(i,'granary',baseX+dir*23.5,-18.5,0,false,{incomeActive:false}));
      p.blocks.push(makeBlock(i,'barracks',baseX+dir*25.0,18.0,0,false,{incomeActive:false}));
      p.blocks.push(makeBlock(i,'catmint',baseX-dir*19.5,0,0,false,{incomeActive:false}));

      // Kleines Außenhaus / Testgebäude mit viel Abstand.
      p.blocks.push(makeBlock(i,'granary',baseX+dir*16.0,23.0,0,false,{w:3.4,h:2.7,d:3.2,incomeActive:false}));
    }

    return { makeBlock, buildInitial };
  }

  return { create };
})();
