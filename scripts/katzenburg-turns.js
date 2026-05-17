'use strict';

window.KATZENBURG_TURNS = (() => {
  function create({
    players,
    getTurn,
    setTurn,
    getRound,
    setRound,
    setProjectile,
    setProjectileCamSmooth,
    setLastHit,
    setParticles,
    setGroundFires,
    setScorchMarks,
    setWind,
    setPhase,
    setMode,
    setSelectedBuild,
    setBuildPanelOpen,
    active,
    cancelWallLine,
    generateTerrainConfig,
    invalidateTerrainMesh,
    makeWeaponStates,
    buildInitial,
    rebuildWallJoints,
    getIncomeForPlayer,
    normalizeGold,
    loadWeaponState,
    resetBuildCamForTurn,
    updateBuildPanelUI,
    updateUI,
    getTerrainSeed,
    getTerrainConfig,
    saveWeaponState,
    applyGroundFireTick,
    applyStartOfTurn,
    fmtGold,
    toast,
    random=Math.random
  }){
    function resetPlayer(p,i){
      p.gold=25.0;
      p.hp=100;
      p.aimYaw=0;
      p.aimPitch=35;
      p.weapon='cannon';
      p.weaponStates=makeWeaponStates();
      p.cannonAlive=true;
      p.catapultAlive=true;
      p.catapultAnim=0;
      p.cannonAnim=0;
      p.blocks=[];
      buildInitial(i);
      rebuildWallJoints(i);
      p.lastIncome=getIncomeForPlayer(p);
      normalizeGold(p);
    }

    function reset(){
      setTurn(0);
      setRound(1);
      setProjectile(null);
      setProjectileCamSmooth({eye:null,target:null});
      setLastHit({x:0,y:0,z:0,valid:false,kind:'cannon',dir:[1,0,0]});
      setParticles([]);
      setGroundFires([]);
      setScorchMarks([]);
      setWind((random()*2-1)*.42);
      setPhase('shoot');
      cancelWallLine();
      setMode('cannon');
      setSelectedBuild('wall');
      setBuildPanelOpen(false);

      generateTerrainConfig();
      invalidateTerrainMesh();

      players.forEach(resetPlayer);
      loadWeaponState(players[0], players[0].weapon);
      resetBuildCamForTurn();
      updateBuildPanelUI();
      updateUI();
      toast(`V132 gestartet · Seed ${getTerrainSeed()} · ${getTerrainConfig().plateauLabel}`);
    }

    function nextTurn(){
      const current=active();
      saveWeaponState(current, current.weapon);
      const fireTick=applyGroundFireTick();
      setTurn(1-getTurn());
      setRound(getRound()+1);
      setProjectile(null);
      setMode('cannon');
      setWind((random()*2-1)*.42);
      setBuildPanelOpen(false);
      setPhase('shoot');

      const next=active();
      loadWeaponState(next, next.weapon);
      resetBuildCamForTurn();
      const gain=applyStartOfTurn(next);
      updateBuildPanelUI();
      updateUI();

      let extra='';
      if(gain.burnEvents && gain.burnEvents.length) extra += ` · Brand ${gain.burnEvents.length}x`;
      if(fireTick.affected) extra += ` · Bodenfeuer ${fireTick.affected}x`;
      toast(`Spieler ${getTurn()+1}: +${fmtGold(gain.gold)} Gold · Kontostand ${fmtGold(next.gold)}${extra}`);
    }

    return { reset, nextTurn };
  }

  return { create };
})();
