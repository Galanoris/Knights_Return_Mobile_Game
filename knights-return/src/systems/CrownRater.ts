/**
 * Rates a level run 1–3 crowns.
 * thresholds = [ms for 3 crowns, ms for 2 crowns, ms for 1 crown]
 * Lower time = better.
 */
export class CrownRater {
  static rate(
    timeMs: number,
    coinsCollected: number,
    totalCoins: number,
    thresholds: [number, number, number],
  ): number {
    let crowns: number;
    if (timeMs <= thresholds[0]) {
      crowns = 3;
    } else if (timeMs <= thresholds[1]) {
      crowns = 2;
    } else {
      crowns = 1;
    }

    // Coin bonus: collecting 75%+ of coins bumps by 1 (capped at 3)
    if (totalCoins > 0 && coinsCollected / totalCoins >= 0.75) {
      crowns = Math.min(3, crowns + 1);
    }

    return crowns;
  }
}
