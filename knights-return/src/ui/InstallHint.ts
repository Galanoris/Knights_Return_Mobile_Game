/**
 * iPhone/iPad browsers can't go fullscreen (no Fullscreen API for non-video elements).
 * The only way to hide the browser UI is to add the game to the Home Screen, which then
 * launches it as a fullscreen web app. Show a small one-time hint about that on iOS.
 */
const SEEN_KEY = 'knights_return_install_hint_v1';
const AUTO_HIDE_MS = 8000;

function isIOS(): boolean {
  const ua = navigator.userAgent;
  // iPadOS 13+ reports a Mac user agent — tell it apart by touch support
  return /iPhone|iPod|iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

function isInstalled(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true
    || window.matchMedia('(display-mode: standalone)').matches
    || window.matchMedia('(display-mode: fullscreen)').matches;
}

function seen(): boolean {
  try { return localStorage.getItem(SEEN_KEY) !== null; } catch { return false; }
}

function markSeen(): void {
  try { localStorage.setItem(SEEN_KEY, '1'); } catch { /* private mode: may show again, harmless */ }
}

function show(): void {
  const hint = document.createElement('div');
  hint.id = 'install-hint';
  hint.setAttribute('role', 'status');
  hint.innerHTML =
    '<span><b>Add to Home Screen for fullscreen</b><br>Tap Share <span aria-hidden="true">⬆︎</span>, then “Add to Home Screen”</span>' +
    '<button type="button" aria-label="Dismiss">✕</button>';
  const close = () => {
    hint.classList.add('hide');
    window.setTimeout(() => hint.remove(), 400);
  };
  hint.querySelector('button')!.addEventListener('click', close);
  document.body.appendChild(hint);
  markSeen();
  window.setTimeout(close, AUTO_HIDE_MS);
}

/** Call once at startup. Waits for landscape (the rotate overlay covers portrait). */
export function maybeShowInstallHint(): void {
  if (!isIOS() || isInstalled() || seen()) return;
  const portrait = window.matchMedia('(orientation: portrait)');
  if (!portrait.matches) { show(); return; }
  const onChange = () => {
    if (portrait.matches) return;
    portrait.removeEventListener('change', onChange);
    show();
  };
  portrait.addEventListener('change', onChange);
}
