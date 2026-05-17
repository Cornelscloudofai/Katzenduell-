'use strict';
(function(){
  function create({
    $,
    document,
    window,
    setMode,
    getPhase,
    active,
    getTurn,
    types,
    fmtGold,
    fire,
    reset,
    nextTurn,
    toggleBuildMode,
    resetBuildCamForTurn,
    switchWeapon,
    switchWeaponStep,
    weaponAvailable,
    updateUI,
    toast,
    toggleProjectileCamera,
    setSelectedBuild,
    getSelectedBuild,
    getBuildPreview,
    cancelWallLine,
    centerBuildPreview,
    initBuildPreview,
    updateBuildPanelUI,
    repairWallOneHp,
    placeBuildFromMapEvent,
    rotateBuildPreview,
    confirmBuildPreview,
    saveWeaponState,
    nudge
  }){
    let buildMapDrag=false;

    function bindCameraButtons(){
      $('camCannon').onclick=()=>{setMode('cannon');updateUI()};
      $('camFree').onclick=()=>{setMode(getPhase()==='build'?'buildcam':'free'); if(getPhase()==='build') resetBuildCamForTurn(); updateUI()};
      $('camBird').onclick=()=>{setMode('bird');updateUI();};
      $('camHit').onclick=()=>{setMode('hit');updateUI()};
      $('camDrawerHandle').onclick=()=>{
        $('camDrawer').classList.toggle('open');
        updateUI();
      };
    }

    function bindWeaponButtons(){
      $('weaponCannon').onclick=()=>{ switchWeapon('cannon'); updateUI(); toast('Waffe: Kanone'); };
      $('weaponFire').onclick=()=>{ switchWeapon('firecatapult'); updateUI(); toast('Waffe: Feuerkatapult – Kamera bleibt am Horizont, Winkel steuert nur den Schuss.'); };
      if($('weaponPrevBtn')) $('weaponPrevBtn').onclick=()=>{ if(!weaponAvailable(getTurn(),'cannon')){toast('Keine Kanone vorhanden.');return;} switchWeapon('cannon'); updateUI(); toast('Waffe: Kanone'); };
      if($('weaponNextBtn')) $('weaponNextBtn').onclick=()=>{ if(!weaponAvailable(getTurn(),'firecatapult')){toast('Kein Katapult vorhanden.');return;} switchWeapon('firecatapult'); updateUI(); toast('Waffe: Feuerkatapult'); };
      $('weaponPrevBtn').onclick=()=>switchWeaponStep(-1);
      $('weaponNextBtn').onclick=()=>switchWeaponStep(1);
      if($('flightCamTopBtn')) $('flightCamTopBtn').onclick=()=>{
        const enabled=toggleProjectileCamera();
        updateUI();
        toast(enabled?'Flugkamera AN':'Flugkamera AUS – Schuss bleibt aus Waffenperspektive sichtbar');
      };
    }

    function bindBuildChoices(){
      document.querySelectorAll('.buildChoice').forEach(btn=>{
        btn.onclick=()=>{
          if(btn.id==='repairWallBtn'){
            repairWallOneHp();
            return;
          }
          setSelectedBuild(btn.dataset.type);
          cancelWallLine();
          centerBuildPreview();
          if(!getBuildPreview().valid) initBuildPreview();
          updateBuildPanelUI();
          const selectedBuild=getSelectedBuild();
          toast(selectedBuild==='wall' ? 'Mauer 1x1: ✓ setzt Startpunkt, zweites ✓ baut Linie. 1 Gold pro Block.' : `${types[selectedBuild].label}: Kosten ${fmtGold(types[selectedBuild].cost)} · Einkommen +${fmtGold(types[selectedBuild].income||0)}${types[selectedBuild].heal?` · Heilung ${fmtGold(types[selectedBuild].heal)}`:''} · Tatze ziehen zum Platzieren.`);
        };
      });
    }

    function bindBuildMap(){
      const mapOwn=$('mapOwn');
      mapOwn.addEventListener('pointerdown',e=>{
        if(getPhase()!=='build') return;
        e.preventDefault();
        e.stopPropagation();
        buildMapDrag=true;
        mapOwn.setPointerCapture?.(e.pointerId);
        placeBuildFromMapEvent(e,true);
      });
      mapOwn.addEventListener('pointermove',e=>{
        if(getPhase()==='build' && buildMapDrag){
          e.preventDefault();
          e.stopPropagation();
          placeBuildFromMapEvent(e,false);
        }
      });
      mapOwn.addEventListener('pointerup',e=>{
        buildMapDrag=false;
        try{mapOwn.releasePointerCapture?.(e.pointerId)}catch(_){ }
      });
      mapOwn.addEventListener('pointercancel',()=>{buildMapDrag=false;});
    }

    function bindKeyboard(){
      window.addEventListener('keydown',e=>{
        if(e.key==='1')setMode('cannon'); if(e.key==='2')setMode('free'); if(e.key==='3')setMode('bird'); if(e.key==='4')setMode('hit');
        if(e.key.toLowerCase()==='f')fire(); if(e.key.toLowerCase()==='r')reset(); if(e.key.toLowerCase()==='n')nextTurn(); if(e.key.toLowerCase()==='b')toggleBuildMode();
        if(e.key==='ArrowLeft'||e.key.toLowerCase()==='a')nudge(-1,0);
        if(e.key==='ArrowRight'||e.key.toLowerCase()==='d')nudge(1,0);
        if(e.key==='ArrowUp'||e.key.toLowerCase()==='w')nudge(0,.8);
        if(e.key==='ArrowDown'||e.key.toLowerCase()==='s')nudge(0,-.8);
      });
    }

    function bind(){
      $('fireBtn').onclick=fire;
      $('resetBtn').onclick=reset;
      $('swapBtn').onclick=nextTurn;
      $('buildBtn').onclick=()=>toggleBuildMode();
      $('rotateBuildBtn').onclick=rotateBuildPreview;
      $('confirmBuildBtn').onclick=confirmBuildPreview;
      $('power').addEventListener('input',()=>{ saveWeaponState(active(), active().weapon); updateUI(); });
      bindCameraButtons();
      bindWeaponButtons();
      bindBuildChoices();
      bindBuildMap();
      bindKeyboard();
    }

    return { bind };
  }

  window.KATZENBURG_BINDINGS = { create };
})();
