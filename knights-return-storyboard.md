# Knight's Return — Storyboard

Companion to [knights-return-game-design.md](knights-return-game-design.md). It covers the story arc, the panel boards for story frames, and level storyboards for Region 1.

**Panel rules (from GDD §1):** 2–3 static frames per story beat, ≤ ~20 words of text per frame, the whole beat ≤ 15 s, always skippable. "Road cards" are optional single frames (≤ 5 s) between levels in the same region.

---

## 1. Story arc at a glance

| Beat | When | What happens | Player gains |
|------|------|--------------|--------------|
| Prologue | Before 1-1 | Aldric is away delivering the king's letter. Vargan takes Castle Highmoor. | The goal: get home |
| Borderlands | 1-1 → 1-4 | Farm roads and fences. Vargan's crows are watching the roads. | Learns the basics |
| Darkwood | 2-1 → 2-4 | The forest road. Bandits now serve Vargan. | **Sword** (taken from the bandit captain, end of 2-4) |
| Crags | 3-1 → 3-4 | The mountain pass. Raiders on goats, and a boulder chase in 3-3. | Pogo strike becomes essential |
| Marshes | 4-1 → 4-4 | The drowned lowlands. Stilt archers guard the causeways. | **Bow** (end of 4-4) |
| Occupied Castle | 5-1 → 5-4 | Aldric's own home. Traps, knights, a cavalry chase (5-3), then Vargan. | — |
| Ending | After 5-4 | Vargan falls and Aldric plants the king's banner on the keep. | Credits |
| True ending | All 20 relics | The relics are pieces of the scattered royal regalia. Together they restore the crown, and the old king returns. | Golden armor skin |

**Recurring thread:** the **crows**. In Region 1 they are Vargan's eyes on the roads. Each region's closing panel can show one crow flying back toward the castle. In the final panel there is a crow on Vargan's throne, and it flies off when the banner goes up.

---

## 2. Panel boards

### Prologue — "The Letter" (before 1-1, ~12 s)

| # | Frame | Text | Time |
|---|-------|------|------|
| P1 | Wide shot: Castle Highmoor at dusk, warm windows. Aldric, small on the road, rides away with a sealed letter. | *"Aldric, squire of Highmoor, carries the king's letter east."* | 4 s |
| P2 | A border inn at night. Aldric looks west. On the horizon, smoke rises over the castle silhouette and red banners hang from its towers. | *"Then the smoke. Then the red banners. Vargan has taken Highmoor."* | 4 s |
| P3 | Close-up: Aldric's empty hands and fists, his horse gone. A crow watches from a fence post. | *"No horse. No sword. Only the long road home."* | 4 s |

→ Fade to "LEVEL 1-1".

### Region 1 road cards (optional, ≤ 5 s each)

| After | Frame | Text |
|-------|-------|------|
| 1-1 | Aldric at a crossroads signpost reading "Highmoor ← 5 days". | *"The farm road west. Quiet. Too quiet."* |
| 1-2 | Crows circling over a ruined barn, with one flying off toward the castle. | *"The crows follow. Someone wants to know where I am."* |
| 1-3 | A watchtower on the ridge, burning at night. | *"Vargan's men hold the old tower. The border ends there."* |

### Region 1 → Region 2 — "The Edge of the Wood" (after 1-4, ~12 s)

| # | Frame | Text | Time |
|---|-------|------|------|
| R1 | The burned watchtower behind Aldric; ahead, a wall of dark trees. | *"Beyond the Borderlands lies the Darkwood."* | 4 s |
| R2 | Fog between the trunks, and bandit campfires glowing through it. | *"The bandits who once fled from the king's men now hunt for Vargan."* | 4 s |
| R3 | A crow lands on a branch above Aldric and caws. | *"The forest road is the only way home."* | 4 s |

### Later regions (one line each — to be boarded when those levels are built)

