'use strict';
(function(){
  function createTowerRenderer({
    players,
    towerVisualScale,
    weaponTowerVisualScale,
    initTowerAssets,
    getTowerAssetBuffers,
    matrix,
    drawAssetBuffer
  }){
    const { m4Identity, translate, rotY, scale } = matrix;

    function towerDamageStage(block){
      const ratio = Math.max(0, Math.min(1, (block.hp||0) / Math.max(1, block.maxHp||1)));
      if(ratio > 0.75) return 0;
      if(ratio > 0.50) return 1;
      if(ratio > 0.25) return 2;
      return 3;
    }

    function towerAssetModelMatrix(block,type){
      // V78: sichtbare Proportionen: Hauptturm 200 %, Waffenturm 150 %.
      const scaleVal = type==='weapon_tower' ? weaponTowerVisualScale : towerVisualScale;
      let model=m4Identity();
      model=translate(model,block.x,block.y,block.z);
      model=rotY(model,block.ry||0);
      model=scale(model,scaleVal,scaleVal,scaleVal);
      return model;
    }

    function drawTowerAssetBlock(block,VP){
      initTowerAssets();
      const typeBase = block.type==='weapon_tower' ? 'weapon_tower' : 'main_tower';
      const stage = towerDamageStage(block);
      const type = `${typeBase}_${stage}`;
      const towerAssetBuffers = getTowerAssetBuffers();
      const chunks = towerAssetBuffers[type] || towerAssetBuffers[`${typeBase}_0`];
      const model = towerAssetModelMatrix(block,typeBase);
      const team = players[block.owner]?.color || [1,.6,.2];

      for(const chunk of chunks){
        // V81: alte braune Platzhalter-Holzelemente im Waffenturm ausblenden.
        // Dort sollen nur noch die echten Waffen stehen.
        if(typeBase==='weapon_tower' && chunk.material && (chunk.material==='oak_wood' || chunk.material==='dark_wood')) continue;
        let color = chunk.color;
        if(chunk.material && (chunk.material.includes('blue') || chunk.material.includes('orange') || chunk.material.includes('banner') || chunk.material.includes('roof'))){
          color=[team[0]*0.72+0.08, team[1]*0.72+0.10, team[2]*0.72+0.18];
        }
        drawAssetBuffer(chunk.buf,chunk.count,model,color,VP);
      }
    }

    return { drawTowerAssetBlock };
  }

  window.KATZENBURG_TOWER_RENDERER = { createTowerRenderer };
})();
