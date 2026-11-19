import { LevelConfig } from '../types/LevelConfig';

export const LEVELS: LevelConfig[] = [
  // Region 1 — The Borderlands
  { id: '1-1', regionId: 1, tilemapKey: '1-1', musicKey: 'music_region1', hasCheckpoint: true,  isChaseLevel: false, isBossLevel: false, crownThresholds: [90000, 120000, 180000] },
  { id: '1-2', regionId: 1, tilemapKey: '1-2', musicKey: 'music_region1', hasCheckpoint: true,  isChaseLevel: false, isBossLevel: false, crownThresholds: [90000, 120000, 180000] },
  { id: '1-3', regionId: 1, tilemapKey: '1-3', musicKey: 'music_region1', hasCheckpoint: true,  isChaseLevel: false, isBossLevel: false, crownThresholds: [90000, 120000, 180000] },
  { id: '1-4', regionId: 1, tilemapKey: '1-4', musicKey: 'music_region1', hasCheckpoint: true,  isChaseLevel: false, isBossLevel: false, crownThresholds: [90000, 120000, 180000] },
  // Region 2 — The Darkwood
  { id: '2-1', regionId: 2, tilemapKey: '2-1', musicKey: 'music_region2', hasCheckpoint: true,  isChaseLevel: false, isBossLevel: false, crownThresholds: [100000, 130000, 180000] },
  { id: '2-2', regionId: 2, tilemapKey: '2-2', musicKey: 'music_region2', hasCheckpoint: true,  isChaseLevel: false, isBossLevel: false, crownThresholds: [100000, 130000, 180000] },
  { id: '2-3', regionId: 2, tilemapKey: '2-3', musicKey: 'music_region2', hasCheckpoint: true,  isChaseLevel: false, isBossLevel: false, crownThresholds: [100000, 130000, 180000] },
  { id: '2-4', regionId: 2, tilemapKey: '2-4', musicKey: 'music_region2', hasCheckpoint: true,  isChaseLevel: false, isBossLevel: false, crownThresholds: [100000, 130000, 180000] },
  // Region 3 — The Crags
  { id: '3-1', regionId: 3, tilemapKey: '3-1', musicKey: 'music_region3', hasCheckpoint: true,  isChaseLevel: false, isBossLevel: false, crownThresholds: [110000, 140000, 180000] },
  { id: '3-2', regionId: 3, tilemapKey: '3-2', musicKey: 'music_region3', hasCheckpoint: true,  isChaseLevel: false, isBossLevel: false, crownThresholds: [110000, 140000, 180000] },
  { id: '3-3', regionId: 3, tilemapKey: '3-3', musicKey: 'music_region3', hasCheckpoint: true,  isChaseLevel: true,  isBossLevel: false, crownThresholds: [110000, 140000, 180000] },
  { id: '3-4', regionId: 3, tilemapKey: '3-4', musicKey: 'music_region3', hasCheckpoint: true,  isChaseLevel: false, isBossLevel: false, crownThresholds: [110000, 140000, 180000] },
  // Region 4 — The Marshes
  { id: '4-1', regionId: 4, tilemapKey: '4-1', musicKey: 'music_region4', hasCheckpoint: true,  isChaseLevel: false, isBossLevel: false, crownThresholds: [110000, 140000, 180000] },
  { id: '4-2', regionId: 4, tilemapKey: '4-2', musicKey: 'music_region4', hasCheckpoint: true,  isChaseLevel: false, isBossLevel: false, crownThresholds: [110000, 140000, 180000] },
  { id: '4-3', regionId: 4, tilemapKey: '4-3', musicKey: 'music_region4', hasCheckpoint: true,  isChaseLevel: false, isBossLevel: false, crownThresholds: [110000, 140000, 180000] },
  { id: '4-4', regionId: 4, tilemapKey: '4-4', musicKey: 'music_region4', hasCheckpoint: true,  isChaseLevel: false, isBossLevel: false, crownThresholds: [110000, 140000, 180000] },
  // Region 5 — The Occupied Castle
  { id: '5-1', regionId: 5, tilemapKey: '5-1', musicKey: 'music_region5', hasCheckpoint: false, isChaseLevel: false, isBossLevel: false, crownThresholds: [120000, 150000, 180000] },
  { id: '5-2', regionId: 5, tilemapKey: '5-2', musicKey: 'music_region5', hasCheckpoint: false, isChaseLevel: false, isBossLevel: false, crownThresholds: [120000, 150000, 180000] },
  { id: '5-3', regionId: 5, tilemapKey: '5-3', musicKey: 'music_region5', hasCheckpoint: false, isChaseLevel: true,  isBossLevel: false, crownThresholds: [120000, 150000, 180000] },
  { id: '5-4', regionId: 5, tilemapKey: '5-4', musicKey: 'music_region5', hasCheckpoint: false, isChaseLevel: false, isBossLevel: true,  crownThresholds: [180000, 180000, 180000] },
];

export function getLevelConfig(id: string): LevelConfig | undefined {
  return LEVELS.find(l => l.id === id);
}

/** Levels that have a built tilemap (public/assets/tilemaps/levels/<id>.json). Extend as levels ship. */
export const PLAYABLE_LEVEL_IDS: string[] = ['1-1', '1-2', '1-3'];

/** The playable level after `id`, or null when there is no more content yet. */
export function getNextLevelId(id: string): string | null {
  const i = PLAYABLE_LEVEL_IDS.indexOf(id);
  return i >= 0 && i + 1 < PLAYABLE_LEVEL_IDS.length ? PLAYABLE_LEVEL_IDS[i + 1] : null;
}

/** First playable level without a crown rating yet, else the last playable level. */
export function getContinueLevelId(crowns: Record<string, number>): string {
  return PLAYABLE_LEVEL_IDS.find(id => !crowns[id]) ?? PLAYABLE_LEVEL_IDS[PLAYABLE_LEVEL_IDS.length - 1];
}