- **R2 → R3:** Aldric pulls the sword from the defeated bandit captain → the mountain pass rises ahead → a goat raider's silhouette on a cliff.
- **R3 → R4:** a rope bridge snaps behind him → the marsh below glows green → a stilt archer's lantern in the reeds.
- **R4 → R5:** Aldric takes the bow from a fallen archer → Highmoor on the horizon, red banners → the drawbridge lowers and cavalry ride out.
- **Ending:** Vargan kneels → Aldric plants the banner on the keep → the crow on the throne flies away.
- **True ending:** the 20 relics glow and form the crown → the king steps out of the dungeon → Aldric is knighted (golden armor).

---

## 3. Level storyboards — Region 1 (The Borderlands)

Shared constraints, from `config.ts` and `Player.ts`:
- **One jump** ≈ 3 tiles high and ≈ 5 tiles across at full speed. **Double jump** is always available after the first jump.
- Pits on the main route are **≤ 4 tiles** wide (fair with one jump). Wider gaps always have stepping platforms. Spots that need the double jump are reserved for **secrets**.
- Full speed = 8.75 tiles/s. A 320-tile level is ~37 s of pure running, and ~70–100 s with fighting and coins. That is well inside the 3-minute cap.
- Ground sits at rows 11–13 on a 14-row map. The checkpoint and the banner need flat ground at row 11.

**Map legend** for the excerpts below (and the `levels-src/*.txt` files): `#` solid · `S` spawn · `r` rat · `c` crow · `^` spike · `o` coin · `R` relic · `C` checkpoint · `E` banner/end.

### 1-1 "Leaving the Border Inn" (built)
- **Teaches:** run, jump, pits, spikes, rats, the punch.
- **Layout:** 280 tiles. Regular pits 2–4 wide, floating 4-tile platforms at rows 7 and 9, 13 rats, 13 spikes.
- **Secret:** relic on the row-6 platform near the start (col 21).
- **Note:** 1-1 has **two** checkpoints (cols 110 and 212). The GDD says one per level. Either is fine for a tutorial level, but 1-2 onward use one.

### 1-2 "The Old Farm Road" (built — `knights-return/levels-src/1-2.txt`)
- **Story:** the open farm road. Vargan's crows find Aldric.
- **Teaches:** **crows.** They hover, patrol ±3 tiles, and **dive at where the player was** when the player passes underneath (aimed once, so stepping forward dodges the dive). A red tint warns that a dive is coming. A crow dies to a stomp, a punch or the pogo.
- **Size:** 320 tiles · 13 crows + 10 rats · 8 spikes · ~60 coins · checkpoint col 152 · banner col 314.

| Phase | Cols | Beats |
|-------|------|-------|
| Intro (0:00–0:45) | 0–75 | Small pits every ~20 tiles from the start (cols 18, 41, 62, 72), each with a coin arc that shows the jump. **Crow #1** flies over the stretch between the first two pits, with a coin arc that tempts the player to jump into its dive. **Crow #2** sits beside a low step (col 46) so the player can try stomping it. |
| Combination | 75–210 | Rat on the ground with a crow above it (cols 84–88). A crow guards a pit (col 105). **Secret** at cols 114–121. Rats and spikes alternate. **Checkpoint** at col 152, then a step platform with a crow above it. |
| Gauntlet (2:15–) | 210–314 | Rat/crow pairs every ~10 tiles, crows hanging over pits 5–8, spikes right after landing spots. Coin run, last rat, banner. |

First crows and early pits (cols 14–58): a 2-wide pit, then crow #1 above a coin arc, then a 3-wide pit just before the low step for crow #2.
```
......................................c......
................c............................
.............................................
....oo........ooooo........ooo...............
................................####.........
............................................o
####..#####################...###############
```
**Secret (cols 110–130):** a ledge at row 5 that can only be reached by double-jumping from the row-9 step. The relic and 2 coins sit on top, and spikes below punish a missed landing.
```
.........Roo.........
........####.........
.....................
.....................
....oooo.............
....####.............
..........^^......r..
#####################
```
Gauntlet sample (cols 228–262): a crow over the pit, then rat + spikes, then a crow over the next pit.
```
.........................c.........
.....c.............................
...................................
....oooo...........................
...................................
..............r...^^..............r
####....################....#######
```

