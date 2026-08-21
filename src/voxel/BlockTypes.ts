export enum BlockType {
  AIR = 0,
  GRASS = 1,
  DIRT = 2,
  STONE = 3,
  COBBLESTONE = 4,
  WOOD = 5,
  PLANKS = 6,
  LEAVES = 7,
  SAND = 8,
  WATER = 9,
  GOLD_ORE = 10,
  DIAMOND_ORE = 11,
  BRICK = 12,
  CHEST = 13,
  BEACON = 14,
  BEDROCK = 15
}

export interface BlockDefinition {
  id: BlockType;
  name: string;
  isSolid: boolean;
  isTransparent: boolean;
  hardness: number; // break time factor
  soundType: 'grass' | 'dirt' | 'stone' | 'wood' | 'sand' | 'glass';
  xpSkill?: 'mining' | 'woodcutting';
  xpAmount?: number;
  dropItemId?: string;
  dropCount?: number;
}

export const BLOCK_DEFINITIONS: Record<BlockType, BlockDefinition> = {
  [BlockType.AIR]: {
    id: BlockType.AIR,
    name: 'Air',
    isSolid: false,
    isTransparent: true,
    hardness: 0,
    soundType: 'grass'
  },
  [BlockType.GRASS]: {
    id: BlockType.GRASS,
    name: 'Grass Block',
    isSolid: true,
    isTransparent: false,
    hardness: 0.6,
    soundType: 'grass',
    dropItemId: 'dirt',
    dropCount: 1
  },
  [BlockType.DIRT]: {
    id: BlockType.DIRT,
    name: 'Dirt',
    isSolid: true,
    isTransparent: false,
    hardness: 0.5,
    soundType: 'dirt',
    dropItemId: 'dirt',
    dropCount: 1
  },
  [BlockType.STONE]: {
    id: BlockType.STONE,
    name: 'Stone',
    isSolid: true,
    isTransparent: false,
    hardness: 1.5,
    soundType: 'stone',
    xpSkill: 'mining',
    xpAmount: 15,
    dropItemId: 'cobblestone',
    dropCount: 1
  },
  [BlockType.COBBLESTONE]: {
    id: BlockType.COBBLESTONE,
    name: 'Cobblestone',
    isSolid: true,
    isTransparent: false,
    hardness: 1.8,
    soundType: 'stone',
    xpSkill: 'mining',
    xpAmount: 10,
    dropItemId: 'cobblestone',
    dropCount: 1
  },
  [BlockType.WOOD]: {
    id: BlockType.WOOD,
    name: 'Oak Wood',
    isSolid: true,
    isTransparent: false,
    hardness: 1.2,
    soundType: 'wood',
    xpSkill: 'woodcutting',
    xpAmount: 25,
    dropItemId: 'wood_log',
    dropCount: 1
  },
  [BlockType.PLANKS]: {
    id: BlockType.PLANKS,
    name: 'Wood Planks',
    isSolid: true,
    isTransparent: false,
    hardness: 1.0,
    soundType: 'wood',
    dropItemId: 'wood_planks',
    dropCount: 1
  },
  [BlockType.LEAVES]: {
    id: BlockType.LEAVES,
    name: 'Oak Leaves',
    isSolid: true,
    isTransparent: true,
    hardness: 0.2,
    soundType: 'grass',
    dropItemId: 'apple',
    dropCount: 1
  },
  [BlockType.SAND]: {
    id: BlockType.SAND,
    name: 'Golden Sand',
    isSolid: true,
    isTransparent: false,
    hardness: 0.5,
    soundType: 'sand',
    dropItemId: 'sand',
    dropCount: 1
  },
  [BlockType.WATER]: {
    id: BlockType.WATER,
    name: 'Fresh Water',
    isSolid: false,
    isTransparent: true,
    hardness: 100,
    soundType: 'grass'
  },
  [BlockType.GOLD_ORE]: {
    id: BlockType.GOLD_ORE,
    name: 'Gold Ore',
    isSolid: true,
    isTransparent: false,
    hardness: 2.5,
    soundType: 'stone',
    xpSkill: 'mining',
    xpAmount: 60,
    dropItemId: 'gold_ore',
    dropCount: 1
  },
  [BlockType.DIAMOND_ORE]: {
    id: BlockType.DIAMOND_ORE,
    name: 'Diamond Ore',
    isSolid: true,
    isTransparent: false,
    hardness: 3.5,
    soundType: 'stone',
    xpSkill: 'mining',
    xpAmount: 150,
    dropItemId: 'diamond',
    dropCount: 1
  },
  [BlockType.BRICK]: {
    id: BlockType.BRICK,
    name: 'Stone Bricks',
    isSolid: true,
    isTransparent: false,
    hardness: 2.0,
    soundType: 'stone',
    dropItemId: 'stone_brick',
    dropCount: 1
  },
  [BlockType.CHEST]: {
    id: BlockType.CHEST,
    name: 'Treasure Chest',
    isSolid: true,
    isTransparent: false,
    hardness: 1.0,
    soundType: 'wood',
    dropItemId: 'chest',
    dropCount: 1
  },
  [BlockType.BEACON]: {
    id: BlockType.BEACON,
    name: 'Runic Beacon',
    isSolid: true,
    isTransparent: false,
    hardness: 5.0,
    soundType: 'glass',
    dropItemId: 'runic_core',
    dropCount: 1
  },
  [BlockType.BEDROCK]: {
    id: BlockType.BEDROCK,
    name: 'Bedrock',
    isSolid: true,
    isTransparent: false,
    hardness: Infinity,
    soundType: 'stone'
  }
};
