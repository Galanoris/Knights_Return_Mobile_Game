import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, MAX_GAME_WIDTH } from '../config';

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
const VERTICAL_PARALLAX = 0.3; // clouds move vertically at this fraction of their horizontal factor

/**
 * Daytime sky (fixed to the camera) plus two parallax cloud layers.
 * Placement is seeded by `seed` (the level id) so a level always looks the same.
 * On maps taller than the screen (tower climbs) clouds also drift vertically, and are
 * placed so they sit at their intended screen height while the camera is at ground level.
 */
export function createSkyBackground(scene: Phaser.Scene, mapWidthPx: number, mapHeightPx: number, seed: string): void {
  scene.add.image(0, 0, 'sky').setOrigin(0, 0).setScrollFactor(0).setDepth(-10);

  const rnd = new Phaser.Math.RandomDataGenerator([seed]);
  // The view can be GAME_WIDTH..MAX_GAME_WIDTH wide (ViewportFit): cover the largest scroll
  // (narrowest view) plus the widest view
  const maxCamScroll = Math.max(0, mapWidthPx - GAME_WIDTH);
  const camYAtGround = Math.max(0, mapHeightPx - GAME_HEIGHT);

  for (const layer of CLOUD_LAYERS) {
    // A layer at scroll factor f only ever shows world x in [0, maxCamScroll * f + view width]
    const span = maxCamScroll * layer.scrollFactor + MAX_GAME_WIDTH;
    const fy = layer.scrollFactor * VERTICAL_PARALLAX;
    let x = rnd.between(-24, layer.minGap / 2);
    while (x < span + 48) {
      const cloud = scene.add.image(x, rnd.between(layer.minY, layer.maxY) + camYAtGround * fy, layer.key)
        .setScrollFactor(layer.scrollFactor, fy)
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
