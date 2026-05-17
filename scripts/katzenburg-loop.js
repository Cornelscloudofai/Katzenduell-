'use strict';

window.KATZENBURG_LOOP = (() => {
  function create({
    window,
    canvas,
    players,
    getLastTime,
    setLastTime,
    getFxClock,
    setFxClock,
    setViewport,
    smoothCameraStates,
    updateProjectile,
    updateParticles,
    drawScene,
    drawMap,
    getMapOwn,
    getMapEnemy,
    updateUI
  }){
    function resize(){
      const dpr=Math.max(1,Math.min(2,window.devicePixelRatio||1));
      const width=window.innerWidth;
      const height=window.innerHeight;
      setViewport({width,height,dpr});
      canvas.width=Math.floor(width*dpr);
      canvas.height=Math.floor(height*dpr);
      canvas.style.width=width+'px';
      canvas.style.height=height+'px';
    }

    function updateWeaponAnimations(dt){
      players.forEach(p=>{
        p.catapultAnim=Math.max(0,(p.catapultAnim||0)-dt*1.95);
        p.cannonAnim=Math.max(0,(p.cannonAnim||0)-dt*4.2);
      });
    }

    function loop(now){
      const dt=Math.min(.04,(now-getLastTime())/1000);
      setLastTime(now);
      setFxClock(getFxClock()+dt);
      updateWeaponAnimations(dt);
      smoothCameraStates(dt);
      updateProjectile(dt);
      updateParticles(dt);
      drawScene();
      drawMap(getMapOwn(),false);
      drawMap(getMapEnemy(),true);
      updateUI();
      window.requestAnimationFrame(loop);
    }

    function bindResize(){
      window.addEventListener('resize',resize,{passive:true});
    }

    function start(){
      window.requestAnimationFrame(loop);
    }

    return { resize, bindResize, start, loop };
  }

  return { create };
})();
