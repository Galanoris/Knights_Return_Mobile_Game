import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Spike } from '../entities/hazards/Spike';
import { Enemy } from '../entities/enemies/Enemy';
import { Rat } from '../entities/enemies/Rat';
import { Crow } from '../entities/enemies/Crow';
import { InputManager } from '../systems/InputManager';
import { CameraController } from '../systems/CameraController';
import { CheckpointManager } from '../systems/CheckpointManager';
import { SaveManager } from '../systems/SaveManager';
import { CrownRater } from '../systems/CrownRater';
import { createSkyBackground } from '../systems/SkyBackground';
import { resetTouchInput } from '../ui/TouchControls';
import { getLevelConfig } from '../data/levels';
import { GRAVITY, TILE_SIZE, HIT_INVINCIBILITY_MS } from '../config';
import { LevelConfig } from '../types/LevelConfig';

const HIT_CONTACT_GRACE_MS = 150;
const PAUSE_REOPEN_GUARD_MS = 200; // the key that closed the pause menu must not reopen it
const TILE_CRACKED = 2; // 'B' in levels-src: solid like a brick until punched

interface GameSceneData {
  levelKey: string;
  levelId: string;
}

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private inputMgr!: InputManager;
  private camera!: CameraController;
  private checkpoint!: CheckpointManager;
  private levelConfig!: LevelConfig;

  private platforms!: Phaser.Tilemaps.TilemapLayer;
  private spikes!: Phaser.Physics.Arcade.StaticGroup;
  private coins!: Phaser.Physics.Arcade.StaticGroup;
  private relics!: Phaser.Physics.Arcade.StaticGroup;
  private enemies!: Phaser.Physics.Arcade.Group;

  // Level state
  private levelId = '';
  private levelKey = '';
  /** Level time, accumulated from frame deltas so it stops while the game is paused. */
  private levelElapsedMs = 0;
  private lastResumeAt = -Infinity;
  private levelCoinsCollected = 0;
  private totalCoins = 0;

  // Spawn position (read from object layer or fallback)
  private spawnX = TILE_SIZE * 2;
  private spawnY = TILE_SIZE * 10;

  // Level end flag (prevent multiple triggers)
  private levelEnded = false;
  /** When each enemy was last hit by the player's attack — contact damage is ignored briefly after. */
  private lastHitAt = new WeakMap<Enemy, number>();
  private relicFound = false;
  private mapBottom = 0;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: GameSceneData): void {
    this.levelId = data.levelId;
    this.levelKey = data.levelKey;
    this.levelEnded = false;
    this.relicFound = false;
    this.levelCoinsCollected = 0;
    this.totalCoins = 0;
    this.levelElapsedMs = 0;
    this.lastResumeAt = -Infinity;
    this.spawnX = TILE_SIZE * 2;
    this.spawnY = TILE_SIZE * 10;
    // Initialize checkpoint with default spawn (overwritten by parseSpawnPoint)
    this.checkpoint = new CheckpointManager(TILE_SIZE * 2, TILE_SIZE * 10);
  }

  create(_data: GameSceneData): void {
    this.physics.world.gravity.y = GRAVITY;

    const config = getLevelConfig(this.levelId);
    // Fall back to a minimal config for the test level
    this.levelConfig = config ?? {
      id: this.levelId,
      regionId: 1,
      tilemapKey: this.levelKey,
      musicKey: 'music_region1',
      hasCheckpoint: true,
      isChaseLevel: false,
      isBossLevel: false,
      crownThresholds: [60000, 90000, 180000],
    };

    const map = this.buildTilemap(this.levelKey);
    createSkyBackground(this, map.widthInPixels, map.heightInPixels, this.levelId);

    // Physics groups (must exist before parseObjectLayers spawns into them)
    this.spikes  = this.physics.add.staticGroup();
    this.coins   = this.physics.add.staticGroup();
    this.relics  = this.physics.add.staticGroup();
    this.enemies = this.physics.add.group();

    // Pass 1: extract spawn point + collect zone definitions + spawn statics
    this.parseSpawnPoint(map);
    const zoneDefs = this.extractZoneDefs(map);
    this.spawnStatics(map);

    // Create player now that we have spawnX/Y
    const save = SaveManager.get();
    this.player = new Player(this, this.spawnX, this.spawnY, {
      maxHearts: save.upgrades.maxHearts,
      lives: 3,
    });

    // Pass 2: create trigger zones + spawn enemies (need this.player to exist for overlaps)
    this.createZones(zoneDefs);
    this.spawnEnemies(map);

    // Colliders and overlaps
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.enemies, this.platforms);

    this.physics.add.overlap(
      this.player, this.spikes,
      (_p, spike) => { this.player.takeDamage((spike as Spike).x); },
      undefined, this,
    );
    // Attack overlap is registered BEFORE contact damage: Arcade resolves overlaps in
    // creation order, so a punch that lands in the same step as a touch wins the trade.
    this.physics.add.overlap(
      this.player.attackHitbox, this.enemies,
      (_hb, enemy) => { this.onAttackHit(enemy as Enemy); },
      undefined, this,
    );
    this.physics.add.overlap(
      this.player, this.enemies,
      this.onPlayerEnemyContact, undefined, this,
    );
    this.physics.add.overlap(
      this.player, this.coins,
      (_p, coin) => { this.collectCoin(coin as Phaser.Physics.Arcade.Image); },
      undefined, this,
    );
    this.physics.add.overlap(
      this.player, this.relics,
      (_p, relic) => { this.collectRelic(relic as Phaser.Physics.Arcade.Image); },
      undefined, this,
    );

    this.inputMgr = new InputManager(this);

    const mapWidth = this.platforms.tilemap.widthInPixels;
    const mapHeight = this.platforms.tilemap.heightInPixels;
    this.mapBottom = mapHeight;
    this.camera = new CameraController(
      this.cameras.main,
      this.player,
      new Phaser.Geom.Rectangle(0, 0, mapWidth, mapHeight),
    );

    // HUD as parallel scene — stop first to ensure create() always runs fresh on restart
    this.scene.stop('HUDScene');
    this.scene.launch('HUDScene');
    this.events.emit('heartChanged', this.player.hearts, this.player.maxHearts);
    this.events.emit('coinChanged', this.levelCoinsCollected);
    this.events.emit('livesChanged', this.player.lives);

    // Player death handler — off before on so listeners never accumulate across restarts
    this.events.off('playerDead', this.onPlayerDead, this);
    this.events.on('playerDead', this.onPlayerDead, this);

    // Enemy kill handler
    this.events.off('enemyKilled');
    this.events.on('enemyKilled', (coinValue: number) => {
      this.levelCoinsCollected += coinValue;
      SaveManager.addCoins(coinValue);
      this.events.emit('coinChanged', this.levelCoinsCollected);
    }, this);

    // Pause: Esc or P (browsers swallow Esc in fullscreen), or the HUD's pause button.
    // Keyboard-plugin listeners are cleared on shutdown; scene-event listeners are not → off/on.
    const onPauseKey = (ev: KeyboardEvent) => { if (!ev.repeat) this.openPause(); };
    this.input.keyboard!.on('keydown-ESC', onPauseKey);
    this.input.keyboard!.on('keydown-P', onPauseKey);
    this.events.off('requestPause', this.openPause, this);
    this.events.on('requestPause', this.openPause, this);
    this.events.off(Phaser.Scenes.Events.RESUME, this.onResumed, this);
    this.events.on(Phaser.Scenes.Events.RESUME, this.onResumed, this);

    this.showLevelTitle();
  }

  /** Freeze the level (physics, tweens, timers, HUD) and show the pause menu on top. */
  private openPause(): void {
    if (this.levelEnded || this.scene.isPaused()) return;
    if (this.game.loop.time - this.lastResumeAt < PAUSE_REOPEN_GUARD_MS) return;
    this.scene.pause();
    this.scene.pause('HUDScene');
    resetTouchInput();
    this.scene.launch('PauseScene', { levelId: this.levelId, levelKey: this.levelKey });
    this.scene.bringToTop('PauseScene');
  }

  private onResumed(): void {
    this.lastResumeAt = this.game.loop.time;
    resetTouchInput(); // a finger lifted while paused must not keep the knight running
  }

  private buildTilemap(key: string): Phaser.Tilemaps.Tilemap {
    const map = this.make.tilemap({ key });
    const tileset = map.addTilesetImage('tiles', 'tiles');
    if (!tileset) {
      throw new Error(`Tileset "tiles" not found in map "${key}"`);
    }
    const layer = map.createLayer('Platforms', tileset, 0, 0);
    if (!layer) {
      throw new Error(`Layer "Platforms" not found in map "${key}"`);
    }
    layer.setCollisionByExclusion([-1, 0]);
    this.platforms = layer;
    return map;
  }

  // --- Object layer parsing (split into 3 passes) ---

  /** Pass 1a: read spawn point from Entities layer */
  private parseSpawnPoint(map: Phaser.Tilemaps.Tilemap): void {
    const layer = map.getObjectLayer('Entities');
    if (!layer) return;
    for (const obj of layer.objects) {
      if (obj.type === 'spawn') {
        this.spawnX = obj.x ?? this.spawnX;
        this.spawnY = obj.y ?? this.spawnY;
      }
    }
    // Until a checkpoint is touched, respawn where the level starts
    this.checkpoint.activate(this.spawnX, this.spawnY);
  }

  /** Pass 1b: collect zone definitions from Triggers layer (no overlaps yet) */
  private extractZoneDefs(map: Phaser.Tilemaps.Tilemap): { type: string; x: number; y: number; w: number; h: number }[] {
    const defs: Array<{ type: string; x: number; y: number; w: number; h: number }> = [];
    const layer = map.getObjectLayer('Triggers');
    if (!layer) return defs;
    for (const obj of layer.objects) {
      if ((obj.type === 'checkpoint' && this.levelConfig.hasCheckpoint) || obj.type === 'end_trigger') {
        defs.push({ type: obj.type, x: obj.x ?? 0, y: obj.y ?? 0, w: obj.width ?? 16, h: obj.height ?? 16 });
      }
    }
    return defs;
  }

  /** Pass 1c: spawn static hazards + collectibles (no player overlaps needed) */
  private spawnStatics(map: Phaser.Tilemaps.Tilemap): void {
    const hazLayer = map.getObjectLayer('Hazards');
    if (hazLayer) {
      for (const obj of hazLayer.objects) {
        if (obj.type === 'spike') {
          const spike = new Spike(this, obj.x ?? 0, obj.y ?? 0, obj.width ?? 16, obj.height ?? 16);
          this.spikes.add(spike, true);
        } else if (obj.type === 'fire') {
          // Burning debris: same damage as spikes, animated flame
          const fire = new Spike(this, obj.x ?? 0, obj.y ?? 0, obj.width ?? 16, obj.height ?? 16, 'fire1');
          this.spikes.add(fire, true);
          fire.play({ key: 'fire', startFrame: Phaser.Math.Between(0, 1) });
        }
      }
    }

    const colLayer = map.getObjectLayer('Collectibles');
    if (colLayer) {
      for (const obj of colLayer.objects) {
        const cx = (obj.x ?? 0) + (obj.width ?? 12) / 2;
        const cy = (obj.y ?? 0) + (obj.height ?? 12) / 2;
        if (obj.type === 'coin') {
          this.coins.add(this.physics.add.staticImage(cx, cy, 'coin'), true);
          this.totalCoins++;
        } else if (obj.type === 'relic') {
          const img = this.physics.add.staticImage(cx, cy, 'relic');
          this.tweens.add({ targets: img, scaleX: 1.2, scaleY: 1.2, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
          this.relics.add(img, true);
        }
      }
    }
  }

  private createPhysicsZone(x: number, y: number, w: number, h: number): Phaser.GameObjects.Zone {
    const zone = this.add.zone(x, y, w, h);
    this.physics.world.enable(zone);
    (zone.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    return zone;
  }

  /** Pass 2: create trigger zones with player overlaps (player must exist) */
  private createZones(defs: { type: string; x: number; y: number; w: number; h: number }[]): void {
    for (const def of defs) {
      const { x, y, w, h } = def;
      // Visuals stand on the real ground surface in the zone's column (rooftops, raised ground);
      // falls back to "ground = bottom 3 rows" if the column is a pit.
      const cx = x + w / 2;
      const surface = this.groundSurfaceY(cx) ?? y + h - TILE_SIZE * 3;
      if (def.type === 'checkpoint') {
        const cy = surface - TILE_SIZE; // respawn just above the surface
        const visual = this.add.image(cx, surface, 'checkpoint').setOrigin(0.5, 1).setDepth(2);
        const zone = this.createPhysicsZone(x + w / 2, y + h / 2, w, h);
        this.physics.add.overlap(this.player, zone, () => {
          if (this.checkpoint.x !== cx) {
            this.checkpoint.activate(cx, cy);
            visual.setTexture('checkpoint_active');
          }
        }, undefined, this);
      } else if (def.type === 'end_trigger') {
        this.add.image(cx, surface, 'banner').setOrigin(0.5, 1).setDepth(2);
        const zone = this.createPhysicsZone(x + w / 2, y + h / 2, w, h);
        this.physics.add.overlap(this.player, zone, () => {
          if (!this.levelEnded && this.player.fsm.state !== 'dead') {
            this.triggerLevelEnd();
          }
        }, undefined, this);
      }
    }
  }

  /**
   * Top y of the solid tile column that reaches the map bottom at worldX — i.e. the ground
   * or rooftop a marker stands on (floating platforms above are ignored). Null over a pit.
   */
  private groundSurfaceY(worldX: number): number | null {
    const map = this.platforms.tilemap;
    const col = Math.floor(worldX / TILE_SIZE);
    const solid = (row: number) => (this.platforms.getTileAt(col, row)?.index ?? -1) > 0;
    let row = map.height - 1;
    if (!solid(row)) return null;
    while (row > 0 && solid(row - 1)) row--;
    return row * TILE_SIZE;
  }

  private collectCoin(coin: Phaser.Physics.Arcade.Image): void {
    if (!coin.active) return;
    coin.destroy();
    this.levelCoinsCollected++;
    SaveManager.addCoins(1);
    this.events.emit('coinChanged', this.levelCoinsCollected);
  }

  private collectRelic(relic: Phaser.Physics.Arcade.Image): void {
    if (!relic.active || this.relicFound) return;
    relic.destroy();
    this.relicFound = true;
    SaveManager.recordRelic(this.levelId);
    this.events.emit('relicFound');
    // Flash screen briefly to signal importance
    this.cameras.main.flash(300, 0, 220, 100);
  }

  private triggerLevelEnd(): void {
    this.levelEnded = true;
    const elapsed = this.levelElapsedMs;

    // Freeze player in place
    (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    (this.player.body as Phaser.Physics.Arcade.Body).setAcceleration(0, 0);

    const crowns = CrownRater.rate(
      elapsed,
      this.levelCoinsCollected,
      this.totalCoins,
      this.levelConfig.crownThresholds,
    );
    SaveManager.recordLevelComplete(this.levelId, crowns, elapsed);

    // Brief pause then transition
    this.time.delayedCall(800, () => {
      this.scene.stop('HUDScene');
      this.scene.start('ResultsScene', {
        levelId: this.levelId,
        crowns,
        timeMs: elapsed,
        coinsCollected: this.levelCoinsCollected,
        relicFound: this.relicFound,
      });
    });
  }

  update(_time: number, delta: number): void {
    if (!this.player || !this.inputMgr || this.levelEnded) return;

    this.levelElapsedMs += delta; // update() doesn't run while paused, so pauses don't count
    this.player.update(delta, this.inputMgr);
    this.breakCrackedTiles();
    this.camera.update();
    for (const e of this.enemies.getChildren()) {
      (e as Enemy).update();
    }

    // Pit death detection
    if (this.player.y > this.mapBottom && this.player.fsm.state !== 'dead') {
      this.player.fallDeath();
    }
  }

  private spawnEnemies(map: Phaser.Tilemaps.Tilemap): void {
    const layer = map.getObjectLayer('Entities');
    if (!layer) return;
    for (const obj of layer.objects) {
      const x = obj.x ?? 0;
      const y = obj.y ?? 0;
      let enemy: Enemy | null = null;
      if (obj.type === 'rat') enemy = new Rat(this, x, y, this.platforms);
      else if (obj.type === 'crow') enemy = new Crow(this, x, y, this.player);
      if (enemy) {
        this.enemies.add(enemy, true);
        enemy.applyBodySettings(); // group add resets gravity / max velocity to group defaults
      }
    }
  }

  /** "LEVEL 1-2" card (plus the level's name) that fades out shortly after the level starts. */
  private showLevelTitle(): void {
    const cx = this.scale.width / 2;
    const parts: Phaser.GameObjects.Text[] = [
      this.add.text(cx, 70, `LEVEL ${this.levelId}`, {
        fontSize: '14px', color: '#ffdd00', fontFamily: 'monospace',
        stroke: '#000000', strokeThickness: 3,
      }),
    ];
    if (this.levelConfig.name) {
      parts.push(this.add.text(cx, 88, this.levelConfig.name.toUpperCase(), {
        fontSize: '8px', color: '#ffffff', fontFamily: 'monospace',
        stroke: '#000000', strokeThickness: 2,
      }));
    }
    for (const t of parts) t.setOrigin(0.5).setScrollFactor(0).setDepth(100);
    this.tweens.add({ targets: parts, alpha: 0, delay: 1400, duration: 500, onComplete: () => parts.forEach(t => t.destroy()) });
  }

  /**
   * A live swing (or pogo) breaks every cracked-brick tile its hitbox touches. Cracked bricks are
   * ordinary tiles, so walls made of them collide exactly like solid walls (no seams for the
   * player to snag on); breaking removes the tile and recalculates the neighbours' faces.
   */
  private breakCrackedTiles(): void {
    const hb = this.player.attackHitbox.body as Phaser.Physics.Arcade.Body;
    if (!hb.enable) return;
    const tiles = this.platforms.getTilesWithinWorldXY(hb.x, hb.y, hb.width, hb.height, { isNotEmpty: true });
    let broke = false;
    for (const tile of tiles) {
      if (tile.index !== TILE_CRACKED) continue;
      this.platforms.removeTileAt(tile.x, tile.y, true, true);
      this.spawnDebris(tile.getCenterX(), tile.getCenterY());
      broke = true;
    }
    if (broke) this.cameras.main.shake(80, 0.004);
  }

  private spawnDebris(x: number, y: number): void {
    for (let i = 0; i < 5; i++) {
      const chunk = this.add.image(x + Phaser.Math.Between(-4, 4), y + Phaser.Math.Between(-4, 4), 'debris').setDepth(10);
      this.tweens.add({
        targets: chunk,
        x: chunk.x + Phaser.Math.Between(-16, 16),
        y: chunk.y + Phaser.Math.Between(-10, 14),
        angle: Phaser.Math.Between(-180, 180),
        alpha: 0,
        duration: 350,
        ease: 'Quad.easeOut',
        onComplete: () => chunk.destroy(),
      });
    }
  }

  private onAttackHit(e: Enemy): void {
    if (!e.active || !this.player.registerHit(e)) return; // one hit per enemy per swing
    if (this.player.fsm.state === 'pogo') {
      // Pogo bounce — same as the body-contact path, in case the hitbox lands first
      (this.player.body as Phaser.Physics.Arcade.Body).setVelocityY(-280);
      this.player.fsm.transition('jump');
    }
    const { x, y } = e;
    this.lastHitAt.set(e, this.time.now);
    e.takeDamage(1);
    this.spawnHitSpark(x, y);
    this.cameras.main.shake(50, 0.003);
  }

  private spawnHitSpark(x: number, y: number): void {
    const spark = this.add.image(x, y, 'hit_spark').setDepth(10);
    this.tweens.add({
      targets: spark, scale: 1.6, alpha: 0, duration: 160,
      onComplete: () => spark.destroy(),
    });
  }

  private onPlayerEnemyContact(
    _player: unknown,
    enemy: unknown,
  ): void {
    const e = enemy as Enemy;
    if (!e.active) return;
    // An enemy the player just hit can't hurt them in the same moment (matters for multi-HP enemies)
    if (this.time.now - (this.lastHitAt.get(e) ?? -Infinity) < HIT_CONTACT_GRACE_MS) return;
    const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    const enemyBody  = e.body as Phaser.Physics.Arcade.Body;
    if (this.player.fsm.state === 'pogo') {
      playerBody.setVelocityY(-280);
      this.player.fsm.transition('jump');
      this.lastHitAt.set(e, this.time.now);
      if (this.player.registerHit(e)) e.takeDamage(1);
    } else if (playerBody.velocity.y > 0 && playerBody.bottom <= enemyBody.top + 6) {
      playerBody.setVelocityY(-180);
      this.player.fsm.transition('jump');
      this.lastHitAt.set(e, this.time.now);
      e.takeDamage(1);
    } else {
      this.player.takeDamage(e.x);
    }
  }

  private onPlayerDead(): void {
    this.player.lives -= 1;
    this.events.emit('livesChanged', this.player.lives);

    if (this.player.lives <= 0) {
      this.time.delayedCall(1000, () => {
        this.scene.stop('HUDScene');
        this.scene.start('GameOverScene', { levelId: this.levelId });
      });
      return;
    }

    // Respawn after pause
    this.time.delayedCall(1000, () => {
      const rx = this.checkpoint.x ?? this.spawnX;
      const ry = this.checkpoint.y ?? this.spawnY;
      this.player.hearts = this.player.maxHearts;
      this.player.alpha = 1;
      const body = this.player.body as Phaser.Physics.Arcade.Body;
      body.enable = true;
      body.reset(rx, ry); // repositions body+sprite and zeros velocity
      this.player.invincibilityTimer = HIT_INVINCIBILITY_MS; // brief safety window after respawn
      this.player.fsm.transition('idle');
      this.events.emit('heartChanged', this.player.hearts, this.player.maxHearts);
    });
  }
}
