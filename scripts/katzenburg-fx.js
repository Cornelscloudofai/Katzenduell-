'use strict';

window.KATZENBURG_FX = (() => {
  const SLIDERS = [
    ['Trail','trail'],
    ['Smoke','smoke'],
    ['Sparks','sparks'],
    ['Flame','flame'],
    ['Recoil','recoil']
  ];

  function create({ $, getDevFX, setDevFX, toast }){
    function update(){
      const devFX = getDevFX();
      for(const [id,key] of SLIDERS){
        const el=$('fx'+id), val=$('fx'+id+'Val');
        if(el){ el.value=devFX[key]; }
        if(val){ val.textContent=Number(devFX[key]).toFixed(1); }
      }
    }

    function setFX(key,val){
      const next = { ...getDevFX(), [key]: Number(val) };
      setDevFX(next);
      update();
    }

    function bind(){
      for(const [id,key] of SLIDERS){
        const el=$('fx'+id);
        if(el) el.addEventListener('input',()=>setFX(key,el.value));
      }

      $('weaponDevHandle').onclick=()=>{
        $('weaponDevDrawer').classList.toggle('open');
        $('weaponDevHandle').textContent=$('weaponDevDrawer').classList.contains('open')?'▶':'◀';
      };
      $('fxResetBtn').onclick=()=>{
        setDevFX({trail:1,smoke:1,sparks:1,flame:1,recoil:1});
        update();
        toast('FX zurückgesetzt');
      };
      $('fxPresetBtn').onclick=()=>{
        setDevFX({trail:1.4,smoke:1.6,sparks:1.5,flame:1.25,recoil:1.15});
        update();
        toast('FX Preset: Drama');
      };
    }

    return { bind, update, setFX };
  }

  return { create };
})();
