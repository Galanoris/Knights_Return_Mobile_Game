export type RegionId = 1 | 2 | 3 | 4 | 5;
export type WeaponId = 'fists' | 'sword' | 'bow';

export interface LevelConfig {
  id: string;               // e.g. '1-1'
  regionId: RegionId;
  tilemapKey: string;       // Phaser cache key for this level's JSON
  musicKey: string;
  hasCheckpoint: boolean;
  isChaseLevel: boolean;
  isBossLevel: boolean;
  crownThresholds: [number, number, number]; // time in ms for 3/2/1 crowns
}
