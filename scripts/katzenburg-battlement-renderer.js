'use strict';
(function(){
  function createBattlementRenderer({
    getMode,
    getTurn,
    cannonPos,
    aimDirFlat,
    add,
    mul,
    drawCube,
    modelCube
  }){
    function drawBattlement(VP){
      if(getMode()!=='cannon') return;

      const turn=getTurn();
      const cp=cannonPos(turn);
      const f=aimDirFlat(turn);
      const yaw=Math.atan2(f[2],f[0]);
      const front=add(cp,mul(f,7.9));
      const right=[-f[2],0,f[0]];

      drawCube(modelCube(front[0],cp[1]-5.5,front[2],18.5,1.15,1.85,yaw),[.48,.45,.38],VP);
      [-8,-4,0,4,8].forEach(offset=>{
        const crenel=add(front,mul(right,offset));
        drawCube(modelCube(crenel[0],cp[1]-4.05,crenel[2],1.35,1.0,2.05,yaw),[.56,.53,.45],VP);
      });
    }

    return { drawBattlement };
  }

  window.KATZENBURG_BATTLEMENT_RENDERER = { createBattlementRenderer };
})();
