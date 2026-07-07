// Shared world constants.
export const CHUNK_SIZE = 16;
export const CHUNK_HEIGHT = 256;
export const RENDER_DISTANCE = 6;       // chunk radius
export const GRAVITY = 20;               // m/s^2
export const JUMP_VELOCITY = 8.4;        // m/s
export const WALK_SPEED = 4.317;         // m/s
export const SPRINT_SPEED = 5.612;
export const FLY_SPEED = 11.0;
export const SNEAK_SPEED = 1.3;
export const PLAYER_HEIGHT = 1.8;
export const PLAYER_WIDTH = 0.6;
export const PLAYER_EYE = 1.62;
export const REACH_DISTANCE = 5.0;

export const Block = {
  AIR: 0, GRASS: 1, DIRT: 2, STONE: 3, COBBLESTONE: 4, PLANKS: 5, LOG: 6,
  LEAVES: 7, SAND: 8, WATER: 9, BEDROCK: 10, COAL_ORE: 11, IRON_ORE: 12,
  DEEPSLATE: 13, SNOW: 14, FLOWER_RED: 15, FLOWER_YELLOW: 16, GLASS: 17,
};

export const BlockNames = {
  0: 'Air', 1: 'Grass', 2: 'Dirt', 3: 'Stone', 4: 'Cobblestone',
  5: 'Planks', 6: 'Log', 7: 'Leaves', 8: 'Sand', 9: 'Water',
  10: 'Bedrock', 11: 'Coal Ore', 12: 'Iron Ore', 13: 'Deepslate',
  14: 'Snow', 15: 'Poppy', 16: 'Dandelion', 17: 'Glass',
};

// Hotbar default for creative.
export const CREATIVE_HOTBAR = [
  Block.GRASS, Block.DIRT, Block.STONE, Block.COBBLESTONE,
  Block.PLANKS, Block.LOG, Block.LEAVES, Block.SAND, Block.GLASS,
];
