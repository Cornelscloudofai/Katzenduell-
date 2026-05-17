'use strict';
(function(){
  function createFallbackBuildingRenderer({
    drawCube,
    modelCube,
    visualBlockRatio,
    visualBlockHeightScale,
    damageColor,
    players,
    types
  }){
    function drawFallbackBuildingBlock(block, VP){
      const ratio=visualBlockRatio(block);
      const hScale=visualBlockHeightScale(block);
      const drawH=block.h*hScale;
      const baseRaw=block.main?players[block.owner].color:types[block.type].color;
      const base=damageColor(baseRaw,block);
      const dark=0.65 + ratio*0.35;
      const ry=block.ry||0;

      drawCube(modelCube(block.x,block.y,block.z,block.w,drawH,block.d,ry),base,VP);

      if(block.type==='granary'){
        drawCube(modelCube(block.x,block.y+drawH+.02,block.z,block.w*1.02,.18,block.d*1.02,ry),[.72*dark,.58*dark,.28*dark],VP);
        drawCube(modelCube(block.x,block.y+drawH+.38,block.z,block.w*.88,.52,block.d*.88,ry),[.54*dark,.33*dark,.18*dark],VP);
      } else if(block.type==='barracks'){
        drawCube(modelCube(block.x,block.y+drawH+.02,block.z,block.w*1.04,.22,block.d*1.04,ry),[.68*dark,.64*dark,.58*dark],VP);
        drawCube(modelCube(block.x,block.y+drawH+.34,block.z,block.w*.96,.34,block.d*.40,ry),[.50*dark,.23*dark,.18*dark],VP);
      } else if(block.type==='catmint'){
        drawCube(modelCube(block.x,block.y+drawH+.02,block.z,block.w*1.02,.18,block.d*1.02,ry),[.52*dark,.84*dark,.68*dark],VP);
        drawCube(modelCube(block.x,block.y+drawH+.28,block.z,block.w*.40,.36,block.d*.40,ry),[.20*dark,.56*dark,.36*dark],VP);
      } else {
        drawCube(modelCube(block.x,block.y+drawH+.02,block.z,block.w*1.05,.16,block.d*1.05,ry),[.62*dark,.60*dark,.55*dark],VP);
      }

      // sichtbare Gebäudeschäden: Risse, dunkle Löcher, herausgebrochene Stücke
      if(ratio < 0.78 && block.type!=='wall'){
        drawCube(modelCube(block.x+block.w*.22,block.y+drawH*.55,block.z+block.d*.51,block.w*.20,drawH*.28,.12,ry),[.10,.09,.08],VP);
      }
      if(ratio < 0.52 && block.type!=='wall'){
        drawCube(modelCube(block.x-block.w*.24,block.y+drawH*.30,block.z-block.d*.51,block.w*.24,drawH*.26,.14,ry),[.13,.11,.09],VP);
        drawCube(modelCube(block.x+block.w*.10,block.y+.12,block.z+block.d*.10,block.w*.16,.20,block.d*.16,ry),[.30,.27,.23],VP);
      }
      if(ratio < 0.30 && block.type!=='wall'){
        drawCube(modelCube(block.x-block.w*.05,block.y+drawH*.78,block.z+block.d*.49,block.w*.30,drawH*.18,.16,ry),[.08,.07,.06],VP);
      }
    }

    return { drawFallbackBuildingBlock };
  }

  window.KATZENBURG_BUILDING_RENDERER = { createFallbackBuildingRenderer };
})();
