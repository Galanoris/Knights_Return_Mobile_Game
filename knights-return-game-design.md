# Knight's Return — Game Design Document

A 16-bit retro run-and-jump platformer in a medieval setting. The player runs left to right, overcoming terrain hazards and enemies to reach the end of each level and ultimately reclaim their castle.

**Target feel:** SNES-era side-scroller. Tight controls, readable pixel art, punchy feedback. Each level lasts **no longer than 3 minutes**.

---

## 1. Story

You are **Aldric**, a young squire returning from delivering a message when the warlord **Vargan** seizes your king's castle. The entire game is your journey home across the kingdom. Every level's goal — "reach the end" — is literally another leg of the journey; the final level is your own occupied castle.

Short 16-bit story panels (2–3 static frames with text) play between regions. They should be skippable and never longer than 15 seconds.

---

## 2. Structure

**5 regions × 4 levels = 20 levels** (~60–75 min of content). Each region has one signature mechanic and a distinct visual palette.

| # | Region | Theme | Signature mechanic | Enemies | Hazards |
|---|--------|-------|-------------------|---------|---------|
| 1 | The Borderlands | Meadows, farms (tutorial) | None — teach basics | Rats, crows | Fences, small gaps |
| 2 | The Darkwood | Dark forest | Fog limits forward visibility | Wolves, bandits | Falling branches, spiked logs |
| 3 | The Crags | Mountains | Wind gusts alter jump arcs | Goat-riding raiders, vultures | Big cliff gaps, falling boulders |
| 4 | The Marshes | Swamp | Sinking platforms (timing) | Stilt archers, bog creatures | Poison bogs, geysers |
| 5 | The Occupied Castle | Castle interior | Traps (crushers, blades) | Armored knights, elite guards | Drawbridges, spike pits, no checkpoints |

### Level pacing (per 3-minute level)
- **0:00–0:45 — Introduction:** one new element shown in a safe, low-stakes context
- **0:45–2:15 — Combination:** new element mixed with known elements
- **2:15–3:00 — Gauntlet:** dense final stretch testing everything
- **Level end:** player plants a banner (win animation) → results screen
- **One mid-level checkpoint** (stone waymarker) per level; **none in Region 5**

### Special levels
- At least two **chase levels** (e.g., rolling boulder in Region 3, cavalry charge in Region 5): the screen auto-scrolls / a threat pursues, forcing constant forward motion.
- Optional **bonus levels** unlocked by crown ratings (see §7).

---

## 3. Core gameplay loop

**Run → read the upcoming threat → choose: jump or attack → collect → repeat.**

Jumping and attacking are alternative answers to the same problem:
- **Jump over an enemy** = safe, no reward
- **Attack an enemy** = risky (must get close / time it), drops coins

Later enemies break the symmetry to keep the choice interesting:
- **Shielded knights:** immune from the front → jump over, or hit from above (pogo strike)
- **Archers:** arrows fly at jump height → jumping is punished; close in and attack instead

### Controls (keyboard)
- **Left/Right arrows or A/D** — run
- **Space / W / Up** — jump (hold = higher jump, variable jump height)
- **J / X** — attack (fists → sword → bow; see §4)
- **K / C** — fire bow (once unlocked; sword stays on attack button)
- **Down + attack while airborne** — downward pogo strike (sword only)

### Feel requirements (non-negotiable for fairness)
- **Coyote time:** player can still jump ~100 ms after running off a ledge
- **Input buffering:** a jump pressed ~100 ms before landing executes on landing
- **Hit invincibility:** ~1.5 s of flicker + slight knockback after taking damage
- Fixed timestep physics; jump arc must be identical every time (wind in Region 3 is the only modifier)

---

## 4. Weapons (permanent story upgrades)

| Weapon | Acquired | Properties |
|--------|----------|-----------|
| **Fists** | Start | Very short range, fast; must get close |
| **Sword** | End of Region 2 (taken from a bandit captain) | Better range and arc; enables mid-air **downward pogo strike** that bounces the player off enemies |
| **Bow** | End of Region 4 | Ranged, fires straight; **limited arrows** (refilled by pickups) so the sword stays relevant |

---

## 5. Powerups (temporary, found in breakable crates/barrels)