### 1-3 "Fenceline Ridge" (built — `knights-return/levels-src/1-3.txt`)
- **Story:** climbing out of the farmland toward the ridge and the watchtower.
- **Teaches:** **fences** (1–2 tile solid blocks you hop over) and **vertical tiers**: pits too wide for one jump, crossed on stepping platforms.
- **Size:** 360 tiles · 8 rats + 9 crows · 7 spikes · ~50 coins · checkpoint col 172 · banner col 352.

| Phase | Cols | Beats |
|-------|------|-------|
| Intro | 0–80 | Fences of 1, then 2, then 2×2 tiles, each with a coin on top as a hint. **First tier crossing:** a 13-tile pit with a row-9 step and a row-7 step. |
| Combination | 80–230 | **Rat pen:** a rat trapped between two fences, with coins inside (enter to fight, or skip over). Low fences around a spike strip. **Staircase** of rows 9 → 7 → 5 with a crow above it. **Secret** above the staircase. Second pen. **Checkpoint** at col 172. Fence-top to fence-top jump over spikes. **Second tier crossing** with a crow diving onto the steps. |
| Gauntlet | 230–352 | Fences, pens, spikes, crows over pits and a pit with a middle step, all at high density. A run of rising fences (1, 2, 2), then the coin run to the banner. |

First tier crossing (cols 56–76):
```
............ooo......
............###......
.......ooo...........
.......###...........
.....................
####.............####
```
Rat pen and spike strip (cols 82–116):
```
...........................oooo....
..#.........#......................
..#..ooooo..#.............#.^^.#...
###################################
```
**Secret (cols 120–140):** while climbing the staircase, the player can double-jump *back and up* from the top tier to a ledge at row 1. The relic and 2 coins are visible from the climb, so the secret teaches looking up.
```
....Roo..............
....###..............
.....................
..................c..
............oooo.....
............####.....
.....................
.......###...........
.....................
..###................
.....................
####################.
```
Second tier crossing (cols 202–216): the crow above dives onto the steps.
```
........c......
...............
.........oo....
.........##....
...............
.....##........
...............
##...........##
```

### 1-4 "The Burning Watchtower" (not built — outline)
- **Story:** the region finale. Vargan's scouts hold the old border tower.
- **Teaches:** nothing new. This is the **Region 1 exam**: fences, tiers, rats and crows at full density, with fewer coins.
- **Shape:** the first half runs along the ridge. The second half climbs the tower exterior (tall tier stacks, crows from above). The banner is planted on the tower roof (needs a variant of the end trigger for raised ground).
- **Secret:** a breakable-wall nook inside the tower base. This needs breakable tiles, so it waits for M6 (crates).

### Crown thresholds (starting values — tune after playtesting)
| Level | 3 crowns | 2 crowns | 1 crown |
|-------|----------|----------|---------|
| 1-1 | ≤ 90 s | ≤ 120 s | finish |
| 1-2 | ≤ 90 s | ≤ 120 s | finish |
| 1-3 | ≤ 90 s | ≤ 120 s | finish |

Collecting 75%+ of coins adds +1 crown (`CrownRater`).

---

## 4. Editing levels

1. Edit `knights-return/levels-src/<id>.txt`. One line per tile row, all lines the same width. Lines starting with `;` are comments.
2. Run `npm run levels` from `knights-return/`. It rewrites `public/assets/tilemaps/levels/<id>.json`.
3. A new level also needs its id added to `PLAYABLE_LEVEL_IDS` in `src/data/levels.ts`.
