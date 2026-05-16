'use strict';

window.KATZENBURG_CONFIG = {
  weaponTypes: {
    cannon: { label: 'Kanone', speedMul: 0.68, gravity: 12.8, launchOffset: 4.2, toast: 'Miau-Bumm!' },
    firecatapult: { label: 'Feuerkatapult', speedMul: 0.78, gravity: 13.8, launchOffset: 3.7, toast: 'Feuerkatapult! 🔥' }
  },

  balance: {
    BASE_INCOME: 0.5,
    WALL_DESTROY_GOLD: 7,
    WALL_REPAIR_COST_PER_HP: 1.2,
    FIRE_BURN_TURNS: 5,
    FIRE_BURN_DAMAGE: 1,
    GROUND_FIRE_TURNS: 5,
    GROUND_FIRE_RADIUS: 6.0, // ca. 2x2 Rasterfelder
    GROUND_FIRE_INNER_RADIUS: 3.1,
    GROUND_FIRE_DAMAGE: 1,
    SCORCH_LIFE: 10
  },

  players: [
    { name: 'Miau-Reich', color: [1.0, .55, .22], x: -78, z: 0, gold: 25.0, hp: 100, aimYaw: 0, aimPitch: 35, lastIncome: 0.5, weapon: 'cannon', weaponStates: null, catapultAnim: 0, cannonAnim: 0 },
    { name: 'Schnurr-Imperium', color: [.25, .78, 1.0], x: 78, z: 0, gold: 25.0, hp: 100, aimYaw: 0, aimPitch: 35, lastIncome: 0.5, weapon: 'cannon', weaponStates: null, catapultAnim: 0, cannonAnim: 0 }
  ],

  visual: {
    TOWER_VISUAL_SCALE: 2.00,
    WEAPON_TOWER_VISUAL_SCALE: 1.50,
    WEAPON_SCALE: 0.70,
    WALL_LENGTH_SCALE: 1.22,
    WALL_HEIGHT_SCALE: 1.00,
    WEAPON_TOWER_PLATFORM_LOCAL_Y: 4.62,
    WEAPON_TOWER_PAD_RADIUS: 1.16,
    WEAPON_TOWER_PAD_HEIGHT: 0.20,
    CANNON_BASE_OFFSET_FROM_CP: 0.18,
    CATAPULT_BASE_OFFSET_FROM_CP: 0.20
  },

  types: {
    wall: { hp: 5, w: 0.85, h: 4.8, d: 0.85, color: [.56, .58, .64], cost: 1, income: 0, repair: 0, heal: 0, icon: '🧱', label: 'Mauer' },
    tower: { hp: 100, w: 9.0, h: 17.6, d: 9.0, color: [.68, .70, .76], cost: 0, income: 0, repair: 0, heal: 0, icon: '🏰', label: 'Hauptturm' },
    weapon_tower: { hp: 90, w: 7.2, h: 8.0, d: 7.2, color: [.62, .58, .52], cost: 32, income: 0, repair: 0, heal: 0, icon: '🗼', label: 'Waffenturm' },
    cannon_weapon: { hp: 28, w: 4.0, h: 2.5, d: 3.0, color: [.20, .20, .22], cost: 22, income: 0, repair: 0, heal: 0, icon: '💣', label: 'Kanone' },
    catapult_weapon: { hp: 34, w: 5.2, h: 3.3, d: 4.0, color: [.48, .30, .16], cost: 26, income: 0, repair: 0, heal: 0, icon: '🔥', label: 'Katapult' },
    fish: { hp: 46, w: 3.4, h: 3.2, d: 3.4, color: [.25, .75, .42], cost: 14, income: 1.2, repair: 0, heal: 0, icon: '🐟', label: 'Fischküche' },
    workshop: { hp: 70, w: 3.8, h: 3.4, d: 3.6, color: [.62, .38, 1.0], cost: 22, income: 0.4, repair: 0, heal: 0, icon: '⚙️', label: 'Werkstatt' },
    granary: { hp: 62, w: 4.0, h: 3.0, d: 3.7, color: [.84, .70, .36], cost: 25, income: 2.0, repair: 0, heal: 0, icon: '🌾', label: 'Kornspeicher' },
    barracks: { hp: 82, w: 4.2, h: 3.8, d: 3.8, color: [.64, .46, .32], cost: 24, income: 0.2, repair: 0, heal: 0.5, icon: '🛡️', label: 'Kaserne' },
    catmint: { hp: 58, w: 3.6, h: 2.8, d: 3.6, color: [.30, .78, .62], cost: 18, income: 0.8, repair: 0, heal: 1, icon: '🌿', label: 'Katzenminze' }
  }
};
