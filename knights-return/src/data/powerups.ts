export type PowerupType =
  | 'shield'
  | 'potion'
  | 'winged_boots'
  | 'war_horn'
  | 'golden_gauntlet'
  | 'arrow_bundle'
  | 'coin';

export interface PowerupConfig {
  type: PowerupType;
  durationMs: number | null; // null = instant
  value?: number;             // coins, hearts, arrows
}

export const POWERUP_CONFIGS: Record<PowerupType, PowerupConfig> = {
  shield:          { type: 'shield',          durationMs: null },
  potion:          { type: 'potion',          durationMs: null, value: 1 },
  winged_boots:    { type: 'winged_boots',    durationMs: 10000 },
  war_horn:        { type: 'war_horn',        durationMs: 3000 },
  golden_gauntlet: { type: 'golden_gauntlet', durationMs: 8000 },
  arrow_bundle:    { type: 'arrow_bundle',    durationMs: null, value: 5 },
  coin:            { type: 'coin',            durationMs: null, value: 1 },
};
