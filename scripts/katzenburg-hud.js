'use strict';

window.KATZENBURG_HUD = (() => {
  function create({
    $,
    types,
    fmtGold,
    getIncomeForPlayer,
    currentCameraState,
    ensureCameraRenderState,
    currentWeapon,
    weaponCfg
  }){
    function updateCamDebug({mode, phase, turn, activePlayer}){
      const box=$('camDebug');
      if(!box) return;
      const visible = mode==='cannon' && phase!=='build';
      box.classList.toggle('hidden', !visible);
      if(!visible) return;
      const s=currentCameraState(turn);
      ensureCameraRenderState(s);
      const weapon=currentWeapon(turn)==='firecatapult'?'Katapult':'Kanone';
      box.innerHTML =
        `<b>Kamera ${weapon}</b><br>`+
        `side: <b>${(s.camSide||0).toFixed(2)}</b> · render ${(s.camSideRender||0).toFixed(2)}<br>`+
        `height: <b>${(s.camHeight||0).toFixed(2)}</b> · render ${(s.camHeightRender||0).toFixed(2)}<br>`+
        `zoom: <b>${(s.camZoom||0).toFixed(2)}</b> · render ${(s.camZoomRender||0).toFixed(2)}<br>`+
        `yaw: <b>${Math.round(activePlayer.aimYaw||0)}°</b> · pitch: <b>${Math.round(activePlayer.aimPitch||0)}°</b><br>`+
        `<span class="small">Panel links: ←/→/↑/↓ und +/− einstellen, dann Screenshot schicken.</span>`;
    }

    function updateUI({mode, phase, turn, round, activePlayer, projectileCameraEnabled, wind, selectedBuild}){
      const p = activePlayer;
      const income = getIncomeForPlayer(p);

      const yawEl=$('yawVal');
      const pitchEl=$('pitchVal');
      const statusEl=$('status');
      const resEl=$('resourceLine');

      if(yawEl) yawEl.textContent=Math.round(p.aimYaw)+'°';
      if(pitchEl) pitchEl.textContent=Math.round(p.aimPitch)+'°';
      if(currentWeapon(turn)==='firecatapult' && p.aimPitch<35){p.aimPitch=35; if(pitchEl) pitchEl.textContent='35°';}
      const crossEl=$('cross');
      if(crossEl){
        crossEl.style.display = (mode==='cannon') ? 'block' : 'none';
        crossEl.style.top = currentWeapon(turn)==='firecatapult' ? '52%' : '55%';
      }

      if(statusEl){
        statusEl.innerHTML=`WebGL V112 · Zug ${round} · Spieler ${turn+1} · ${weaponCfg(turn).label} · Flugkamera ${projectileCameraEnabled?'AN':'AUS'} · Wind ${wind>=0?'→':'←'} ${Math.abs(wind).toFixed(2)}${phase==='build'?' · BAUEN: '+types[selectedBuild].label+' · Tatze = Verschieben · Feuer bleibt 5 Runden':' · Feuerknopf-Fix · Assets vollständig'}`;
      }
      if(resEl){
        resEl.innerHTML=`<strong>Gold ${fmtGold(p.gold)}</strong> · Einkommen +${fmtGold(income)} · Burg ${Math.round(p.hp)}%`;
      }
      if($('econGold')) $('econGold').textContent=fmtGold(p.gold);
      if($('econIncome')) $('econIncome').textContent=fmtGold(income);
      if($('econHp')) $('econHp').textContent=Math.round(p.hp)+'%';

      ['camCannon','camFree','camBird','camHit'].forEach(id=>$(id).classList.remove('active'));
      const m={cannon:'camCannon',free:'camFree',bird:'camBird',hit:'camHit',follow:'camHit',buildcam:'camFree'}[mode];
      if(m && $(m)) $(m).classList.add('active');
      if($('weaponCannon')) $('weaponCannon').classList.toggle('active', currentWeapon(turn)==='cannon');
      if($('weaponFire')) $('weaponFire').classList.toggle('active', currentWeapon(turn)==='firecatapult');
      if($('flightCamTopBtn')){
        $('flightCamTopBtn').classList.toggle('active', projectileCameraEnabled);
        $('flightCamTopBtn').textContent = projectileCameraEnabled ? '🎥 An' : '🎥 Aus';
      }
      if($('weaponPrevBtn')) $('weaponPrevBtn').classList.toggle('active', currentWeapon(turn)==='cannon');
      if($('weaponNextBtn')) $('weaponNextBtn').classList.toggle('active', currentWeapon(turn)==='firecatapult');

      const drawer=$('camDrawer'), handle=$('camDrawerHandle');
      if(drawer && handle){
        const show = mode==='cannon' && phase!=='build';
        drawer.style.display = show ? 'block' : 'none';
        handle.style.display = show ? 'flex' : 'none';
        handle.textContent = drawer.classList.contains('open') ? '◀' : '▶';
      }
      updateCamDebug({mode, phase, turn, activePlayer: p});
    }

    return { updateCamDebug, updateUI };
  }

  return { create };
})();
