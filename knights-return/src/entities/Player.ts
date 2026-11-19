import Phaser from 'phaser';
import { StateMachine } from '../systems/StateMachine';
import { InputManager } from '../systems/InputManager';
import {
  PLAYER_SPEED,
  PLAYER_ACCEL,
  PLAYER_DECEL,
  JUMP_VELOCITY,
  JUMP_CUT_MULTIPLIER,
  COYOTE_TIME_MS,
  HIT_INVINCIBILITY_MS,
  KNOCKBACK_VELOCITY,
} from '../config';
import { PlayerStateName } from '../types/PlayerState';

// Player frames are 24×20 with the 12×16 knight at (6, 4) — see PreloadScene.
// Origin (0.5, 0.6) keeps this.x / this.y on the body centre.
const FRAME_W = 24, FRAME_H = 20, BODY_W = 12, BODY_H = 16, BODY_OFF_X = 6, BODY_OFF_Y = 4;

// Hitboxes, relative to the body centre (x mirrored when facing left).
// Swing: front + overhead arc so diving crows can be swatted; still reaches rats on the ground.
const SWING_BOX = { w: 22, h: 32, dx: 9, dy: -8 };
const POGO_BOX  = { w: 14, h: 14, dx: 0, dy: 12 };
const SWING_ACTIVE_MS = 180;   // hitbox live time
const SWING_TOTAL_MS  = 260;   // attack state length (recovery after the hitbox closes)
const SWING_ARC_PIVOT = { x: 4, y: 22, w: 24, h: 31 }; // pivot of the 'swing_arc' texture

export interface PlayerConfig {
  maxHearts: number;
  lives: number;
}

export class Player extends Phaser.Physics.Arcade.Sprite {
  readonly fsm: StateMachine;

  // Health
  hearts: number;
  maxHearts: number;
  lives: number;

  // Timers (ms)
  coyoteTimer = 0;
  invincibilityTimer = 0;

  // State flags
  private wasOnGround = false;
  private facingRight = true;
  private hasDoubleJump = false;

