'use strict';

window.KATZENBURG_DAMAGE = (() => {
  function create({ types, clamp }){
    function visualBlockRatio(b){
      return clamp(b.hp / Math.max(1,b.maxHp), 0, 1);
    }

    function visualBlockHeightScale(b){
      const r = visualBlockRatio(b);
      if(b.type==='wall') return 0.45 + 0.55*r;
      if(b.type==='tower' || b.main) return 0.70 + 0.30*r;
      return 0.62 + 0.38*r;
    }

    function impactDamageForBlock(b,hitY){
      if(b.type==='wall'){
        const localY = hitY - b.y;
        return localY > b.h*0.5 ? 2 : 1; // oberhalb Hälfte = doppelter Schaden
      }
      if(b.main) return 22;
      if(b.type==='tower') return 18;
      return 26;
    }

    function ownerDamageForBlock(b){
      if(b.main) return 16;
      if(b.type==='wall') return 1;
      if(b.type==='tower') return 5;
      return 4;
    }

    function destructionRewardForBlock(b){
      const cost = Number(types[b.type]?.cost)||0;
      return Math.round(cost * 1.4 * 10) / 10;
    }

    function isFlammableBlock(b){
      return b.type!=='wall';
    }

    function damageColor(base,b){
      const r=visualBlockRatio(b);
      const dark=0.48 + r*0.52;
      const redTint=(1-r)*0.10;
      return [base[0]*dark+redTint, base[1]*dark, base[2]*dark];
    }

    function damagedWallForPlayer(p){
      return p.blocks
        .filter(b=>b.type==='wall' && b.hp>0 && b.hp<b.maxHp)
        .sort((a,b)=>a.hp-b.hp)[0] || null;
    }

    return {
      visualBlockRatio,
      visualBlockHeightScale,
      impactDamageForBlock,
      ownerDamageForBlock,
      destructionRewardForBlock,
      isFlammableBlock,
      damageColor,
      damagedWallForPlayer
    };
  }

  function createRepairActions({
    getActive,
    damagedWallForPlayer,
    repairCostPerHp,
    fmtGold,
    normalizeGold,
    updateUI,
    toast
  }){
    function repairWallOneHp(){
      const p=getActive();
      const wall=damagedWallForPlayer(p);
      if(!wall){ toast('Keine beschädigte Mauer.'); return; }
      if(p.gold < repairCostPerHp){ toast(`Reparatur kostet ${fmtGold(repairCostPerHp)} Gold.`); return; }
      p.gold = (Number(p.gold)||0) - repairCostPerHp;
      normalizeGold(p);
      wall.hp = Math.min(wall.maxHp, wall.hp + 1);
      updateUI();
      toast(`Mauer +1 HP repariert (-${fmtGold(repairCostPerHp)} Gold)`);
    }

    return { repairWallOneHp };
  }

  return { create, createRepairActions };
})();
