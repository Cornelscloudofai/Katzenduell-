'use strict';
(function(){
  function create({
    getDPR,
    getTurn,
    getPhase,
    getPlayers,
    getLastHit,
    getBuildPreview,
    enemyIndex,
    buildAreaSpan,
    visualBlockRatio,
    clamp
  }){
    function blockMapColor(block, player){
      if(block.main) return `rgb(${player.color.map(v=>Math.floor(v*255)).join(',')})`;
      if(block.type==='cannon_weapon') return '#333333';
      if(block.type==='catapult_weapon') return '#ff8c22';
      if(block.type==='fish') return '#6dff9e';
      if(block.type==='workshop') return '#d78cff';
      if(block.type==='granary') return '#f0bf58';
      if(block.type==='barracks') return '#b57b55';
      if(block.type==='catmint') return '#5dd7aa';
      if(block.type==='tower') return '#fff';
      return '#b9c7d9';
    }

    function drawGrid(ctx, ox, oy, cols, rows, cw, ch){
      ctx.strokeStyle='rgba(145,255,155,.35)';
      for(let c=0;c<=cols;c++){
        const x=ox+c*cw;
        ctx.beginPath();ctx.moveTo(x,oy);ctx.lineTo(x,oy+rows*ch);ctx.stroke();
      }
      for(let r=0;r<=rows;r++){
        const y=oy+r*ch;
        ctx.beginPath();ctx.moveTo(ox,y);ctx.lineTo(ox+cols*cw,y);ctx.stroke();
      }
    }

    function drawMap(canvasEl,focusEnemy=false){
      const ctx=canvasEl.getContext('2d'),rw=canvasEl.clientWidth||120,rh=canvasEl.clientHeight||74;
      const DPR=getDPR();
      if(canvasEl.width!==Math.floor(rw*DPR)||canvasEl.height!==Math.floor(rh*DPR)){
        canvasEl.width=Math.floor(rw*DPR);
        canvasEl.height=Math.floor(rh*DPR);
        ctx.setTransform(DPR,0,0,DPR,0,0);
      }
      const turn=getTurn();
      const players=getPlayers();
      const owner=focusEnemy?enemyIndex():turn,p=players[owner],cols=8,rows=8,ox=6,oy=6,cw=(rw-12)/cols,ch=(rh-12)/rows;
      const area=buildAreaSpan(); const spanX=area.x, spanZ=area.z;
      ctx.clearRect(0,0,rw,rh);
      ctx.fillStyle='#06131b';ctx.fillRect(0,0,rw,rh);
      ctx.fillStyle='rgba(40,120,80,.18)';ctx.fillRect(ox,oy,cw*cols,ch*rows);

      // innerer Burgbereich dezent markieren
      ctx.fillStyle='rgba(120,180,255,.08)';
      ctx.fillRect(ox + ((spanX/2-11)/spanX)*cw*cols, oy + ((spanZ/2-9)/spanZ)*ch*rows, (22/spanX)*cw*cols, (18/spanZ)*ch*rows);

      drawGrid(ctx, ox, oy, cols, rows, cw, ch);

      for(const b of p.blocks){
        const gx=clamp(Math.floor(((b.x-p.x)+spanX/2)/spanX*cols),0,cols-1),gy=clamp(Math.floor((b.z+spanZ/2)/spanZ*rows),0,rows-1);
        ctx.fillStyle=blockMapColor(b,p);
        const ratio=visualBlockRatio(b);
        ctx.fillRect(ox+gx*cw+2,oy+gy*ch+2,cw-4,ch-4);
        if(ratio<0.75){
          ctx.fillStyle='rgba(0,0,0,.45)';
          ctx.fillRect(ox+gx*cw+cw*.50,oy+gy*ch+2,cw*(1-ratio)*.45,ch-4);
        }
      }

      const lastHit=getLastHit();
      if(lastHit.valid){
        const hx=lastHit.x-p.x,hz=lastHit.z;
        if(Math.abs(hx)<spanX/2&&Math.abs(hz)<spanZ/2){
          ctx.strokeStyle='#ffd166';ctx.lineWidth=2;ctx.beginPath();
          ctx.arc(ox+(hx+spanX/2)/spanX*cols*cw,oy+(hz+spanZ/2)/spanZ*rows*ch,5,0,7);ctx.stroke();
        }
      }

      if(!focusEnemy && getPhase()==='build'){
        ctx.strokeStyle='#ffd166';ctx.lineWidth=2;
        ctx.strokeRect(ox+1,oy+1,cw*cols-2,ch*rows-2);
        ctx.fillStyle='rgba(255,209,102,.08)';
        ctx.fillRect(ox,oy,cw*cols,ch*rows);

        const preview=getBuildPreview();
        const gx=(preview.x-p.x+spanX/2)/spanX*cols;
        const gy=(preview.z+spanZ/2)/spanZ*rows;
        const px=ox+gx*cw, py=oy+gy*ch;
        ctx.save();
        ctx.globalAlpha=.75;
        ctx.fillStyle=preview.valid?'rgba(255,230,90,.50)':'rgba(255,60,50,.45)';
        ctx.shadowColor=preview.valid?'#ffd166':'#ff4444';
        ctx.shadowBlur=10;
        ctx.fillRect(px-cw*.45,py-ch*.45,cw*.9,ch*.9);
        ctx.restore();
      }

      ctx.strokeStyle=focusEnemy?'#ff6969':`rgb(${p.color.map(v=>Math.floor(v*255)).join(',')})`;
      ctx.lineWidth=2;ctx.strokeRect(ox+.5,oy+.5,cw*cols-1,ch*rows-1);
    }

    return { drawMap };
  }

  window.KATZENBURG_MAP = { create };
})();
