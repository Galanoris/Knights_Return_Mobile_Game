import Phaser from 'phaser';
import { Enemy } from './Enemy';
import { ENEMY_STATS } from '../../data/enemies';

type CrowState = 'patrol' | 'swoop' | 'return';

const PATROL_RANGE = 48;      // px either side of the spawn point
const BOB_AMPLITUDE = 3;      // px vertical bob while hovering
const TRIGGER_RANGE_X = 90;   // start a swoop when the player is this close horizontally…
const TRIGGER_MIN_DY = 16;    // …and at least this far below
const SWOOP_SPEED = 130;      // px/s along the dive vector
const SWOOP_MAX_MS = 900;     // give up on a dive after this long
const RETURN_SPEED = 70;      // px/s climbing back to the hover height
const COOLDOWN_MS = 1400;     // pause between swoops

/**
 * Flying Region 1 enemy. Hovers at its spawn height and patrols a short span.
 * When the player passes below, it dives at where the player was (aimed once,
 * so a step forward or a jump dodges it), then climbs back.
 * It can be stomped, punched or pogoed like any other enemy.
 */
export class Crow extends Enemy {
  private readonly homeX: number;
  private readonly homeY: number;
  private readonly target: Phaser.GameObjects.Components.Transform;
  private crowState: CrowState = 'patrol';
  private stateTimer = 0;
  private cooldown = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, target: Phaser.GameObjects.Components.Transform) {
    super(scene, x, y, 'crow', ENEMY_STATS.crow);
    this.homeX = x;
    this.homeY = y;
    this.target = target;
    this.dir = -1; // start flying toward the player
    (this.body as Phaser.Physics.Arcade.Body).setSize(10, 8);
  }

  override applyBodySettings(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setMaxVelocity(SWOOP_SPEED, SWOOP_SPEED);
  }

  override update(): void {
    if (!this.active) return;
    const body = this.body as Phaser.Physics.Arcade.Body;
    const dt = this.scene.game.loop.delta;
    this.stateTimer += dt;
    if (this.cooldown > 0) this.cooldown -= dt;

    switch (this.crowState) {
      case 'patrol': {
        if (this.x > this.homeX + PATROL_RANGE) this.dir = -1;
        if (this.x < this.homeX - PATROL_RANGE) this.dir = 1;
        const bobY = this.homeY + Math.sin(this.stateTimer / 250) * BOB_AMPLITUDE;
        body.setVelocity(this.dir * this.stats.speed, (bobY - this.y) * 6);

        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        if (this.cooldown <= 0 && Math.abs(dx) < TRIGGER_RANGE_X && dy > TRIGGER_MIN_DY) {
          // Aim once at the player's current position
          const len = Math.hypot(dx, dy);
          body.setVelocity((dx / len) * SWOOP_SPEED, (dy / len) * SWOOP_SPEED);
          this.dir = dx < 0 ? -1 : 1;
          this.enter('swoop');
          this.setTint(0xffaaaa); // brief tell that it is diving
        }
        break;
      }
      case 'swoop':
        if (body.blocked.down || body.blocked.left || body.blocked.right || this.stateTimer > SWOOP_MAX_MS) {
          this.enter('return');
        }
        break;
      case 'return':
        body.setVelocity(this.dir * this.stats.speed * 0.5, -RETURN_SPEED);
        if (this.y <= this.homeY || body.blocked.up) {
          this.cooldown = COOLDOWN_MS;
          this.enter('patrol');
        }
        break;
    }

    this.setFlipX(this.dir < 0);
  }

  private enter(state: CrowState): void {
    this.crowState = state;
    this.stateTimer = 0;
    if (state !== 'swoop') this.clearTint();
  }
}
