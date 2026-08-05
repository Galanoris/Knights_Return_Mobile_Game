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
