'use strict';

window.KATZENBURG_BUILD = (() => {
  function create({
    $,
    canvas,
    getDPR,
    getPhase,
    getTurn,
    getActive,
    getSelectedBuild,
    getBuildPreview,
    getBuildHandleScreen,
    buildCam,
    types,
    players,
    weaponTypeForBuild,
    BUILD_GRID_UNIT,
    clamp,
    transformPoint,
    add,
    mul,
    norm,
    sub,
    cross,
    terrainHeight,
    terrainRayHit,
    canPlaceBlock,
    computeWallDrawPreview,
    updateUI,
    toast
  }){
    function projectToScreen(world,VP){
      const q=transformPoint(VP,world);
      if(Math.abs(q[3])<0.00001) return {visible:false,x:0,y:0};
      const ndc=[q[0]/q[3],q[1]/q[3],q[2]/q[3]];
      const dpr = getDPR();
      return {
        visible: q[3] > 0 && ndc[0] >= -1.25 && ndc[0] <= 1.25 && ndc[1] >= -1.25 && ndc[1] <= 1.25,
        x:(ndc[0]*0.5+0.5)*(canvas.width/dpr),
        y:(1-(ndc[1]*0.5+0.5))*(canvas.height/dpr)
      };
    }

    function buildHandleWorldPos(){
      const buildPreview = getBuildPreview();
      const t=types[getSelectedBuild()];
      const ry=buildPreview.ry||0;
      const side = Math.max(t.w,t.d)*0.62;
      const fx=Math.sin(ry), fz=Math.cos(ry);
      const rx=Math.cos(ry), rz=-Math.sin(ry);
      // leicht schräg neben dem Objekt
      const baseY=terrainHeight(buildPreview.x,buildPreview.z);
      return [
        buildPreview.x + rx*side + fx*0.55,
        baseY + Math.max(1.5,t.h*0.76),
        buildPreview.z + rz*side + fz*0.55
      ];
    }

    function pointerHitsBuildHandle(ev){
      const buildHandleScreen = getBuildHandleScreen();
      if(getPhase()!=='build' || !buildHandleScreen.visible) return false;
      const rect=canvas.getBoundingClientRect();
      const x=ev.clientX-rect.left, y=ev.clientY-rect.top;
      const dx=x-buildHandleScreen.x, dy=y-buildHandleScreen.y;
      return dx*dx + dy*dy <= buildHandleScreen.r*buildHandleScreen.r;
    }

    function getBuildCameraBasis(){
      const eye=buildCam.eye || [0,0,0];
      const target=buildCam.target || [buildCam.targetX,2.5,buildCam.targetZ];
      const forward=norm(sub(target,eye));
      const right=norm(cross(forward,[0,1,0]));
      const up=norm(cross(right,forward));
      return {eye,forward,right,up};
    }

    function terrainHitFromScreenNormalized(nx,ny){
      const basis=getBuildCameraBasis();
      const aspect=(canvas.clientWidth||window.innerWidth)/Math.max(1,(canvas.clientHeight||window.innerHeight));
      const fov=58*Math.PI/180;
      const tan=Math.tan(fov/2);
      const dir=norm(add(add(basis.forward,mul(basis.right,nx*tan*aspect)),mul(basis.up,ny*tan)));
      return terrainRayHit(basis.eye,dir,760,1.35);
    }

    function buildCenterWorldPoint(){
      // Bildschirmmitte leicht oberhalb des Feuerkreuzes, damit die Vorschau wirklich im aktuellen Blickfeld startet.
      const p=getActive();
      return terrainHitFromScreenNormalized(0,0.05) || [p.x, terrainHeight(p.x,0), 0];
    }

    function buildAreaSpan(){
      // V75: größere Bauzone, damit Assets sich räumlich entfalten können.
      return {x:110,z:82};
    }

    function buildGridPoint(x,z){
      const p=getActive();
      const g=BUILD_GRID_UNIT || 0.85;
      return {
        x:Math.round((x-p.x)/g)*g+p.x,
        z:Math.round(z/g)*g
      };
    }

    function wallLineNodes(start,end){
      const dx=end.x-start.x, dz=end.z-start.z;
      const useX=Math.abs(dx)>=Math.abs(dz);
      const a=useX?start.x:start.z;
      const b=useX?end.x:end.z;
      const step=(b>=a)?BUILD_GRID_UNIT:-BUILD_GRID_UNIT;
      const count=Math.max(1,Math.round(Math.abs(b-a)/BUILD_GRID_UNIT));
      const nodes=[];
      for(let i=0;i<=count;i++){
        const x=useX ? start.x + Math.sign(step)*BUILD_GRID_UNIT*i : start.x;
        const z=useX ? start.z : start.z + Math.sign(step)*BUILD_GRID_UNIT*i;
        nodes.push(buildGridPoint(x,z));
      }
      return nodes;
    }

    function wallSegmentsFromNodes(nodes){
      const dx=(nodes[nodes.length-1]?.x ?? 0) - (nodes[0]?.x ?? 0);
      const dz=(nodes[nodes.length-1]?.z ?? 0) - (nodes[0]?.z ?? 0);
      const ry=Math.abs(dz)>Math.abs(dx) ? Math.PI/2 : 0;
      return nodes.map(n=>({x:n.x,z:n.z,ry}));
    }

    function wallLineCost(segs){ return segs.length; }

    function footprintFor(type,ry=0){
      const t=types[type];
      let baseW=t.w, baseD=t.d;

      const rotated = Math.abs(Math.sin(ry||0)) > 0.5;
      let w = rotated ? baseD : baseW;
      let d = rotated ? baseW : baseD;

      // Zusätzlicher Sicherheitsabstand für mobile Platzierung und größere GLBs.
      if(type==='wall'){ w += 0.00; d += 0.00; }
      if(type==='tower'){ w += 5.0; d += 5.0; }
      if(type==='weapon_tower'){ w += 4.0; d += 4.0; }
      if(type==='fish'){ w += 1.4; d += 1.8; }
      else if(type==='granary'){ w += 1.2; d += 1.0; }
      else if(type==='barracks'){ w += 1.8; d += 1.4; }
      else if(type==='catmint'){ w += 1.8; d += 1.6; }
      else if(type!=='wall' && type!=='tower' && type!=='weapon_tower'){ w += 0.9; d += 0.9; }
      return {w,d};
    }

    function nearestEmptyWeaponTower(owner,x,z,weapon){
      const p=players[owner];
      let best=null, bestD=999999;
      for(const b of p.blocks){
        if(b.type!=='weapon_tower'||b.hp<=0) continue;
        if(b.weaponSlot && b.weaponSlot!==weapon) continue;
        if(b.hasWeapon) continue;
        const dx=b.x-x,dz=b.z-z,d=dx*dx+dz*dz;
        if(d<bestD){bestD=d;best=b;}
      }
      return best;
    }

    function canPlaceWeaponOnTower(owner,type,x,z){
      const weapon=weaponTypeForBuild(type);
      if(weapon!=='cannon') return null;
      const tower=nearestEmptyWeaponTower(owner,x,z,'cannon');
      if(!tower) return {ok:false,msg:'Kanonen brauchen einen freien Waffenturm.'};
      return {ok:true,msg:'',snapX:tower.x,snapZ:tower.z,tower};
    }

    function snapBuildPosition(owner,x,z,type=getSelectedBuild()){
      const p=players[owner];
      if(type==='cannon_weapon'){
        const tower=nearestEmptyWeaponTower(owner,x,z,'cannon');
        if(tower) return {x:tower.x,z:tower.z};
      }
      const area=buildAreaSpan();
      x=clamp(x,p.x-area.x/2,p.x+area.x/2);
      z=clamp(z,-area.z/2,area.z/2);
      const grid=BUILD_GRID_UNIT;
      x=Math.round((x-p.x)/grid)*grid+p.x;
      z=Math.round(z/grid)*grid;
      return {x,z};
    }

    function setBuildPreviewFromLocal(localX,localZ){
      const p=getActive();
      const turn=getTurn();
      const selectedBuild=getSelectedBuild();
      const buildPreview=getBuildPreview();
      const pos=snapBuildPosition(turn, p.x + localX, localZ, selectedBuild);
      buildPreview.x=pos.x;
      buildPreview.z=pos.z;
      buildPreview.valid=canPlaceBlock(turn,selectedBuild,buildPreview.x,buildPreview.z,true).ok;
      if(selectedBuild==='wall') computeWallDrawPreview();
    }

    function setBuildPreviewFromWorld(x,z){
      const turn=getTurn();
      const selectedBuild=getSelectedBuild();
      const buildPreview=getBuildPreview();
      const pos=snapBuildPosition(turn,x,z,selectedBuild);
      buildPreview.x=pos.x;
      buildPreview.z=pos.z;
      buildPreview.valid=canPlaceBlock(turn,selectedBuild,buildPreview.x,buildPreview.z,true).ok;
    }

    function placeBuildFromSceneEvent(ev,showMessage=false){
      if(getPhase()!=='build') return;
      const rect=canvas.getBoundingClientRect();
      const sx=clamp(ev.clientX-rect.left,0,rect.width);
      const sy=clamp(ev.clientY-rect.top,0,rect.height);
      const nx=(sx/rect.width)*2-1;
      const ny=1-(sy/rect.height)*2;

      const hit=terrainHitFromScreenNormalized(nx,ny);
      if(!hit) return;
      setBuildPreviewFromWorld(hit[0],hit[2]);

      if(showMessage) toast(getBuildPreview().valid ? 'Vorschau gesetzt. Mit ✓ bauen.' : 'Position ungültig.');
      updateUI();
    }

    function placeBuildFromMapEvent(ev,showMessage=false){
      if(getPhase()!=='build') return;
      const canvasEl=$('mapOwn');
      const rect=canvasEl.getBoundingClientRect();
      const mx=clamp(ev.clientX-rect.left,0,rect.width);
      const my=clamp(ev.clientY-rect.top,0,rect.height);
      const span=buildAreaSpan();
      const localX=(mx/rect.width)*span.x - span.x/2;
      const localZ=(my/rect.height)*span.z - span.z/2;
      setBuildPreviewFromLocal(localX,localZ);
      if(showMessage) toast(getBuildPreview().valid ? 'Position gesetzt. Mit ✓ bauen.' : 'Position ungültig.');
      updateUI();
    }

    function resetBuildCamForTurn(){
      const p=getActive();
      buildCam.targetX=p.x;
      buildCam.targetZ=0;
      buildCam.yaw = getTurn()===0 ? -0.72 : Math.PI-0.72;
      buildCam.pitch = 0.58;
      buildCam.dist = 64;
    }


    function drawBuildGrid(VP,{ drawCube, modelCube, WALL_SEGMENT_GRID }){
      if(getPhase()!=='build') return;
      const p=getActive();
      const area=buildAreaSpan();
      const minX=p.x-area.x/2, maxX=p.x+area.x/2;
      const minZ=-area.z/2, maxZ=area.z/2;
      const fine=BUILD_GRID_UNIT;
      const major=WALL_SEGMENT_GRID;

      for(let x=Math.ceil(minX/fine)*fine; x<=maxX; x+=fine){
        const midZ=(minZ+maxZ)*0.5;
        const isMajor=Math.abs(Math.round((x-p.x)/major)-((x-p.x)/major))<0.05;
        const y=terrainHeight(x,midZ)+(isMajor?0.075:0.055);
        drawCube(modelCube(x,y,midZ,isMajor?.040:.018,.026,maxZ-minZ),isMajor?[.92,.75,.24]:[.35,.48,.30],VP);
      }

      for(let z=Math.ceil(minZ/fine)*fine; z<=maxZ; z+=fine){
        const midX=(minX+maxX)*0.5;
        const isMajor=Math.abs(Math.round(z/major)-(z/major))<0.05;
        const y=terrainHeight(midX,z)+(isMajor?0.077:0.057);
        drawCube(modelCube(midX,y,z,maxX-minX,.026,isMajor?.040:.018),isMajor?[.92,.75,.24]:[.35,.48,.30],VP);
      }

      const buildPreview=getBuildPreview();
      const py=terrainHeight(buildPreview.x,buildPreview.z)+0.16;
      drawCube(modelCube(buildPreview.x,py,buildPreview.z,.58,.075,.58),[1.0,.84,.18],VP);

      if(getSelectedBuild()==='wall'){
        const rot=Math.abs(Math.sin(buildPreview.ry||0))>0.5;
        if(rot){
          for(let z=buildPreview.z-major*4; z<=buildPreview.z+major*4; z+=major){
            const y=terrainHeight(buildPreview.x,z)+0.14;
            drawCube(modelCube(buildPreview.x,y,z,.28,.065,.58),[1,.82,.20],VP);
          }
        }else{
          for(let x=buildPreview.x-major*4; x<=buildPreview.x+major*4; x+=major){
            const y=terrainHeight(x,buildPreview.z)+0.14;
            drawCube(modelCube(x,y,buildPreview.z,.58,.065,.28),[1,.82,.20],VP);
          }
        }
      }

      drawCube(modelCube((minX+maxX)/2,terrainHeight(p.x,minZ)+0.13,minZ,maxX-minX,.055,.12),[1,.78,.18],VP);
      drawCube(modelCube((minX+maxX)/2,terrainHeight(p.x,maxZ)+0.13,maxZ,maxX-minX,.055,.12),[1,.78,.18],VP);
      drawCube(modelCube(minX,terrainHeight(minX,0)+0.13,0,.12,.055,maxZ-minZ),[1,.78,.18],VP);
      drawCube(modelCube(maxX,terrainHeight(maxX,0)+0.13,0,.12,.055,maxZ-minZ),[1,.78,.18],VP);
    }

    function panBuildCam(dx,dy){
      // Baukamera: dx horizontal, dy jetzt invertiert für natürliches Hoch/Runter.
      const scale=0.11;
      const screenRight=[Math.sin(buildCam.yaw),0,-Math.cos(buildCam.yaw)];
      const screenUpGround=[Math.cos(buildCam.yaw),0,Math.sin(buildCam.yaw)];

      buildCam.targetX = clamp(buildCam.targetX - screenRight[0]*dx*scale - screenUpGround[0]*dy*scale, -92, 92);
      buildCam.targetZ = clamp(buildCam.targetZ - screenRight[2]*dx*scale - screenUpGround[2]*dy*scale, -44, 44);
    }

    return {
      projectToScreen,
      buildHandleWorldPos,
      pointerHitsBuildHandle,
      getBuildCameraBasis,
      terrainHitFromScreenNormalized,
      buildCenterWorldPoint,
      buildAreaSpan,
      buildGridPoint,
      wallLineNodes,
      wallSegmentsFromNodes,
      wallLineCost,
      footprintFor,
      nearestEmptyWeaponTower,
      canPlaceWeaponOnTower,
      snapBuildPosition,
      setBuildPreviewFromLocal,
      setBuildPreviewFromWorld,
      placeBuildFromSceneEvent,
      placeBuildFromMapEvent,
      resetBuildCamForTurn,
      drawBuildGrid,
      panBuildCam
    };
  }

  function createWallLineController({
    getPhase,
    getTurn,
    getActive,
    getSelectedBuild,
    getBuildPreview,
    getWallDrawStart,
    setWallDrawStart,
    setWallDrawPreview,
    buildGridPoint,
    wallLineNodes,
    wallSegmentsFromNodes,
    wallLineCost,
    canPlaceBlock,
    makeBlock,
    normalizeGold,
    fmtGold,
    rebuildWallJoints,
    initBuildPreview,
    updateBuildPanelUI,
    updateUI,
    toast,
    terrainHeight
  }){
    function canPlaceWallSegment(owner,seg){
      const buildPreview=getBuildPreview();
      const oldRy=buildPreview.ry||0;
      buildPreview.ry=seg.ry;
      const ok=canPlaceBlock(owner,'wall',seg.x,seg.z,true);
      buildPreview.ry=oldRy;
      return ok;
    }

    function computeWallDrawPreview(){
      const wallDrawStart=getWallDrawStart();
      const buildPreview=getBuildPreview();
      if(!wallDrawStart || getSelectedBuild()!=='wall'){
        setWallDrawPreview([]);
        return [];
      }
      const end=buildGridPoint(buildPreview.x,buildPreview.z);
      const nodes=wallLineNodes(wallDrawStart,end);
      const segs=wallSegmentsFromNodes(nodes);
      const preview=segs.map(seg=>({...seg,ok:canPlaceWallSegment(getTurn(),seg).ok}));
      setWallDrawPreview(preview);
      return preview;
    }

    function startWallLine(){
      const buildPreview=getBuildPreview();
      const p=buildGridPoint(buildPreview.x,buildPreview.z);
      setWallDrawStart(p);
      computeWallDrawPreview();
      toast('Mauer-Startpunkt gesetzt. Endpunkt wählen und ✓ drücken.');
    }

    function cancelWallLine(){
      setWallDrawStart(null);
      setWallDrawPreview([]);
    }

    function confirmWallLine(){
      if(!getWallDrawStart()) {
        startWallLine();
        return;
      }
      const segs=computeWallDrawPreview();
      if(!segs.length){ toast('Keine Mauersegmente.'); return; }
      const bad=segs.find(s=>!s.ok);
      if(bad){ toast('Mauerlinie blockiert oder Gelände zu uneben.'); return; }
      const cost=wallLineCost(segs);
      const p=getActive();
      if(p.gold < cost){ toast(`Zu wenig Gold: ${fmtGold(cost)} benötigt.`); return; }

      p.gold -= cost;
      normalizeGold(p);
      const built=[];
      for(const seg of segs){
        const b=makeBlock(getTurn(),'wall',seg.x,seg.z,0,false,{ry:seg.ry,incomeActive:false});
        p.blocks.push(b);
        built.push(b);
      }
      rebuildWallJoints(getTurn());
      cancelWallLine();
      initBuildPreview();
      updateBuildPanelUI();
      updateUI();
      toast(`${built.length} Mauersegmente gebaut (-${fmtGold(cost)} Gold)`);
    }

    function drawWallLinePreview(VP,{ drawCube, modelCube, BUILD_GRID_UNIT }){
      const wallDrawStart=getWallDrawStart();
      if(getPhase()!=='build' || getSelectedBuild()!=='wall' || !wallDrawStart) return;
      const segs=computeWallDrawPreview();
      const y0=terrainHeight(wallDrawStart.x,wallDrawStart.z)+0.22;
      drawCube(modelCube(wallDrawStart.x,y0,wallDrawStart.z,.70,.12,.70),[.55,1.0,.45],VP);
      for(const seg of segs){
        const y=terrainHeight(seg.x,seg.z)+0.10;
        const col=seg.ok?[1.0,.82,.18]:[1.0,.15,.10];
        drawCube(modelCube(seg.x,y,seg.z,BUILD_GRID_UNIT,.18,BUILD_GRID_UNIT),col,VP);
      }
    }

    return {
      canPlaceWallSegment,
      computeWallDrawPreview,
      startWallLine,
      cancelWallLine,
      confirmWallLine,
      drawWallLinePreview
    };
  }


  function createWallGeometryController({
    players,
    types,
    terrainHeight,
    makeBlock,
    WALL_SEGMENT_GRID
  }){
    const WALL_NODE_PRECISION = 1000;

    function wallLongAxis(ry=0){
      return Math.abs(Math.sin(ry||0)) > 0.5 ? [0,1] : [1,0];
    }

    function isPerpendicularWall(a,b){
      const aa=wallLongAxis(a.ry||0), bb=wallLongAxis(b.ry||0);
      return Math.abs(aa[0]*bb[0]+aa[1]*bb[1]) < 0.2;
    }

    function wallEndpoints(w){
      const ax=wallLongAxis(w.ry||0);
      const half=WALL_SEGMENT_GRID/2;
      return [
        {x:w.x+ax[0]*half,z:w.z+ax[1]*half,dir:[-ax[0],-ax[1]]},
        {x:w.x-ax[0]*half,z:w.z-ax[1]*half,dir:[ ax[0], ax[1]]}
      ];
    }

    function dirKey(d){
      if(Math.abs(d[0])>Math.abs(d[1])) return d[0]>0?'E':'W';
      return d[1]>0?'S':'N';
    }

    function wallJointKindFromDirs(keys){
      const s=new Set(keys);
      const n=s.has('N'), e=s.has('E'), so=s.has('S'), w=s.has('W');
      const c=s.size;
      if(c>=4) return 'cross';
      if(c===3) return 't';
      if(c===2){
        if((n&&so)||(e&&w)) return 'straight';
        return 'corner';
      }
      return 'end';
    }

    function wallConnectorKeyFromDirs(dirs){
      const s=new Set(dirs||[]);
      const n=s.has('N'), e=s.has('E'), so=s.has('S'), w=s.has('W');
      const count=[n,e,so,w].filter(Boolean).length;
      if(count>=4) return 'wall_cross';
      if(count===3){
        if(n&&e&&so) return 'wall_t_NES';
        if(e&&so&&w) return 'wall_t_ESW';
        if(so&&w&&n) return 'wall_t_SWN';
        if(w&&n&&e) return 'wall_t_WNE';
      }
      if(count===2){
        if(n&&so) return 'wall_straight_NS';
        if(e&&w) return 'wall_straight_EW';
        if(n&&e) return 'wall_corner_NE';
        if(e&&so) return 'wall_corner_ES';
        if(so&&w) return 'wall_corner_SW';
        if(w&&n) return 'wall_corner_WN';
      }
      if(count===1){
        if(n) return 'wall_end_N';
        if(so) return 'wall_end_N';
        if(e) return 'wall_cell_1x1';
        if(w) return 'wall_cell_1x1';
      }
      return 'wall_cross';
    }

    function wallConnectorRotationForDirs(dirs){
      const s=new Set(dirs||[]);
      const n=s.has('N'), e=s.has('E'), so=s.has('S'), w=s.has('W');
      const count=[n,e,so,w].filter(Boolean).length;
      if(count===1){
        if(so) return Math.PI;
        if(e) return 0;
        if(w) return Math.PI;
        return 0;
      }
      return 0;
    }

    function makeWallJointBlock(owner,x,z,dirs,kind){
      return makeBlock(owner,'wall',x,z,terrainHeight(x,z),false,{
        ry:0,incomeActive:false,isWallJoint:true,wallJointKind:kind,wallDirs:dirs,
        w:1.12,d:1.12,h:types.wall.h,hp:types.wall.hp,maxHp:types.wall.hp,connectorKey:wallConnectorKeyFromDirs(dirs)
      });
    }

    function nodeKey(x,z){
      return `${Math.round(x*WALL_NODE_PRECISION)}:${Math.round(z*WALL_NODE_PRECISION)}`;
    }

    function rebuildWallJoints(owner){
      const p=players[owner];
      if(!p) return 0;

      p.blocks = p.blocks.filter(b=>!(b.type==='wall' && b.isWallJoint));

      const nodes=new Map();
      for(const wall of p.blocks){
        if(wall.type!=='wall' || wall.hp<=0 || wall.isWallJoint) continue;
        for(const ep of wallEndpoints(wall)){
          const key=nodeKey(ep.x,ep.z);
          let node=nodes.get(key);
          if(!node){
            node={x:ep.x,z:ep.z,dirs:new Set()};
            nodes.set(key,node);
          }
          node.dirs.add(dirKey(ep.dir));
        }
      }

      let added=0;
      for(const node of nodes.values()){
        const dirs=[...node.dirs].sort();
        if(!dirs.length) continue;
        const kind=wallJointKindFromDirs(dirs);
        p.blocks.push(makeWallJointBlock(owner,node.x,node.z,dirs,kind));
        added++;
      }
      return added;
    }

    function addWallCornerFills(owner){
      return rebuildWallJoints(owner);
    }

    return {
      wallLongAxis,
      isPerpendicularWall,
      wallEndpoints,
      makeWallJointBlock,
      dirKey,
      wallJointKindFromDirs,
      wallConnectorKeyFromDirs,
      wallConnectorRotationForDirs,
      rebuildWallJoints,
      addWallCornerFills
    };
  }

  function createBuildPlacementController({
    players,
    getBuildPreview,
    buildAreaSpan,
    canPlaceWeaponOnTower,
    groundCatapultBlock,
    towerForWeapon,
    footprintFor,
    terrainFlatnessAt,
    isWeaponBuildType,
    wallLongAxis,
    wallEndpoints,
    BUILD_GRID_UNIT,
    WALL_SEGMENT_GRID
  }){
    function wallSnapCandidate(owner,x,z,ry=0){
      const p=players[owner];
      const walls=p.blocks.filter(b=>b.type==='wall' && !b.isWallJoint);
      if(!walls.length) return null;

      const axis=wallLongAxis(ry);
      const half=WALL_SEGMENT_GRID/2;
      let best=null,bestD=999999;

      // Neues Segment so setzen, dass einer seiner Endpunkte auf einem existierenden Endpunkt liegt.
      for(const w of walls){
        for(const ep of wallEndpoints(w)){
          const candidates=[
            [ep.x-axis[0]*half, ep.z-axis[1]*half],
            [ep.x+axis[0]*half, ep.z+axis[1]*half]
          ];
          for(const c of candidates){
            const d=(c[0]-x)*(c[0]-x)+(c[1]-z)*(c[1]-z);
            if(d<bestD){
              bestD=d;
              best={x:c[0],z:c[1]};
            }
          }
        }
      }
      return bestD < 5.8*5.8 ? best : null;
    }

    function canPlaceBlock(owner,type,x,z,ignorePreview=false){
      const p=players[owner];
      const area=buildAreaSpan();
      const relX=x-p.x, relZ=z;
      if(Math.abs(relX)>area.x/2 || Math.abs(relZ)>area.z/2) return {ok:false,msg:'Außerhalb deiner Bauzone.'};

      if(type==='cannon_weapon') return canPlaceWeaponOnTower(owner,type,x,z);
      if(type==='catapult_weapon'){
        if(groundCatapultBlock(owner) || towerForWeapon(owner,'firecatapult')) return {ok:false,msg:'Du hast bereits ein Katapult.'};
      }

      const buildPreview=getBuildPreview();
      const ownFoot=footprintFor(type, ignorePreview ? (buildPreview.ry||0) : 0);
      const flatness=terrainFlatnessAt(x,z,ownFoot.w,ownFoot.d);
      if(flatness > (type==='wall' ? 1.55 : 0.75)) return {ok:false,msg:'Gelände zu uneben.'};

      for(const b of p.blocks){
        if(type==='wall' && b.type==='wall'){
          if(Math.abs(x-b.x)<BUILD_GRID_UNIT*0.45 && Math.abs(z-b.z)<BUILD_GRID_UNIT*0.45){
            return {ok:false,msg:'Dort steht bereits eine Mauer.'};
          }
          continue;
        }
        const otherFoot=footprintFor(b.type,b.ry||0);
        let pad = 0.45;
        if(type==='wall' || b.type==='wall') pad = -0.04;
        else if(type==='weapon_tower' || b.type==='weapon_tower') pad = 0.35;
        else if(isWeaponBuildType(type) || isWeaponBuildType(b.type)) pad = 0.20;
        if(Math.abs(x-b.x) < (ownFoot.w+otherFoot.w)/2 + pad && Math.abs(z-b.z) < (ownFoot.d+otherFoot.d)/2 + pad){
          return {ok:false,msg:'Dort steht bereits etwas.'};
        }
      }
      return {ok:true,msg:''};
    }

    function findNearestFreeBuildSpot(owner,type,x,z,ry=0){
      const buildPreview=getBuildPreview();
      const originalRy = buildPreview.ry || 0;
      buildPreview.ry = ry;
      if(canPlaceBlock(owner,type,x,z,true).ok){ buildPreview.ry = originalRy; return {x,z,ok:true}; }
      const step = type==='wall' ? 3.2 : 4.0;
      for(let ring=1; ring<=8; ring++){
        const tries=Math.max(8,ring*8);
        for(let k=0;k<tries;k++){
          const a=(k/tries)*Math.PI*2;
          const nx=x+Math.cos(a)*step*ring;
          const nz=z+Math.sin(a)*step*ring;
          if(canPlaceBlock(owner,type,nx,nz,true).ok){ buildPreview.ry = originalRy; return {x:nx,z:nz,ok:true}; }
        }
      }
      buildPreview.ry = originalRy;
      return {x,z,ok:false};
    }

    return {
      wallSnapCandidate,
      canPlaceBlock,
      findNearestFreeBuildSpot
    };
  }

  function createBuildFlowController({
    $,
    document,
    getPhase,
    setPhase,
    getMode,
    setMode,
    getTurn,
    getActive,
    getSelectedBuild,
    setBuildPanelOpen,
    getBuildPanelOpen,
    getBuildPreview,
    types,
    buildCenterWorldPoint,
    snapBuildPosition,
    canPlaceBlock,
    confirmWallLine,
    nearestEmptyWeaponTower,
    makeBlock,
    normalizeGold,
    fmtGold,
    resetBuildCamForTurn,
    updateUI,
    toast
  }){
    function centerBuildPreview(){
      const hit=buildCenterWorldPoint();
      const turn=getTurn();
      const selectedBuild=getSelectedBuild();
      const buildPreview=getBuildPreview();
      const pos=snapBuildPosition(turn,hit[0],hit[2],selectedBuild);
      buildPreview.x=pos.x;
      buildPreview.z=pos.z;
      buildPreview.valid=canPlaceBlock(turn,selectedBuild,buildPreview.x,buildPreview.z,true).ok;
    }

    function initBuildPreview(){
      centerBuildPreview();
      const buildPreview=getBuildPreview();
      if(buildPreview.valid) return;
      const p=getActive();
      const turn=getTurn();
      const selectedBuild=getSelectedBuild();
      const candidates=[
        {x:p.x+14,z:0},{x:p.x-14,z:0},{x:p.x+0,z:16},{x:p.x+0,z:-16},
        {x:p.x+22,z:18},{x:p.x-22,z:-18},{x:p.x+22,z:-18},{x:p.x-22,z:18},
        {x:p.x+30,z:0},{x:p.x-30,z:0},{x:p.x,z:24},{x:p.x,z:-24}
      ];
      for(const c of candidates){
        const pos=snapBuildPosition(turn,c.x,c.z,selectedBuild);
        if(canPlaceBlock(turn,selectedBuild,pos.x,pos.z,true).ok){
          buildPreview.x=pos.x; buildPreview.z=pos.z; buildPreview.valid=true; return;
        }
      }
      buildPreview.valid=false;
    }

    function rotateBuildPreview(){
      const selectedBuild=getSelectedBuild();
      const buildPreview=getBuildPreview();
      if(selectedBuild==='wall'){
        buildPreview.ry = Math.abs((buildPreview.ry||0) - Math.PI/2) < 0.01 ? 0 : Math.PI/2;
      }else{
        buildPreview.ry = ((buildPreview.ry||0)+Math.PI/2)%(Math.PI*2);
      }
      buildPreview.valid=canPlaceBlock(getTurn(),selectedBuild,buildPreview.x,buildPreview.z,true).ok;
      updateUI();
    }

    function confirmBuildPreview(){
      if(getPhase()!=='build') return;
      const selectedBuild=getSelectedBuild();
      if(selectedBuild==='wall'){
        confirmWallLine();
        return;
      }
      const turn=getTurn();
      const p=getActive();
      const t=types[selectedBuild];
      const buildPreview=getBuildPreview();
      const check=canPlaceBlock(turn,selectedBuild,buildPreview.x,buildPreview.z,true);
      if(!check.ok){ toast(check.msg||'Position ungültig.'); return; }
      if(p.gold < t.cost){ toast(`Zu wenig Gold: ${fmtGold(t.cost)} benötigt.`); return; }

      p.gold -= t.cost;
      normalizeGold(p);

      if(selectedBuild==='cannon_weapon'){
        const tower=check.tower || nearestEmptyWeaponTower(turn,buildPreview.x,buildPreview.z,'cannon');
        if(!tower){ toast('Kein freier Waffenturm für Kanone.'); updateUI(); return; }
        tower.weaponSlot='cannon';
        tower.hasWeapon='cannon';
        p.cannonAlive=true;
        toast(`Kanone gebaut (-${fmtGold(t.cost)} Gold)`);
      }else if(selectedBuild==='catapult_weapon'){
        p.blocks.push(makeBlock(turn,'catapult_weapon',buildPreview.x,buildPreview.z,0,false,{incomeActive:false}));
        p.catapultAlive=true;
        toast(`Katapult gebaut (-${fmtGold(t.cost)} Gold)`);
      }else if(selectedBuild==='weapon_tower'){
        p.blocks.push(makeBlock(turn,'weapon_tower',buildPreview.x,buildPreview.z,0,false,{incomeActive:false,isWeaponTower:true}));
        toast(`Waffenturm gebaut (-${fmtGold(t.cost)} Gold)`);
      }else{
        const b=makeBlock(turn,selectedBuild,buildPreview.x,buildPreview.z,0,false,{ry:buildPreview.ry||0});
        p.blocks.push(b);
        toast(`${t.label} gebaut (-${fmtGold(t.cost)} Gold)`);
      }

      initBuildPreview();
      updateBuildPanelUI();
      updateUI();
    }

    function updateBuildPanelUI(){
      const panel=$('buildPanel');
      const buildPanelOpen=getBuildPanelOpen();
      const phase=getPhase();
      const selectedBuild=getSelectedBuild();
      if(panel) panel.classList.toggle('hidden', !buildPanelOpen);
      document.querySelectorAll('.buildChoice').forEach(btn=>{
        btn.classList.toggle('active', !!btn.dataset.type && btn.dataset.type===selectedBuild);
      });
      if($('buildBtn')){
        $('buildBtn').classList.toggle('active', buildPanelOpen || phase==='build');
        $('buildBtn').textContent = buildPanelOpen ? (types[selectedBuild]?.icon || '🏗️') : '🏗️';
      }
      const ownMapBox = $('mapOwn')?.parentElement;
      if(ownMapBox) ownMapBox.classList.toggle('buildTarget', phase==='build');
      const tools=$('buildTools');
      if(tools) tools.classList.toggle('hidden', phase!=='build');
      document.body.classList.toggle('building', phase==='build');
    }

    function toggleBuildMode(forceState=null){
      const open = forceState===null ? !getBuildPanelOpen() : !!forceState;
      setBuildPanelOpen(open);
      setPhase(open ? 'build' : 'shoot');
      if(open){
        setMode('buildcam');
        resetBuildCamForTurn();
        initBuildPreview();
      }else if(getMode()==='buildcam' || getMode()==='bird'){
        setMode('cannon');
      }
      updateBuildPanelUI();
      updateUI();
      if(open) toast(`Bauen: An der Tatze ziehen = Objekt verschieben. Sonst bewegst du die Kamera.`);
    }

    return {
      centerBuildPreview,
      initBuildPreview,
      rotateBuildPreview,
      confirmBuildPreview,
      updateBuildPanelUI,
      toggleBuildMode
    };
  }

  return { create, createWallLineController, createWallGeometryController, createBuildPlacementController, createBuildFlowController };
})();
