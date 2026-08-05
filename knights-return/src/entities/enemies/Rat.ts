import Phaser from 'phaser';
import { Enemy } from './Enemy';
import { ENEMY_STATS } from '../../data/enemies';

export class Rat extends Enemy {
  constructor(scene: Phaser.Scene, x: number, y: number, platformLayer?: Phaser.Tilemaps.TilemapLayer) {
    super(scene, x, y, 'rat', ENEMY_STATS.rat, platformLayer);
    (this.body as Phaser.Physics.Arcade.Body).setSize(10, 8);
  }
}
