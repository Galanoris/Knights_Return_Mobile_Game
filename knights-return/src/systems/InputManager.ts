import Phaser from 'phaser';
import { JUMP_BUFFER_MS } from '../config';
import { touchInput } from '../ui/TouchControls';

export class InputManager {
  private keys: {
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
    jump: Phaser.Input.Keyboard.Key;
    jumpAlt: Phaser.Input.Keyboard.Key;
    jumpAlt2: Phaser.Input.Keyboard.Key;
    attack: Phaser.Input.Keyboard.Key;
    attackAlt: Phaser.Input.Keyboard.Key;
    bow: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    leftAlt: Phaser.Input.Keyboard.Key;
    rightAlt: Phaser.Input.Keyboard.Key;
  };

  private jumpBufferTimer = 0;
  private jumpWasDown = false;
  private _jumpJustPressed = false;
  private _jumpJustReleased = false;
  private _attackJustPressed = false;
  private touchAttackWasDown = false;

  constructor(scene: Phaser.Scene) {
    const kb = scene.input.keyboard!;
    this.keys = {
      left:     kb.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right:    kb.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      jump:     kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      jumpAlt:  kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      jumpAlt2: kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      attack:    kb.addKey(Phaser.Input.Keyboard.KeyCodes.J),
      attackAlt: kb.addKey(Phaser.Input.Keyboard.KeyCodes.Z),
      bow:       kb.addKey(Phaser.Input.Keyboard.KeyCodes.K),
      down:     kb.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      leftAlt:  kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      rightAlt: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
  }

  update(delta: number): void {
    const jumpDown = this.isJumpDown;
    // Compute "just" states BEFORE updating jumpWasDown, so getters see the correct value
    this._jumpJustPressed  = jumpDown  && !this.jumpWasDown;
    this._jumpJustReleased = !jumpDown && this.jumpWasDown;
    if (this._jumpJustPressed) this.jumpBufferTimer = JUMP_BUFFER_MS;
    if (this.jumpBufferTimer > 0) this.jumpBufferTimer -= delta;
    this.jumpWasDown = jumpDown;

    // JustDown consumes the key's pressed flag, so evaluate it exactly once per frame
    const keyAttack = Phaser.Input.Keyboard.JustDown(this.keys.attack) || Phaser.Input.Keyboard.JustDown(this.keys.attackAlt);
    this._attackJustPressed = keyAttack || (touchInput.attack && !this.touchAttackWasDown);
    this.touchAttackWasDown = touchInput.attack;
  }

  get left(): boolean  { return this.keys.left.isDown || this.keys.leftAlt.isDown || touchInput.left; }
  get right(): boolean { return this.keys.right.isDown || this.keys.rightAlt.isDown || touchInput.right; }
  get down(): boolean  { return this.keys.down.isDown || touchInput.down; }

  private get isJumpDown(): boolean {
    return this.keys.jump.isDown || this.keys.jumpAlt.isDown || this.keys.jumpAlt2.isDown || touchInput.jump;
  }

  get jumpJustPressed():  boolean { return this._jumpJustPressed; }
  get jumpJustReleased(): boolean { return this._jumpJustReleased; }
  get attackJustPressed(): boolean { return this._attackJustPressed; }

  get bowJustPressed(): boolean {
    return Phaser.Input.Keyboard.JustDown(this.keys.bow);
  }

  /** True for the frame the player had a buffered jump ready AND just landed */
  consumeJumpBuffer(): boolean {
    if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer = 0;
      return true;
    }
    return false;
  }
}
