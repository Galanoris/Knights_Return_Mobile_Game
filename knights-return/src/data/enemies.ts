export interface EnemyStats {
  health: number;
  speed: number;
  coinValue: number;
  damage: number;         // hearts lost on contact
  frontImmune: boolean;   // shielded knight
}

export const ENEMY_STATS: Record<string, EnemyStats> = {
  rat:            { health: 1, speed: 50,  coinValue: 1, damage: 1, frontImmune: false },
  crow:           { health: 1, speed: 60,  coinValue: 1, damage: 1, frontImmune: false },
  wolf:           { health: 2, speed: 80,  coinValue: 2, damage: 1, frontImmune: false },
  bandit:         { health: 2, speed: 70,  coinValue: 2, damage: 1, frontImmune: false },
  bandit_captain: { health: 4, speed: 70,  coinValue: 5, damage: 1, frontImmune: false },
  goat_raider:    { health: 3, speed: 100, coinValue: 3, damage: 1, frontImmune: false },
  vulture:        { health: 1, speed: 90,  coinValue: 2, damage: 1, frontImmune: false },
  stilt_archer:   { health: 2, speed: 50,  coinValue: 2, damage: 1, frontImmune: false },
  bog_creature:   { health: 3, speed: 40,  coinValue: 2, damage: 1, frontImmune: false },
  armored_knight: { health: 4, speed: 60,  coinValue: 4, damage: 1, frontImmune: true  },
  elite_guard:    { health: 5, speed: 70,  coinValue: 5, damage: 1, frontImmune: false },
};