| Powerup | Effect | Duration |
|---------|--------|----------|
| Wooden shield | Absorbs one hit | Until hit |
| Potion | Restores 1 heart | Instant |
| Winged boots | Double jump | ~10 s |
| War horn | Stuns all on-screen enemies | ~3 s stun |
| Golden gauntlet (rare) | Full invincibility, destroy everything on contact | ~8 s |
| Arrow bundle | +5 arrows | Instant |
| Coins | Currency for the blacksmith | — |

---

## 6. Blacksmith shop (between levels)

Coins buy permanent incremental upgrades:
- Sword attack speed (3 tiers)
- +1 max heart (cap: 5 hearts)
- Arrow capacity (3 tiers)
- Optional: cosmetic skins (see relics, §8)

This gives coins purpose beyond score and lets cautious players buy their way past difficulty spikes.

---

## 7. Health, lives, win & lose

**Hearts vs. lives — distinct systems:**
- **Hearts** (start with 3, upgradable to 5): getting hit costs 1 heart → invincibility flicker + knockback
- Falling into a pit / drowning costs a **full life** regardless of hearts → respawn at checkpoint
- 0 hearts → lose a life → respawn at checkpoint with full hearts
- Player has **3 lives per level**; 0 lives → restart the **level** (never back to level 1)
- Optional: "continues" cost accumulated coins for extra stakes

**Win a level:** reach the end, plant the banner. Results screen rates the run **1–3 crowns** based on time, coins collected, and enemies defeated. Crowns unlock optional bonus levels — replayability without blocking progress.

**Win the game:** defeat Vargan in a **3-phase boss fight**:
1. Phase 1 — pure jump timing (shockwaves, thrown objects)
2. Phase 2 — sword combat (parry windows, pogo strikes on his shield)
3. Phase 3 — bow aim (weak point exposed at range)

A final exam of everything the game taught.

---

## 8. Secrets & replay value

- **One hidden nook per level:** breakable wall, high ledge (winged boots), etc., holding a coin cache or a **kingdom relic**
- Collecting all 20 relics unlocks a **true ending** and a golden armor skin
- **Per-level best time** displayed on level select (speedrun hook)
- Score tally per level

---

## 9. Difficulty scaling (layered, not just "faster")

1. **Density:** gaps between threats shrink → tighter reaction windows
2. **Combination:** known elements stacked (enemy on a moving platform, archer behind a pit)
3. **Timing hazards:** crushers, swinging blades, geysers demanding rhythm
4. **Environmental pressure:** fog (R2), wind (R3), sinking ground (R4)
5. **Smarter enemies:** late-game bandits block; knights charge when player is airborne
6. **Fewer safety nets:** checkpoints and heart crates become scarce; none in Region 5

One signature mechanic per region keeps regions feeling *distinct*, not merely harder.

---

## 10. Presentation ("juice")

- 16-bit pixel art, ~16×16 or 32×32 sprites, limited palette per region
- Screen shake on sword hits and boulder impacts
- Distinct SFX per powerup; heart-loss sting; chiptune track per region
- Parallax background (2–3 layers) for depth
- Banner-planting animation + fanfare on level completion

---

## 11. Suggested technical approach (for implementation)

- **Engine suggestion:** HTML5 Canvas + vanilla JS or Phaser 3 (web-playable), or Godot 4 if a desktop build is preferred
- Fixed timestep game loop (60 FPS logic), delta-interpolated rendering
- **Tile-based levels** (e.g., 16 px tiles) defined in JSON or Tiled (.tmx) for fast iteration
- Entity system: player, enemies, projectiles, pickups, hazards as components/classes
- Camera: horizontal follow with small look-ahead in run direction; locked vertical bands per section
- Save data: per-level crowns, best times, relics, coins, shop upgrades (localStorage / file)

### Suggested build order (milestones)
1. **Core feel prototype:** run, variable jump, coyote time, input buffer, one flat test level
2. Hazards + hearts/lives + checkpoint/respawn
3. First enemy (rat) + fist attack + coin drops
4. Level 1-1 complete with banner, results screen, 3-minute pacing
5. Sword + pogo strike; Region 2 enemies
6. Shop, powerups, crates
7. Remaining regions, chase levels, bow
8. Boss fight, relics, true ending, polish pass (juice, audio)

---

## 12. Open design decisions (to settle during development)

- Exact coin economy (drop rates vs. shop prices) — tune after playtesting
- Whether arrows can be fired diagonally/upward
- Difficulty modes (e.g., "Squire" with infinite lives vs. "Knight" as designed)
- Gamepad support mapping
