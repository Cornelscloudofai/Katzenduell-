'use strict';

(() => {
  const root = document.getElementById('katzenburg-ui-root');
  if(!root) return;

  root.innerHTML = `
<div class="topHud">
  <div class="title">🐾 Katzenburg-Duell V112</div>
  <div class="sub" id="status">WebGL V112 · stabile Turm-GLBs · Touchfix entschärft</div><div class="resourceLine" id="resourceLine">Gold 25.0 · Einkommen +0.5 · Burg 100%</div>
</div>

<div class="camBar">
  <button id="camCannon" class="active">🎯</button>
  <button id="camFree" class="secondary">🌀</button>
  <button id="camBird" class="secondary">🦅</button>
  <button id="camHit" class="secondary">💥</button>
  <button id="flightCamTopBtn" class="secondary" type="button" title="Projektilkamera">🎥</button>
  <button id="swapBtn" class="secondary">🔁</button>
  <button id="buildBtn" class="secondary">🏗️</button>
  <button id="resetBtn" class="secondary">↺</button>
</div>

<div class="weaponBar">
  <button id="weaponCannon" class="active">💣 Kan.</button>
  <button id="weaponFire" class="secondary">🔥 Kat.</button>
</div>

<button id="weaponDevHandle" class="weaponDevHandle" type="button" aria-label="Waffen-FX-Panel öffnen">◀</button>
<div id="weaponDevDrawer" class="weaponDevDrawer" aria-label="Waffen-FX-Entwicklerpanel">
  <div class="weaponDevTitle">WAFFEN FX</div>
  <label class="fxRow"><span>Trail</span><input id="fxTrail" type="range" min="0.4" max="2.2" step="0.1" value="1"><b id="fxTrailVal">1.0</b></label>
  <label class="fxRow"><span>Rauch</span><input id="fxSmoke" type="range" min="0.3" max="2.5" step="0.1" value="1"><b id="fxSmokeVal">1.0</b></label>
  <label class="fxRow"><span>Funken</span><input id="fxSparks" type="range" min="0.3" max="2.5" step="0.1" value="1"><b id="fxSparksVal">1.0</b></label>
  <label class="fxRow"><span>Feuer</span><input id="fxFlame" type="range" min="0.4" max="2.2" step="0.1" value="1"><b id="fxFlameVal">1.0</b></label>
  <label class="fxRow"><span>Recoil</span><input id="fxRecoil" type="range" min="0.2" max="2.0" step="0.1" value="1"><b id="fxRecoilVal">1.0</b></label>
  <div class="fxMiniBtns">
    <button id="fxResetBtn" type="button">Reset</button>
    <button id="fxPresetBtn" type="button">Drama</button>
  </div>
</div>


<button id="camDrawerHandle" class="camDrawerHandle" type="button" aria-label="Kamerapanel öffnen">▶</button>
<div id="camDrawer" class="camDrawer" aria-label="Kamerasteuerung">
  <div class="drawerTitle">KAMERA</div>
  <div class="camPad">
    <button id="camMoveUp" class="camPadBtn" type="button">▲</button>
    <button id="camMoveLeft" class="camPadBtn" type="button">◀</button>
    <div class="camPadCenter"></div>
    <button id="camMoveRight" class="camPadBtn" type="button">▶</button>
    <button id="camMoveDown" class="camPadBtn" type="button">▼</button>
  </div>
  <div class="camDrawerTools">
    <button id="camZoomIn" class="camToolBtn" type="button" aria-label="Näher ran">＋</button>
    <button id="camResetBtn" class="camToolBtn reset" type="button" aria-label="Kamera zurücksetzen">↺</button>
    <button id="camZoomOut" class="camToolBtn" type="button" aria-label="Weiter weg">－</button>
  </div>
</div>

<div id="buildPanel" class="buildPanel hidden">
  <button class="buildChoice active" data-type="wall">🧱<span>Mauer</span><small>1</small></button>
  <button class="buildChoice" data-type="weapon_tower">🗼<span>Waffenturm</span><small>32</small></button>
  <button class="buildChoice" data-type="cannon_weapon">💣<span>Kanone</span><small>22</small></button>
  <button class="buildChoice" data-type="catapult_weapon">🔥<span>Katapult</span><small>26</small></button>
  <button class="buildChoice" data-type="fish">🐟<span>Fischküche</span><small>14</small></button>
  <button class="buildChoice" data-type="workshop">⚙️<span>Werkstatt</span><small>22</small></button>
  <button class="buildChoice" data-type="granary">🌾<span>Kornspeicher</span><small>25</small></button>
  <button class="buildChoice" data-type="barracks">🛡️<span>Kaserne</span><small>24</small></button>
  <button class="buildChoice" data-type="catmint">🌿<span>Katzenminze</span><small>18</small></button>
  <button class="buildChoice repairChoice" id="repairWallBtn" type="button">🔧<span>Mauer +1 HP</span><small>1.2</small></button>
</div>

<div id="buildTools" class="buildTools hidden">
  <button id="rotateBuildBtn" class="toolBtn rotate" title="Drehen">↻</button>
  <button id="confirmBuildBtn" class="toolBtn confirm" title="Bauen">✓</button>
</div>

<div id="camDebug" class="camDebug hidden"></div>
<div id="economyHud" class="economyHud"><span>🪙 <b id="econGold">25.0</b></span><span>＋<b id="econIncome">0.5</b></span><span>🏰 <b id="econHp">100%</b></span></div>

<div class="powerRail">
  <div class="railLabel">Stärke</div>
  <input id="power" type="range" min="20" max="100" value="62" step="1" />
</div>

<div class="cross" id="cross"><b></b></div>

<div class="deck">
  <div class="mapBox">
    <div class="miniTitle">Eigene Burg</div>
    <canvas id="mapOwn"></canvas>
  </div>
  <div class="console">
    <div class="readout">
      <div class="ang"><span>Azimut</span><b id="yawVal">0°</b></div>
      <div class="ang"><span>Höhe</span><b id="pitchVal">35°</b></div>
    </div>
    <div class="weaponQuickSwitch">
      <button id="weaponPrevBtn" type="button" title="Kanone wählen">💣</button>
      <button id="weaponNextBtn" type="button" title="Katapult wählen">🔥</button>
    </div>
    <div class="ring"></div>
    <div class="pad">
      <button id="aimUp" class="aimBtn up">▲</button>
      <button id="aimLeft" class="aimBtn left">◀</button>
      <button id="fireBtn" class="fireCore">Feuer</button>
      <button id="aimRight" class="aimBtn right">▶</button>
      <button id="aimDown" class="aimBtn down">▼</button>
    </div>

  </div>
  <div class="mapBox">
    <div class="miniTitle">Gegner</div>
    <canvas id="mapEnemy"></canvas>
  </div>
</div>

<div id="toast" class="toast"></div>
<div id="error" class="error"></div>
  `;
})();
