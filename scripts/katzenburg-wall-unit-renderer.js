'use strict';
(function(){
  function createWallUnitRenderer({
    players,
    initWallUnitDamageAssets,
    getWallUnitDamageAssetBuffers,
    matrix,
    drawAssetBuffer
  }){
    const { m4Identity, translate, rotY } = matrix;

    function wallUnitDamageStage(block){
      const ratio=Math.max(0,Math.min(1,(block.hp||0)/Math.max(1,block.maxHp||1)));
      if(ratio>0.75) return 0;
      if(ratio>0.50) return 1;
      if(ratio>0.25) return 2;
      return 3;
    }

    function drawWallUnitDamageBlock(block,VP){
      initWallUnitDamageAssets();
      const stage=String(wallUnitDamageStage(block));
      const wallUnitDamageAssetBuffers=getWallUnitDamageAssetBuffers();
      const chunks=wallUnitDamageAssetBuffers[stage] || wallUnitDamageAssetBuffers['0'];
      let model=m4Identity();
      model=translate(model,block.x,block.y,block.z);
      model=rotY(model,block.ry||0);
      const team=players[block.owner]?.color || [1,.6,.2];

      for(const chunk of chunks){
        let color=chunk.color;
        if(chunk.material && chunk.material.includes('stone')) {
          color=[chunk.color[0]*0.94+team[0]*0.025,chunk.color[1]*0.94+team[1]*0.025,chunk.color[2]*0.94+team[2]*0.025];
        }
        drawAssetBuffer(chunk.buf,chunk.count,model,color,VP);
      }
    }

    return { drawWallUnitDamageBlock };
  }

  window.KATZENBURG_WALL_UNIT_RENDERER = { createWallUnitRenderer };
})();