  // Attack hitbox (invisible rectangle, managed per-frame)
  attackHitbox: Phaser.GameObjects.Rectangle;
  private hitboxMode: 'swing' | 'pogo' = 'swing';
  private swingHits = new Set<object>();   // enemies already hit by the current swing
  private swingId = 0;                     // guards delayed callbacks from older swings
  private swingArc: Phaser.GameObjects.Image | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number, config: PlayerConfig) {
    super(scene, x, y, 'player');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.maxHearts = config.maxHearts;
    this.hearts = config.maxHearts;
    this.lives = config.lives;

    // Arcade body config
    const body = this.body as Phaser.Physics.Arcade.Body;
    this.setOrigin(0.5, (BODY_OFF_Y + BODY_H / 2) / FRAME_H);
    body.setSize(BODY_W, BODY_H, false);
    body.setOffset(BODY_OFF_X, BODY_OFF_Y);
    body.setMaxVelocityX(PLAYER_SPEED);
    body.setCollideWorldBounds(false);
    if (this.width !== FRAME_W) console.warn(`Player frame is ${this.width}px wide, expected ${FRAME_W}`);

    // Attack hitbox (disabled by default)
    this.attackHitbox = scene.add.rectangle(x, y, SWING_BOX.w, SWING_BOX.h, 0xff0000, 0);
    scene.physics.add.existing(this.attackHitbox, false);
    (this.attackHitbox.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    this.disableAttackHitbox();

    this.fsm = new StateMachine();
    this.buildFSM();
    this.fsm.transition('idle');
  }

  private buildFSM(): void {
    const body = () => this.body as Phaser.Physics.Arcade.Body;

    this.fsm
      .addState('idle', { onEnter: () => this.playAnim('idle') })
      .addState('run',  { onEnter: () => this.playAnim('run') })
      .addState('jump', {
        onEnter: () => {
          body().setVelocityY(JUMP_VELOCITY);
          this.playAnim('jump');
        },
      })
      .addState('fall', { onEnter: () => this.playAnim('fall') })
      .addState('attack', {
        onEnter: () => {
          const id = ++this.swingId;
          this.playAnim('attack');
          this.enableAttackHitbox('swing');
          this.showSwingArc();
          this.scene.time.delayedCall(SWING_ACTIVE_MS, () => {
            if (this.swingId === id) this.disableAttackHitbox();
          });
          this.scene.time.delayedCall(SWING_TOTAL_MS, () => {
            if (this.swingId === id && this.fsm.state === 'attack') this.fsm.transition('idle');
          });
        },
        onExit: () => this.disableAttackHitbox(),
      })
      .addState('pogo', {
        onEnter: () => {
          const b = body();
          b.setVelocityY(200); // strong downward
          this.swingId++;
          this.enableAttackHitbox('pogo');
          this.playAnim('pogo');
        },
        onExit: () => this.disableAttackHitbox(),
      })
      .addState('hurt', {
        onEnter: () => {
          this.invincibilityTimer = HIT_INVINCIBILITY_MS;
          this.playAnim('hurt');
          // Flicker effect
          this.scene.tweens.add({
            targets: this,
            alpha: 0,
            duration: 80,
            yoyo: true,
            repeat: Math.floor(HIT_INVINCIBILITY_MS / 160),
            onComplete: () => { this.alpha = 1; },
          });
        },
      })
      .addState('dead', {
        onEnter: () => {
          this.playAnim('dead');
          this.body!.enable = false;
        },
      });
  }

  update(delta: number, input: InputManager): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down;
    const state = this.fsm.state as PlayerStateName;

    // Tick timers
    if (this.invincibilityTimer > 0) this.invincibilityTimer -= delta;
    input.update(delta);

    // Coyote time
    if (onGround) {
      this.coyoteTimer = COYOTE_TIME_MS;
    } else if (this.coyoteTimer > 0) {
      this.coyoteTimer -= delta;
    }

    // Landing detection → trigger buffered jump + reset double jump
    if (!this.wasOnGround && onGround) {
      this.hasDoubleJump = false;
      if (input.consumeJumpBuffer()) {
        this.doJump();
      }
    }
    this.wasOnGround = onGround;

    // Dead / hurt: skip most logic
    if (state === 'dead') return;
    if (state === 'hurt') {
      this.applyHorizontalMovement(body, input);
      if (input.jumpJustPressed) {
        if (this.coyoteTimer > 0) {
          this.doJump();
        } else if (this.hasDoubleJump) {
          this.hasDoubleJump = false;
          body.setVelocityY(JUMP_VELOCITY);
          this.fsm.transition('jump');
        }
      }
      // Allow attacking while flickering — read live state in case jump just fired
      if (input.attackJustPressed && this.fsm.state === 'hurt') {
        this.fsm.transition('attack');
      }
      this.fsm.update(delta);
      this.updateHitboxPosition();
      return;
    }

    // Attack input
    if (state !== 'attack' && state !== 'pogo' && input.attackJustPressed) {
      if ((state === 'jump' || state === 'fall') && input.down) {
        this.fsm.transition('pogo');
      } else {
        this.fsm.transition('attack');
      }
    }

    // Jump cut — release early for lower arc
    if ((state === 'jump') && input.jumpJustReleased && body.velocity.y < 0) {
      body.setVelocityY(body.velocity.y * JUMP_CUT_MULTIPLIER);
    }

    // Jump input
    if (state !== 'attack' && state !== 'pogo') {
      const canJump = this.coyoteTimer > 0 && (state === 'idle' || state === 'run' || state === 'jump' || onGround);
      if (input.jumpJustPressed) {
        if (canJump) {
          this.doJump();
        } else if ((state === 'jump' || state === 'fall') && this.hasDoubleJump) {
          this.hasDoubleJump = false;
          body.setVelocityY(JUMP_VELOCITY); // set directly — FSM skips onEnter for same-state transition
          if (state === 'fall') {
            this.fsm.transition('jump'); // onEnter will also set velocity + play anim
          } else {
            this.playAnim('jump'); // re-play anim; FSM won't re-fire onEnter for jump→jump
          }
        }
      }
    }

    // A pogo that lands without hitting anything ends on touchdown
    if (this.fsm.state === 'pogo' && onGround) this.fsm.transition('idle');

    // Transition ground states — re-read live FSM state so an attack/pogo that just fired
    // this frame is not overwritten by a stale local `state` variable.
    {
      const s = this.fsm.state as PlayerStateName;
      if (s !== 'attack' && s !== 'pogo' && s !== 'hurt') {
        if (!onGround && body.velocity.y > 0 && s !== 'fall') {
          this.fsm.transition('fall');
        } else if (onGround && body.velocity.y >= 0) {
          // `onGround` was sampled before this frame's jump; a jump that just fired has set an
          // upward velocity — don't overwrite it with idle/run, or the rise isn't a 'jump'
          // (no jump cut, no double jump, no pogo until the apex).
          if (Math.abs(body.velocity.x) > 5 && (s === 'idle' || s === 'fall' || s === 'jump')) {
            this.fsm.transition('run');
          } else if (Math.abs(body.velocity.x) <= 5 && (s === 'run' || s === 'fall' || s === 'jump')) {
            this.fsm.transition('idle');
          }
        }
      }
    }

    this.applyHorizontalMovement(body, input);
    this.fsm.update(delta);
    this.updateHitboxPosition();
  }

  private doJump(): void {
    this.coyoteTimer = 0;
    this.hasDoubleJump = true; // unlock double jump after first jump
    this.fsm.transition('jump');
  }

  private applyHorizontalMovement(body: Phaser.Physics.Arcade.Body, input: InputManager): void {
    if (input.left) {
      body.setAccelerationX(-PLAYER_ACCEL);
      body.setDragX(0);
      this.facingRight = false;
      this.setFlipX(true);
    } else if (input.right) {
      body.setAccelerationX(PLAYER_ACCEL);
      body.setDragX(0);
      this.facingRight = true;
      this.setFlipX(false);
    } else {
      body.setAccelerationX(0);
      // Ground: quick stop. Air: preserve horizontal momentum (SNES feel).
      body.setDragX(body.blocked.down ? PLAYER_DECEL : 0);
      if (body.blocked.down && Math.abs(body.velocity.x) < 5) {
        body.setVelocityX(0);
      }
    }
  }

  private updateHitboxPosition(): void {
    const box = this.hitboxMode === 'pogo' ? POGO_BOX : SWING_BOX;
    const dir = this.facingRight ? 1 : -1;
    this.attackHitbox.setPosition(this.x + dir * box.dx, this.y + box.dy);
    if (this.swingArc) this.swingArc.setPosition(this.x, this.y);
  }

  private enableAttackHitbox(mode: 'swing' | 'pogo'): void {
    this.hitboxMode = mode;
    this.swingHits.clear();
    const box = mode === 'pogo' ? POGO_BOX : SWING_BOX;
    const hb = this.attackHitbox.body as Phaser.Physics.Arcade.Body;
    hb.setSize(box.w, box.h, true); // centred on the rectangle's position
    this.updateHitboxPosition();
    this.attackHitbox.setVisible(false); // invisible in production; set true to debug
    hb.enable = true;
  }

  /** Returns true the first time `target` is hit during the current swing/pogo — one hit per swing. */
  registerHit(target: object): boolean {
    if (this.swingHits.has(target)) return false;
    this.swingHits.add(target);
    return true;
  }

  /** Short-lived crescent over the swing's reach, mirrored to the facing direction. */
  private showSwingArc(): void {
    this.swingArc?.destroy();
    const p = SWING_ARC_PIVOT;
    const ox = this.facingRight ? p.x / p.w : 1 - p.x / p.w; // flipX mirrors within the frame
    const arc = this.scene.add.image(this.x, this.y, 'swing_arc')
      .setOrigin(ox, p.y / p.h)
      .setFlipX(!this.facingRight)
      .setDepth(this.depth + 1)
      .setAlpha(0.85);
    this.swingArc = arc;
    this.scene.tweens.add({
      targets: arc, alpha: 0, duration: 150,
      onComplete: () => { arc.destroy(); if (this.swingArc === arc) this.swingArc = null; },
    });
  }

  private disableAttackHitbox(): void {
    (this.attackHitbox.body as Phaser.Physics.Arcade.Body).enable = false;
  }

  private playAnim(key: string): void {
    // Animations live in the global manager (PreloadScene); states without one show the standing pose.
    if (this.scene.anims.exists(key)) {
      this.play(key, true);
    } else {
      this.anims.stop();
      this.setTexture('player');
    }
  }

  takeDamage(sourceX: number): void {
    if (this.invincibilityTimer > 0) return;
    if (this.fsm.state === 'dead') return;

    this.hearts -= 1;
    this.scene.events.emit('heartChanged', this.hearts, this.maxHearts);

    // Knockback
    const dir = this.x > sourceX ? 1 : -1;
    (this.body as Phaser.Physics.Arcade.Body).setVelocityX(dir * KNOCKBACK_VELOCITY);

    if (this.hearts <= 0) {
      this.fsm.transition('dead');
      this.scene.events.emit('playerDead');
    } else {
      this.fsm.transition('hurt');
      // Auto-recover from hurt after invincibility window
      this.scene.time.delayedCall(HIT_INVINCIBILITY_MS, () => {
        if (this.fsm.state === 'hurt') this.fsm.transition('idle');
      });
    }
  }

  /** Called when player falls into a pit — instant life loss */
  fallDeath(): void {
    if (this.fsm.state === 'dead') return;
    this.hearts = this.maxHearts; // hearts reset on respawn
    this.fsm.transition('dead');
    this.scene.events.emit('playerDead');
  }
}
