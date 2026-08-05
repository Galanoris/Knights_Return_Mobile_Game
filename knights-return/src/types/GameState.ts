export interface Upgrades {
  swordSpeed: 0 | 1 | 2 | 3;
  maxHearts: 3 | 4 | 5;
  arrowCapacity: number;  // base 10, +5 per tier
  goldenArmor: boolean;
}

export interface SaveData {
  version: number;
  coins: number;
  crowns: Record<string, number>;       // e.g. '1-1': 2
  bestTimes: Record<string, number>;    // e.g. '1-1': 98400 (ms)
  relics: Record<string, boolean>;      // e.g. '1-1': true
  upgrades: Upgrades;
  difficulty: 'squire' | 'knight';
}

export const DEFAULT_SAVE: SaveData = {
  version: 1,
  coins: 0,
  crowns: {},
  bestTimes: {},
  relics: {},
  upgrades: {
    swordSpeed: 0,
    maxHearts: 3,
    arrowCapacity: 10,
    goldenArmor: false,
  },
  difficulty: 'knight',
};
