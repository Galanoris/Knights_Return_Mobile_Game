import Phaser from 'phaser';
import { GAME_WIDTH } from '../config';

interface CloudLayer {
  key: string;
  scrollFactor: number; // parallax: lower = farther away
  alpha: number;
  depth: number;
  minY: number;
  maxY: number;
  minGap: number;       // px between clouds along the layer
  maxGap: number;
}

const CLOUD_LAYERS: CloudLayer[] = [
  { key: 'cloud_small', scrollFactor: 0.15, alpha: 0.8, depth: -9, minY: 10, maxY: 60, minGap: 70,  maxGap: 120 },
  { key: 'cloud_big',   scrollFactor: 0.35, alpha: 1,   depth: -8, minY: 18, maxY: 84, minGap: 110, maxGap: 170 },
];

const DRIFT_PX = 6;

/**
 * Daytime sky (fixed to the camera) plus two parallax cloud layers.
 * Placement is seeded by `seed` (the level id) so a level always looks the same.
 */
export function createSkyBackground(scene: Phaser.Scene, mapWidthPx: number, seed: string): void {
  scene.add.image(0, 0, 'sky').setOrigin(0, 0).setScrollFactor(0).setDepth(-10);

  const rnd = new Phaser.Math.RandomDataGenerator([seed]);
  const maxCamScroll = Math.max(0, mapWidthPx - GAME_WIDTH);

  for (const layer of CLOUD_LAYERS) {
    // A layer at scroll factor f only ever shows world x in [0, maxCamScroll * f + GAME_WIDTH]
    const span = maxCamScroll * layer.scrollFactor + GAME_WIDTH;
    let x = rnd.between(-24, layer.minGap / 2);
    while (x < span + 48) {
      const cloud = scene.add.image(x, rnd.between(layer.minY, layer.maxY), layer.key)
        .setScrollFactor(layer.scrollFactor)
        .setAlpha(layer.alpha)
        .setDepth(layer.depth)
        .setFlipX(rnd.frac() < 0.5);
      scene.tweens.add({
        targets: cloud,
        x: x + (rnd.frac() < 0.5 ? -DRIFT_PX : DRIFT_PX),
        duration: rnd.between(4000, 6000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      x += rnd.between(layer.minGap, layer.maxGap);
    }
  }
}
