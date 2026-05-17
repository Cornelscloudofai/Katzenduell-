'use strict';
(function(){
  function create({
    gl,
    players,
    terrainHeight,
    terrainNormalAt,
    terrainMaterialKey,
    m4Identity,
    drawAssetBuffer,
    drawCube,
    modelCube
  }){
    let terrainMeshBuffers = null;

    function invalidateTerrainMesh(){
      terrainMeshBuffers = null;
    }

    function pushTerrainTri(target, a,b,c){
      const n0=terrainNormalAt(a[0],a[2]);
      const n1=terrainNormalAt(b[0],b[2]);
      const n2=terrainNormalAt(c[0],c[2]);
      target.push(a[0],a[1],a[2],n0[0],n0[1],n0[2]);
      target.push(b[0],b[1],b[2],n1[0],n1[1],n1[2]);
      target.push(c[0],c[1],c[2],n2[0],n2[1],n2[2]);
    }

    function initTerrainMesh(){
      if(terrainMeshBuffers) return;
      const step=3.6;
      const minX=-260,maxX=260,minZ=-210,maxZ=190;
      const groups={grass:[],earth:[],dirt:[],rock:[],wheat:[]};

      for(let x=minX;x<maxX;x+=step){
        for(let z=minZ;z<maxZ;z+=step){
          const p00=[x,terrainHeight(x,z),z];
          const p10=[x+step,terrainHeight(x+step,z),z];
          const p01=[x,terrainHeight(x,z+step),z+step];
          const p11=[x+step,terrainHeight(x+step,z+step),z+step];

          const cx=x+step*.5, cz=z+step*.5, ch=terrainHeight(cx,cz);
          const key=terrainMaterialKey(cx,cz,ch);

          // Leichte Diagonalvariation gegen Rastergefühl.
          const flip=((Math.floor(x*0.37)+Math.floor(z*0.41))&1)===0;
          if(flip){
            pushTerrainTri(groups[key],p00,p10,p11);
            pushTerrainTri(groups[key],p00,p11,p01);
          }else{
            pushTerrainTri(groups[key],p00,p10,p01);
            pushTerrainTri(groups[key],p10,p11,p01);
          }
        }
      }

      terrainMeshBuffers={};
      for(const key of Object.keys(groups)){
        const arr=new Float32Array(groups[key]);
        const buf=gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,buf);
        gl.bufferData(gl.ARRAY_BUFFER,arr,gl.STATIC_DRAW);
        terrainMeshBuffers[key]={buf,count:arr.length/6};
      }
    }

    function drawTerrain(VP){
      initTerrainMesh();

      const mats=[
        ['earth',[0.22,0.29,0.15]],
        ['grass',[0.20,0.38,0.17]],
        ['dirt',[0.27,0.34,0.18]],
        ['wheat',[0.66,0.58,0.22]],
        ['rock',[0.37,0.39,0.40]]
      ];
      const M=m4Identity();
      for(const [key,col] of mats){
        const g=terrainMeshBuffers[key];
        if(g && g.count>0) drawAssetBuffer(g.buf,g.count,M,col,VP);
      }

      // Größere Fernkulisse aus Felswänden / Hochplateaus.
      drawCube(modelCube(0,   terrainHeight(0,-182)+14.0,  -198, 228, 28.0, 18.0), [0.20,0.22,0.24], VP);
      drawCube(modelCube(-218,terrainHeight(-218,-46)+9.5,  -46,   20, 19.0, 92.0), [0.19,0.21,0.23], VP);
      drawCube(modelCube(218, terrainHeight(218,-46)+9.5,   -46,   20, 19.0, 92.0), [0.19,0.21,0.23], VP);
      drawCube(modelCube(-176,terrainHeight(-176,124)+6.5,  128,   48, 13.0, 20.0), [0.22,0.24,0.25], VP);
      drawCube(modelCube(176, terrainHeight(176,124)+6.5,   128,   48, 13.0, 20.0), [0.22,0.24,0.25], VP);
    }

    function drawCastlePlateaus(VP){
      for(const p of players){
        const baseY=terrainHeight(p.x,0);

        // weicher Erdsaum um die Baufläche
        drawCube(modelCube(p.x,baseY+0.018,0,29,.026,27),[0.30,.24,.18],VP);

        // Eingebettete Baufläche: nicht mehr als grober Block, sondern als flache befestigte Oberfläche.
        drawCube(modelCube(p.x,baseY+0.035,0,25,.045,23),[0.40,.38,.32],VP);

        for(let tx=-10;tx<=10;tx+=3.2){
          for(let tz=-10;tz<=10;tz+=3.2){
            const x=p.x+tx, z=tz;
            const th=terrainHeight(x,z);
            const alt=((Math.round(tx*3+tz*5))&1);
            const col=alt?[.56,.51,.43]:[.49,.46,.39];
            drawCube(modelCube(x,th+0.066,z,2.30,.020,2.30),col,VP);
          }
        }
      }
    }

    return { drawTerrain, drawCastlePlateaus, invalidateTerrainMesh };
  }

  window.KATZENBURG_TERRAIN_RENDERER = { create };
})();
