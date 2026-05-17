'use strict';
(function(){
  function create({
    $,
    players,
    getDPR,
    getMode,
    getPhase,
    getTurn,
    getRound,
    getActivePlayer,
    getProjectileCameraEnabled,
    getWind,
    getSelectedBuild,
    getLastHit,
    getBuildPreview,
    enemyIndex,
    buildAreaSpan,
    visualBlockRatio,
    clamp,
    types,
    fmtGold,
    getIncomeForPlayer,
    currentCameraState,
    ensureCameraRenderState,
    currentWeapon,
    weaponCfg,
    getLastTime,
    setLastTime,
    addFxClock,
    smoothCameraStates,
    updateProjectile,
    updateParticles,
    drawScene,
    requestAnimationFrame
  }){
    const mapRenderer = window.KATZENBURG_MAP.create({
      getDPR,
      getTurn,
      getPhase,
      getPlayers: () => players,
      getLastHit,
      getBuildPreview,
      enemyIndex,
      buildAreaSpan,
      visualBlockRatio,
      clamp
    });
    const { drawMap } = mapRenderer;

    const hud = window.KATZENBURG_HUD.create({
      $,
      types,
      fmtGold,
      getIncomeForPlayer,
      currentCameraState,
      ensureCameraRenderState,
      currentWeapon,
      weaponCfg
    });

    function updateCamDebug(){
      hud.updateCamDebug({mode:getMode(), phase:getPhase(), turn:getTurn(), activePlayer: getActivePlayer()});
    }

    function updateUI(){
      hud.updateUI({
        mode:getMode(),
        phase:getPhase(),
        turn:getTurn(),
        round:getRound(),
        activePlayer:getActivePlayer(),
        projectileCameraEnabled:getProjectileCameraEnabled(),
        wind:getWind(),
        selectedBuild:getSelectedBuild()
      });
    }

    function loop(now){
      const dt=Math.min(.04,(now-getLastTime())/1000);
      setLastTime(now);
      addFxClock(dt);
      players.forEach(p=>{
        p.catapultAnim=Math.max(0,(p.catapultAnim||0)-dt*1.95);
        p.cannonAnim=Math.max(0,(p.cannonAnim||0)-dt*4.2);
      });
      smoothCameraStates(dt);
      updateProjectile(dt);
      updateParticles(dt);
      drawScene();
      drawMap($('mapOwn'),false);
      drawMap($('mapEnemy'),true);
      updateUI();
      requestAnimationFrame(loop);
    }

    return { updateCamDebug, updateUI, loop, drawMap };
  }

  window.KATZENBURG_RUNTIME = { create };
})();
