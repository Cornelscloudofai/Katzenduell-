'use strict';

window.KATZENBURG_WALL_RENDERER = (() => {
  function create({
    gl,
    players,
    wallUnitDamageAssetData,
    wallConnectorAssetData,
    wallConnectorKeyFromDirs,
    wallConnectorRotationForDirs,
    b64ToFloat32Array,
    m4Identity,
    translate,
    rotY,
    drawAssetBuffer
  }){
    let wallUnitDamageAssetBuffers = null;
    let wallConnectorAssetBuffers = null;

    function buildAssetBuffers(assetData){
      const buffers = {};
      for(const key of Object.keys(assetData)){
        buffers[key] = assetData[key].map(ch=>{
          const arr=b64ToFloat32Array(ch.b64);
          const buf=gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER,buf);
          gl.bufferData(gl.ARRAY_BUFFER,arr,gl.STATIC_DRAW);
          return {material:ch.material,color:ch.color,count:ch.count,buf};
        });
      }
      return buffers;
    }

    function initWallConnectorAssets(){
      if(wallConnectorAssetBuffers) return;
      wallConnectorAssetBuffers = buildAssetBuffers(wallConnectorAssetData);
    }

    function drawWallConnectorAssetBlock(b,VP){
      initWallConnectorAssets();
      const key=wallConnectorKeyFromDirs(b.wallDirs||[]);
      const chunks=wallConnectorAssetBuffers[key] || wallConnectorAssetBuffers.wall_cross;
      let M=m4Identity();
      M=translate(M,b.x,b.y,b.z);
      M=rotY(M,wallConnectorRotationForDirs(b.wallDirs||[]));
      for(const ch of chunks){
        let col=ch.color;
        const team=players[b.owner]?.color || [1,.6,.2];
        if(ch.material && (ch.material.includes('moss'))) col=ch.color;
        else if(ch.material && (ch.material.includes('cap'))) col=ch.color;
        else if(ch.material && (ch.material.includes('stone'))) {
          col=[ch.color[0]*0.92+team[0]*0.04,ch.color[1]*0.92+team[1]*0.04,ch.color[2]*0.92+team[2]*0.04];
        }
        drawAssetBuffer(ch.buf,ch.count,M,col,VP);
      }
    }

    function initWallUnitDamageAssets(){
      if(wallUnitDamageAssetBuffers) return;
      wallUnitDamageAssetBuffers = buildAssetBuffers(wallUnitDamageAssetData);
    }

    function wallUnitDamageStage(b){
      const ratio=Math.max(0,Math.min(1,(b.hp||0)/Math.max(1,b.maxHp||1)));
      if(ratio>0.75) return 0;
      if(ratio>0.50) return 1;
      if(ratio>0.25) return 2;
      return 3;
    }

    function drawWallUnitDamageBlock(b,VP){
      initWallUnitDamageAssets();
      const stage=String(wallUnitDamageStage(b));
      const chunks=wallUnitDamageAssetBuffers[stage] || wallUnitDamageAssetBuffers['0'];
      let M=m4Identity();
      M=translate(M,b.x,b.y,b.z);
      M=rotY(M,b.ry||0);
      const team=players[b.owner]?.color || [1,.6,.2];

      for(const ch of chunks){
        let col=ch.color;
        if(ch.material && ch.material.includes('stone')) {
          col=[ch.color[0]*0.94+team[0]*0.025,ch.color[1]*0.94+team[1]*0.025,ch.color[2]*0.94+team[2]*0.025];
        }
        drawAssetBuffer(ch.buf,ch.count,M,col,VP);
      }
    }

    return {
      drawWallConnectorAssetBlock,
      drawWallUnitDamageBlock,
      wallUnitDamageStage
    };
  }

  return { create };
})();
