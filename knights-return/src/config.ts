// Global constants — tune here, never hardcode elsewhere

export const TILE_SIZE = 16;

// Physics
export const GRAVITY = 900;           // px/s²
export const PLAYER_SPEED = 140;      // max horizontal px/s
export const PLAYER_ACCEL = 900;      // px/s² acceleration on ground
export const PLAYER_DECEL = 1800;     // px/s² deceleration (no input)
export const JUMP_VELOCITY = -300;    // initial jump Y velocity (negative = up)
export const JUMP_CUT_MULTIPLIER = 0.4; // velocity kept when jump released early
export const COYOTE_TIME_MS = 100;
export const JUMP_BUFFER_MS = 100;
export const HIT_INVINCIBILITY_MS = 1500;
export const KNOCKBACK_VELOCITY = 200; // px/s horizontal knockback

// Camera
export const CAM_LOOK_AHEAD = 60;    // px ahead of player

// Game
export const GAME_WIDTH = 400;
export const GAME_HEIGHT = 225;      // 16:9, scaled up 4× → 1600×900 on most screens
export const TARGET_FPS = 60;

// Regions
export const REGION_COUNT = 5;
export const LEVELS_PER_REGION = 4;
