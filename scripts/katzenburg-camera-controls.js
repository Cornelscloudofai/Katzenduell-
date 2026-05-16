'use strict';

window.KATZENBURG_CAMERA_CONTROLS = (() => {
  const HOLD_DELAY_MS = 260;
  const HOLD_INTERVAL_MS = 95;

  function create({
    $,
    document,
    clamp,
    getTurn,
    currentWeapon,
    currentCameraState,
    ensureCameraRenderState,
    updateUI,
    toast
  }){
    let camHoldTimer=null, camHoldDelayTimer=null;

    function stopCamHold(){
      if(camHoldTimer){ clearInterval(camHoldTimer); camHoldTimer=null; }
      if(camHoldDelayTimer){ clearTimeout(camHoldDelayTimer); camHoldDelayTimer=null; }
    }

    function nudgeCameraView(dx,dy,dz=0){
      const turn = getTurn();
      const s=currentCameraState(turn);
      ensureCameraRenderState(s);
      s.camSide = clamp((s.camSide||0)+dx,-2.8,2.8);
      s.camHeight = clamp((s.camHeight||0)+dy,-1.7,2.2);
      // V84: mehr Zoom-Out erlaubt, besonders fürs Katapult-Feintuning.
      s.camZoom = clamp((s.camZoom||0)+dz,-8.5,2.6);
      updateUI();
    }

    function resetCameraView(){
      const turn = getTurn();
      const s=currentCameraState(turn);
      ensureCameraRenderState(s);
      if(currentWeapon(turn)==='firecatapult'){
        s.camSide=0.28; s.camHeight=-0.24; s.camZoom=-7.56;
      }else{
        s.camSide=-0.35; s.camHeight=0.30; s.camZoom=-1.75;
      }
      updateUI();
      toast('Kameraposition auf Waffen-Standard gesetzt');
    }

    function bindCameraHold(id,dx,dy,dz=0){
      const el=$(id); if(!el) return;
      el.addEventListener('pointerdown',e=>{
        e.preventDefault(); e.stopPropagation();
        stopCamHold();
        if(id==='camResetBtn'){ resetCameraView(); return; }
        nudgeCameraView(dx,dy,dz);
        camHoldDelayTimer=setTimeout(()=>{camHoldTimer=setInterval(()=>nudgeCameraView(dx,dy,dz),HOLD_INTERVAL_MS)},HOLD_DELAY_MS);
      });
    }

    function bind(){
      ['pointerup','pointercancel'].forEach(ev=>document.addEventListener(ev,stopCamHold));
      bindCameraHold('camMoveLeft',-.18,0,0);
      bindCameraHold('camMoveRight',.18,0,0);
      bindCameraHold('camMoveUp',0,.12,0);
      bindCameraHold('camMoveDown',0,-.12,0);
      bindCameraHold('camZoomIn',0,0,.26);
      bindCameraHold('camZoomOut',0,0,-.42);
      $('camResetBtn').onclick=(e)=>{e.preventDefault();e.stopPropagation();resetCameraView();};
      $('camDrawerHandle').onclick=()=>{
        $('camDrawer').classList.toggle('open');
        updateUI();
      };
    }

    return { bind, stopCamHold, nudgeCameraView, resetCameraView };
  }

  return { create };
})();
