import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Spike } from '../entities/hazards/Spike';
import { Enemy } from '../entities/enemies/Enemy';
import { Rat } from '../entities/enemies/Rat';
import { InputManager } from '../systems/InputManager';
import { CameraController } from '../systems/CameraController';
import { CheckpointManager } from '../systems/CheckpointManager';
import { SaveManager } from '../systems/SaveManager';
import { CrownRater } from '../systems/CrownRater';
import { getLevelConfig } from '../data/levels';
import { GRAVITY, TILE_SIZE, HIT_INVINCIBILITY_MS } from '../config';
import { LevelConfig } from '../types/LevelConfig';

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
  private levelStartTime = 0;
  private levelCoinsCollected = 0;
  private totalCoins = 0;

  // Spawn position (read from object layer or fallback)
  private spawnX = TILE_SIZE * 2;
  private spawnY = TILE_SIZE * 10;

  // Level end flag (prevent multiple triggers)
  private levelEnded = false;
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
    // Initialize checkpoint with default spawn (overwritten in parseObjectLayers)
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
    this.physics.add.overlap(
      this.player, this.enemies,
      this.onPlayerEnemyContact, undefined, this,
    );
    this.physics.add.overlap(
      this.player.attackHitbox, this.enemies,
      (_hb, enemy) => { (enemy as Enemy).takeDamage(1); },
      undefined, this,
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

    // HUD as parallel scene
    this.scene.launch('HUDScene');
    this.events.emit('heartChanged', this.player.hearts, this.player.maxHearts);
    this.events.emit('coinChanged', this.levelCoinsCollected);
    this.events.emit('livesChanged', this.player.lives);

    // Player death handler
    this.events.on('playerDead', this.onPlayerDead, this);

    // Enemy kill handler — update coin count + HUD
    this.events.on('enemyKilled', (coinValue: number) => {
      this.levelCoinsCollected += coinValue;
      SaveManager.addCoins(coinValue);
      this.events.emit('coinChanged', this.levelCoinsCollected);
    }, this);

    this.levelStartTime = this.time.now;
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

  private checkpointVisual!: Phaser.GameObjects.Image;

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
      if (def.type === 'checkpoint') {
        const cx = x + w / 2;
        const cy = y + h - TILE_SIZE * 4; // 4 tiles above zone bottom = player standing level
        this.checkpointVisual = this.add.image(cx, cy, 'checkpoint').setDepth(2);
        const zone = this.createPhysicsZone(x + w / 2, y + h / 2, w, h);
        this.physics.add.overlap(this.player, zone, () => {
          if (this.checkpoint.x !== cx) {
            this.checkpoint.activate(cx, cy);
            this.checkpointVisual?.setTexture('checkpoint_active');
          }
        }, undefined, this);
      } else if (def.type === 'end_trigger') {
        this.add.image(x + w / 2, y + h - TILE_SIZE * 3, 'banner').setDepth(2); // 3 tiles above zone bottom = ground surface
        const zone = this.createPhysicsZone(x + w / 2, y + h / 2, w, h);
        this.physics.add.overlap(this.player, zone, () => {
          if (!this.levelEnded && this.player.fsm.state !== 'dead') {
            this.triggerLevelEnd();
          }
        }, undefined, this);
      }
    }
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
    const elapsed = this.time.now - this.levelStartTime;

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

    this.player.update(delta, this.inputMgr);
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
      if (obj.type === 'rat') {
        const rat = new Rat(this, obj.x ?? 0, obj.y ?? 0, this.platforms);
        this.enemies.add(rat, true);
      }
    }
  }

  private onPlayerEnemyContact(
    _player: Phaser.GameObjects.GameObject,
    enemy: Phaser.GameObjects.GameObject,
  ): void {
    const e = enemy as Enemy;
    if (!e.active) return;
    if (this.player.fsm.state === 'pogo') {
      (this.player.body as Phaser.Physics.Arcade.Body).setVelocityY(-280);
      this.player.fsm.transition('jump');
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
