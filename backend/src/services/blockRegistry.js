// Canonical block definitions shared (conceptually) with the frontend.
export const Block = {
  AIR: 0,
  GRASS: 1,
  DIRT: 2,
  STONE: 3,
  COBBLESTONE: 4,
  PLANKS: 5,
  LOG: 6,
  LEAVES: 7,
  SAND: 8,
  WATER: 9,
  BEDROCK: 10,
  COAL_ORE: 11,
  IRON_ORE: 12,
  DEEPSLATE: 13,
  SNOW: 14,
  FLOWER_RED: 15,
  FLOWER_YELLOW: 16,
  GLASS: 17,
};

export const BlockProps = {
  [Block.AIR]:        { solid: false, transparent: true,  hardness: 0 },
  [Block.GRASS]:      { solid: true,  transparent: false, hardness: 0.6 },
  [Block.DIRT]:       { solid: true,  transparent: false, hardness: 0.5 },
  [Block.STONE]:      { solid: true,  transparent: false, hardness: 1.5 },
  [Block.COBBLESTONE]:{ solid: true,  transparent: false, hardness: 2.0 },
  [Block.PLANKS]:     { solid: true,  transparent: false, hardness: 2.0 },
  [Block.LOG]:        { solid: true,  transparent: false, hardness: 2.0 },
  [Block.LEAVES]:     { solid: true,  transparent: true,  hardness: 0.2 },
  [Block.SAND]:       { solid: true,  transparent: false, hardness: 0.5 },
  [Block.WATER]:      { solid: false, transparent: true,  hardness: -1 },
  [Block.BEDROCK]:    { solid: true,  transparent: false, hardness: -1 },
  [Block.COAL_ORE]:   { solid: true,  transparent: false, hardness: 3.0 },
  [Block.IRON_ORE]:   { solid: true,  transparent: false, hardness: 3.0 },
  [Block.DEEPSLATE]:  { solid: true,  transparent: false, hardness: 3.0 },
  [Block.SNOW]:       { solid: true,  transparent: false, hardness: 0.2 },
  [Block.FLOWER_RED]: { solid: false, transparent: true,  hardness: 0 },
  [Block.FLOWER_YELLOW]:{ solid: false, transparent: true, hardness: 0 },
  [Block.GLASS]:      { solid: true,  transparent: true,  hardness: 0.3 },
};

export function isSolid(id) {
  return BlockProps[id]?.solid ?? false;
}
export function isTransparent(id) {
  return BlockProps[id]?.transparent ?? true;
}
