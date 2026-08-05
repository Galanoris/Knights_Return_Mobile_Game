import { SaveData, DEFAULT_SAVE } from '../types/GameState';

const SAVE_KEY = 'knights_return_v1';

export class SaveManager {
  private static data: SaveData = SaveManager.load();

  static load(): SaveData {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return { ...DEFAULT_SAVE };
      const parsed = JSON.parse(raw) as Partial<SaveData>;
      return SaveManager.migrate(parsed);
    } catch {
      return { ...DEFAULT_SAVE };
    }
  }

  private static migrate(raw: Partial<SaveData>): SaveData {
    const base: SaveData = { ...DEFAULT_SAVE, ...raw };
    // Future migrations: check base.version and transform
    base.version = DEFAULT_SAVE.version;
    return base;
  }

  static save(patch: Partial<SaveData>): void {
    SaveManager.data = { ...SaveManager.data, ...patch };
    localStorage.setItem(SAVE_KEY, JSON.stringify(SaveManager.data));
  }

  static get(): SaveData {
    return SaveManager.data;
  }

  static addCoins(amount: number): void {
    SaveManager.save({ coins: SaveManager.data.coins + amount });
  }

  static recordLevelComplete(levelId: string, crowns: number, timeMs: number): void {
    const existing = SaveManager.data.crowns[levelId] ?? 0;
    const existingTime = SaveManager.data.bestTimes[levelId] ?? Infinity;
    SaveManager.save({
      crowns: { ...SaveManager.data.crowns, [levelId]: Math.max(existing, crowns) },
      bestTimes: { ...SaveManager.data.bestTimes, [levelId]: Math.min(existingTime, timeMs) },
    });
  }

  static recordRelic(levelId: string): void {
    SaveManager.save({ relics: { ...SaveManager.data.relics, [levelId]: true } });
  }

  static reset(): void {
    localStorage.removeItem(SAVE_KEY);
    SaveManager.data = { ...DEFAULT_SAVE };
  }
}
