'use strict';
(function(){
  function create({
    $,
    document,
    canvas,
    active,
    getMode,
    getPhase,
    getTurn,
    currentWeapon,
    clamp,
    clampPitchForWeapon,
    saveWeaponState,
    updateUI,
    pointerHitsBuildHandle,
    placeBuildFromSceneEvent,
    panBuildCam,
    currentCameraState,
    ensureCameraRenderState,
    toast
  }){
    let drag=null;
    let buildObjectDrag=false;
    let aimHoldTimer=null,aimHoldDelayTimer=null;
    let camHoldTimer=null, camHoldDelayTimer=null;

    function stopAimHold(){
      if(aimHoldTimer){clearInterval(aimHoldTimer);aimHoldTimer=null}
      if(aimHoldDelayTimer){clearTimeout(aimHoldDelayTimer);aimHoldDelayTimer=null}
    }

    function nudge(dYaw,dPitch){
      active().aimYaw=clamp(active().aimYaw+dYaw,-110,110);
      active().aimPitch=clampPitchForWeapon(active().aimPitch+dPitch);
      saveWeaponState(active(), active().weapon);
      updateUI();
    }

    function bindHold(id,dy,dp){
      const el=$(id); if(!el)return;
      el.addEventListener('pointerdown',e=>{
        e.preventDefault();e.stopPropagation();stopAimHold();nudge(dy,dp);
        aimHoldDelayTimer=setTimeout(()=>{aimHoldTimer=setInterval(()=>nudge(dy,dp),95)},320);
      });
    }

    function bindAimControls(){
      ['pointerup','pointercancel'].forEach(ev=>document.addEventListener(ev,stopAimHold));
      bindHold('aimLeft',-.6,0);bindHold('aimRight',.6,0);bindHold('aimUp',0,.45);bindHold('aimDown',0,-.45);
    }

    function bindCanvasDrag(){
      canvas.addEventListener('pointerdown',e=>{
        drag={id:e.pointerId,x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY,startYaw:active().aimYaw,startPitch:active().aimPitch,mode:'camera'};
        canvas.setPointerCapture(e.pointerId);

        if(getPhase()==='build'){
          if(pointerHitsBuildHandle(e)){
            drag.mode='build-object';
            buildObjectDrag=true;
            placeBuildFromSceneEvent(e,true);
          }else{
            drag.mode='build-camera';
            buildObjectDrag=false;
          }
        }
      });
      canvas.addEventListener('pointermove',e=>{
        if(!drag||drag.id!==e.pointerId)return;
        const dx=e.clientX-drag.sx,dy=e.clientY-drag.sy;
        if(getMode()==='cannon'){
          active().aimYaw+=(clamp(drag.startYaw+dx*.16,-110,110)-active().aimYaw)*.35;
          active().aimPitch+=(clampPitchForWeapon(drag.startPitch-dy*.12)-active().aimPitch)*.35;
          saveWeaponState(active(), active().weapon);
        }else if(getPhase()==='build' && drag.mode==='build-object' && buildObjectDrag){
          placeBuildFromSceneEvent(e,false);
        }else if((getPhase()==='build' && drag.mode==='build-camera') || getMode()==='buildcam'){
          panBuildCam(e.clientX-drag.x, e.clientY-drag.y);
        }
        drag.x=e.clientX; drag.y=e.clientY;
      });
      canvas.addEventListener('pointerup',()=>{drag=null;buildObjectDrag=false});
      canvas.addEventListener('pointercancel',()=>{drag=null;buildObjectDrag=false});
    }

    function stopCamHold(){
      if(camHoldTimer){clearInterval(camHoldTimer);camHoldTimer=null}
      if(camHoldDelayTimer){clearTimeout(camHoldDelayTimer);camHoldDelayTimer=null}
    }

    function nudgeCameraView(dx,dy,dz=0){
      const s=currentCameraState(getTurn());
      ensureCameraRenderState(s);
      s.camSide = clamp((s.camSide||0)+dx,-2.8,2.8);
      s.camHeight = clamp((s.camHeight||0)+dy,-1.7,2.2);
      // V84: mehr Zoom-Out erlaubt, besonders fürs Katapult-Feintuning.
      s.camZoom = clamp((s.camZoom||0)+dz,-8.5,2.6);
      updateUI();
    }

    function resetCameraView(){
      const turn=getTurn();
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
        camHoldDelayTimer=setTimeout(()=>{camHoldTimer=setInterval(()=>nudgeCameraView(dx,dy,dz),95)},260);
      });
    }

    function bindCameraControls(){
      ['pointerup','pointercancel'].forEach(ev=>document.addEventListener(ev,stopCamHold));
      bindCameraHold('camMoveLeft',-.18,0,0);
      bindCameraHold('camMoveRight',.18,0,0);
      bindCameraHold('camMoveUp',0,.12,0);
      bindCameraHold('camMoveDown',0,-.12,0);
      bindCameraHold('camZoomIn',0,0,.26);
      bindCameraHold('camZoomOut',0,0,-.42);
      $('camResetBtn').onclick=(e)=>{e.preventDefault();e.stopPropagation();resetCameraView();};
    }

    function bind(){
      bindAimControls();
      bindCanvasDrag();
      bindCameraControls();
    }

    return { bind, nudge, resetCameraView };
  }

  window.KATZENBURG_INPUT = { create };
})();
