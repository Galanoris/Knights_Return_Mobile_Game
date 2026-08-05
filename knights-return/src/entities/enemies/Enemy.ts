import Phaser from 'phaser';
import { EnemyStats } from '../../data/enemies';
import { TILE_SIZE } from '../../config';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  protected stats: EnemyStats;
  protected health: number;
  protected dir: 1 | -1 = 1;
  protected platformLayer: Phaser.Tilemaps.TilemapLayer | null = null;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    textureKey: string,
    stats: EnemyStats,
    platformLayer?: Phaser.Tilemaps.TilemapLayer,
  ) {
    super(scene, x, y, textureKey);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.stats = stats;
    this.health = stats.health;
    this.platformLayer = platformLayer ?? null;
    (this.body as Phaser.Physics.Arcade.Body).setMaxVelocityX(stats.speed * 1.5);
  }

  update(): void {
    if (!this.active) return;
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body.blocked.left)  this.dir = 1;
    if (body.blocked.right) this.dir = -1;

    // Ledge detection: don't walk off platform edges
    if (body.blocked.down && this.platformLayer) {
      const lookX = this.x + this.dir * (body.width / 2 + 2);
      const lookY = this.y + body.height / 2 + TILE_SIZE / 2;
      const tile = this.platformLayer.getTileAtWorldXY(lookX, lookY);
      if (!tile || tile.index <= 0) {
        this.dir = (this.dir === 1 ? -1 : 1) as 1 | -1;
      }
    }

    body.setVelocityX(this.dir * this.stats.speed);
    this.setFlipX(this.dir < 0);
  }

  takeDamage(amount: number): void {
    if (!this.active) return;
    this.health -= amount;
    if (this.health <= 0) {
      this.die();
    } else {
      this.scene.tweens.add({
        targets: this,
        alpha: 0,
        duration: 80,
        yoyo: true,
        repeat: 1,
        onComplete: () => { if (this.active) this.alpha = 1; },
      });
    }
  }

  private die(): void {
    this.scene.events.emit('enemyKilled', this.stats.coinValue);
    this.destroy();
  }
}
