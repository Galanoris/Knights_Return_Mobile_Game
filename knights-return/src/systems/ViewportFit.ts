import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, MAX_GAME_WIDTH } from '../config';

/**
 * Makes the game fill the screen instead of letterboxing a fixed 16:9 canvas.
 *
 * The game height is fixed (GAME_HEIGHT sets the pixel-art scale); the width follows the
 * screen's aspect ratio, clamped to [GAME_WIDTH, MAX_GAME_WIDTH]. Phaser's FIT mode then
 * scales the canvas to exactly fill the viewport, nearest-neighbour (crisp pixels).
 */

export interface Insets { top: number; right: number; bottom: number; left: number }

/** Size of the element Phaser fits the canvas into (the body: 100dvw × 100dvh). */
function viewportSize(): { w: number; h: number } {
  const r = document.body?.getBoundingClientRect();
  const w = r && r.width > 0 ? r.width : window.innerWidth;
  const h = r && r.height > 0 ? r.height : window.innerHeight;
  return { w, h };
}

/** Logical game width for the current viewport (clamped). */
export function computeGameWidth(): number {
  const { w, h } = viewportSize();
  if (!w || !h) return GAME_WIDTH;
  const width = Math.round((GAME_HEIGHT * w) / h);
  return Phaser.Math.Clamp(width, GAME_WIDTH, MAX_GAME_WIDTH);
}

/** Hidden probe whose padding is the CSS safe-area insets (see --sa-* in index.html). */
let probe: HTMLDivElement | null = null;
function safeAreaProbe(): HTMLDivElement {
  if (!probe) {
    probe = document.createElement('div');
    probe.style.cssText =
      'position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;' +
      'padding:var(--sa-top) var(--sa-right) var(--sa-bottom) var(--sa-left);';
    document.body.appendChild(probe);
  }
  return probe;
}

/** Safe-area insets (notch, rounded corners, home indicator) converted to GAME pixels. */
export function getSafeInsets(scale: Phaser.Scale.ScaleManager): Insets {
  const cs = getComputedStyle(safeAreaProbe());
  const px = (v: string) => parseFloat(v) || 0;
  const k = scale.displayScale; // game px per CSS px
  return {
    top: Math.round(px(cs.paddingTop) * k.y),
    right: Math.round(px(cs.paddingRight) * k.x),
    bottom: Math.round(px(cs.paddingBottom) * k.y),
    left: Math.round(px(cs.paddingLeft) * k.x),
  };
}

const portraitQuery = () => window.matchMedia('(orientation: portrait) and (pointer: coarse)');

/**
 * Keep the game sized to the viewport. iOS reports stale sizes right after a rotation,
 * so every change is re-checked a little later. Also freezes the game while a phone is in
 * portrait (the "Please rotate" overlay covers it) so nothing happens off-screen.
 */
export function installViewportFit(game: Phaser.Game): void {
  let timers: number[] = [];
  const apply = () => {
    const width = computeGameWidth();
    if (width !== game.scale.gameSize.width) {
      game.scale.setGameSize(width, GAME_HEIGHT);
    } else {
      game.scale.refresh(); // same width, but insets / parent size may have changed
    }
  };
  const schedule = () => {
    timers.forEach(t => window.clearTimeout(t));
    apply();
    timers = [150, 500].map(ms => window.setTimeout(apply, ms));
  };
  window.addEventListener('resize', schedule);
  window.addEventListener('orientationchange', schedule);
  window.visualViewport?.addEventListener('resize', schedule);

  const portrait = portraitQuery();
  const syncPause = () => { if (portrait.matches) game.pause(); else game.resume(); };
  portrait.addEventListener('change', syncPause);
  syncPause();
}

/**
 * For menu-style scenes laid out from scale.width/height in create(): rebuild the scene
 * after the game size changes (debounced). Never use this for GameScene.
 */
export function relayoutOnResize(scene: Phaser.Scene): void {
  let pending: Phaser.Time.TimerEvent | null = null;
  const builtW = scene.scale.width, builtH = scene.scale.height;
  const onResize = () => {
    // Centred menus only care about the game size; inset-only refreshes don't need a rebuild
    if (scene.scale.width === builtW && scene.scale.height === builtH) return;
    pending?.remove();
    pending = scene.time.delayedCall(120, () => scene.scene.restart());
  };
  scene.scale.on(Phaser.Scale.Events.RESIZE, onResize);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.scale.off(Phaser.Scale.Events.RESIZE, onResize));
}
