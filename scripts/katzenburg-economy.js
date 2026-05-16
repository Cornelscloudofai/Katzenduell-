'use strict';

window.KATZENBURG_ECONOMY = (() => {
  function fmtGold(v){
    const n = Number(v);
    return (Number.isFinite(n) ? Math.round(n*10)/10 : 0).toFixed(1);
  }

  function create({
    types,
    players,
    balance,
    clamp,
    isFlammableBlock,
    destructionRewardForBlock,
    handleDestroyedBlock
  }){
    const { BASE_INCOME, FIRE_BURN_DAMAGE } = balance;

    function normalizeGold(p){
      p.gold = Math.round((Number(p.gold)||0)*10)/10;
    }

    function getBuildingIncomeForPlayer(p){
      return p.blocks.reduce((s,b)=>s+((b.incomeActive!==false)?(Number(types[b.type]?.income)||0):0),0);
    }

    function getIncomeForPlayer(p){
      return Math.round((BASE_INCOME + getBuildingIncomeForPlayer(p))*10)/10;
    }

    function applyStartOfTurn(p){
      const gold = getIncomeForPlayer(p);
      let heal = 0;
      const burnEvents = [];
      let destroyedByFire = 0;

      for(const b of [...p.blocks]){
        heal += (b.incomeActive!==false) ? (Number(types[b.type]?.heal)||0) : 0;

        if((b.onFire||0)>0 && isFlammableBlock(b)){
          b.hp -= FIRE_BURN_DAMAGE;
          b.onFire = Math.max(0,(b.onFire||0)-1);
          burnEvents.push(`${types[b.type]?.label||'Gebäude'} -${FIRE_BURN_DAMAGE}`);
          if(b.hp<=0){
            const reward = destructionRewardForBlock(b);
            if(b.fireOwner!==null && b.fireOwner!==undefined && players[b.fireOwner]){
              players[b.fireOwner].gold = (Number(players[b.fireOwner].gold)||0) + reward;
              normalizeGold(players[b.fireOwner]);
            }
            handleDestroyedBlock(b,p);
            p.blocks = p.blocks.filter(x=>x!==b);
            destroyedByFire++;
          }
        }
      }

      p.gold = (Number(p.gold)||0) + gold;
      normalizeGold(p);
      p.lastIncome = gold;
      p.hp = clamp(p.hp + heal, 0, 100);
      return {gold,heal,burnEvents,destroyedByFire};
    }

    return {
      fmtGold,
      normalizeGold,
      getBuildingIncomeForPlayer,
      getIncomeForPlayer,
      applyStartOfTurn
    };
  }

  return { create, fmtGold };
})();
