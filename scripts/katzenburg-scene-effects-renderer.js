'use strict';
(function(){
  function createSceneEffectsRenderer({
    getBurnTime,
    drawScorchMarks,
    drawBurningStructures,
    drawGroundFires,
    drawProjectile,
    drawParticles
  }){
    function drawSceneEffects(VP){
      drawScorchMarks(VP);

      const burnTime=getBurnTime();
      drawBurningStructures(VP,burnTime);
      drawGroundFires(VP,burnTime);

      drawProjectile(VP);
      drawParticles(VP);
    }

    return { drawSceneEffects };
  }

  window.KATZENBURG_SCENE_EFFECTS_RENDERER = { createSceneEffectsRenderer };
})();
