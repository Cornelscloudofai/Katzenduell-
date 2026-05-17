'use strict';
(function(){
  function createBuildPreviewRenderer({
    types,
    buildPreview,
    buildHandleScreen,
    getPhase,
    getSelectedBuild,
    getTurn,
    getActive,
    terrainHeight,
    drawCube,
    modelCube,
    isGLBBuildingType,
    drawBuildingAssetBlock,
    makeBlock,
    drawTowerAssetBlock,
    drawCannonModel,
    drawCatapultModel,
    aimDir,
    buildHandleWorldPos,
    projectToScreen
  }){
    function drawBuildPreview(VP){
      if(getPhase()!=='build'){
        buildHandleScreen.visible=false;
        return;
      }

      const selectedBuild=getSelectedBuild();
      const t=types[selectedBuild];
      const valid=buildPreview.valid;
      const c=valid ? [1.0,.82,.18] : [1.0,.12,.10];
      const turn=getTurn();
      const previewY=terrainHeight(buildPreview.x,buildPreview.z);
      const ry=buildPreview.ry||0;

      // leuchtende Bodenplatte / Schatten
      drawCube(modelCube(buildPreview.x,previewY+0.015,buildPreview.z,t.w*1.22,.08,t.d*1.22,ry),c.map(v=>v*.75),VP);

      // V90: Bauvorschau für neue Gebäude ebenfalls als GLB, nicht als alter Platzhalter-Quader.
      const previewH=Math.max(1.1,t.h*.72);
      if(isGLBBuildingType(selectedBuild)){
        const ghost={
          owner:turn,type:selectedBuild,x:buildPreview.x,y:previewY,z:buildPreview.z,
          w:t.w,h:t.h,d:t.d,ry,hp:t.hp,maxHp:t.hp
        };
        drawBuildingAssetBlock(ghost,VP);
      }else if(selectedBuild==='weapon_tower'){
        const ghost=makeBlock(turn,'weapon_tower',buildPreview.x,buildPreview.z,previewY,false,{isWeaponTower:true,incomeActive:false});
        drawTowerAssetBlock(ghost,VP);
      }else if(selectedBuild==='cannon_weapon'){
        drawCannonModel([buildPreview.x,previewY+1.05,buildPreview.z],aimDir(turn),getActive().color,VP,false);
      }else if(selectedBuild==='catapult_weapon'){
        drawCatapultModel(turn,[buildPreview.x,previewY+0.18,buildPreview.z],aimDir(turn),getActive().color,VP,false);
      }else{
        drawCube(modelCube(buildPreview.x,previewY,buildPreview.z,t.w*.92,previewH,t.d*.92,ry),c,VP);

        // kleiner heller Deckel
        drawCube(modelCube(buildPreview.x,previewY+previewH+.03,buildPreview.z,t.w*.82,.16,t.d*.82,ry),valid?[1.0,.95,.45]:[1.0,.30,.25],VP);
      }

      // Tatzen-Griffpunkt: kleine "Pfote" neben dem Objekt
      const hp=buildHandleWorldPos();
      drawCube(modelCube(hp[0],hp[1]-0.28,hp[2],.92,.46,.92,0),[1.0,.93,.72],VP);   // Hauptballen
      drawCube(modelCube(hp[0]-.36,hp[1]+.18,hp[2]-.10,.24,.24,.24,0),[1.0,.93,.72],VP);
      drawCube(modelCube(hp[0]-.12,hp[1]+.32,hp[2]+.18,.22,.22,.22,0),[1.0,.93,.72],VP);
      drawCube(modelCube(hp[0]+.14,hp[1]+.32,hp[2]+.18,.22,.22,.22,0),[1.0,.93,.72],VP);
      drawCube(modelCube(hp[0]+.38,hp[1]+.18,hp[2]-.10,.24,.24,.24,0),[1.0,.93,.72],VP);

      // Griffpunkt auf Bildschirm projizieren für Hit-Test
      const hs=projectToScreen(hp,VP);
      buildHandleScreen.x=hs.x;
      buildHandleScreen.y=hs.y;
      buildHandleScreen.r=26;
      buildHandleScreen.visible=hs.visible;
    }

    return { drawBuildPreview };
  }

  window.KATZENBURG_BUILD_PREVIEW_RENDERER = { createBuildPreviewRenderer };
})();
