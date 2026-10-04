import { BlockType } from '../voxel/BlockTypes';

export type ItemCategory = 'weapon' | 'tool' | 'block' | 'consumable' | 'material' | 'quest';

export interface ItemDef {
  id: string;
  name: string;
  category: ItemCategory;
  blockType?: BlockType;
  damage?: number;
  defense?: number;
  healAmount?: number;
  description: string;
  iconColor: string;
  maxStack: number;
}

export interface ItemStack {
  id: string;
  count: number;
}

export const ITEM_REGISTRY: Record<string, ItemDef> = {
  // Weapons
  wood_sword: {
    id: 'wood_sword',
    name: 'Wooden Blade',
    category: 'weapon',
    damage: 12,
    description: 'A modest training sword carved from sturdy oak.',
    iconColor: '#a16207',
    maxStack: 1
  },
  iron_sword: {
    id: 'iron_sword',
    name: 'Reforged Iron Sword',
    category: 'weapon',
    damage: 25,
    description: 'Forged iron blade with balanced weight and sharp edges.',
    iconColor: '#94a3b8',
    maxStack: 1
  },
  diamond_sword: {
    id: 'diamond_sword',
    name: 'Token Sun Blade',
    category: 'weapon',
    damage: 50,
    description: 'A legendary crystal blade glowing with arena power.',
    iconColor: '#38bdf8',
    maxStack: 1
  },

  // Tools
  wood_pickaxe: {
    id: 'wood_pickaxe',
    name: 'Wooden Pickaxe',
    category: 'tool',
    description: 'Used for mining stone and mineral deposits.',
    iconColor: '#78350f',
    maxStack: 1
  },
  iron_pickaxe: {
    id: 'iron_pickaxe',
    name: 'Iron Pickaxe',
    category: 'tool',
    description: 'Breaks tough stone and ores with ease.',
    iconColor: '#64748b',
    maxStack: 1
  },
  wood_axe: {
    id: 'wood_axe',
    name: 'Lumberjack Axe',
    category: 'tool',
    description: 'Fells trees quickly to gain Woodcutting XP.',
    iconColor: '#92400e',
    maxStack: 1
  },

  // Consumables
  apple: {
    id: 'apple',
    name: 'Sweet Apple',
    category: 'consumable',
    healAmount: 20,
    description: 'Juicy orchard apple. Restores 20 HP.',
    iconColor: '#ef4444',
    maxStack: 16
  },
  health_potion: {
    id: 'health_potion',
    name: 'Health Elixir',
    category: 'consumable',
    healAmount: 60,
    description: 'Alchemical potion. Instantly restores 60 HP.',
    iconColor: '#ec4899',
    maxStack: 8
  },

  // Blocks
  dirt: {
    id: 'dirt',
    name: 'Dirt',
    category: 'block',
    blockType: BlockType.DIRT,
    description: 'Common soil block.',
    iconColor: '#78350f',
    maxStack: 64
  },
  cobblestone: {
    id: 'cobblestone',
    name: 'Cobblestone',
    category: 'block',
    blockType: BlockType.COBBLESTONE,
    description: 'Sturdy building stone.',
    iconColor: '#64748b',
    maxStack: 64
  },
  wood_log: {
    id: 'wood_log',
    name: 'Oak Log',
    category: 'material',
    blockType: BlockType.WOOD,
    description: 'Freshly chopped timber.',
    iconColor: '#854d0e',
    maxStack: 64
  },
  wood_planks: {
    id: 'wood_planks',
    name: 'Wood Planks',
    category: 'block',
    blockType: BlockType.PLANKS,
    description: 'Refined planks for crafting and building.',
    iconColor: '#ca8a04',
    maxStack: 64
  },
  sand: {
    id: 'sand',
    name: 'Sand',
    category: 'block',
    blockType: BlockType.SAND,
    description: 'Fine golden sand.',
    iconColor: '#fde047',
    maxStack: 64
  },
  stone_brick: {
    id: 'stone_brick',
    name: 'Stone Bricks',
    category: 'block',
    blockType: BlockType.BRICK,
    description: 'Decorative masonry bricks.',
    iconColor: '#94a3b8',
    maxStack: 64
  },

  // Materials & Loot
  gold_ore: {
    id: 'gold_ore',
    name: 'Raw Gold Ore',
    category: 'material',
    description: 'Shimmering gold ore extracted from the earth.',
    iconColor: '#f59e0b',
    maxStack: 64
  },
  diamond: {
    id: 'diamond',
    name: 'Token Gem',
    category: 'material',
    description: 'Flawless gem pulsing with arcane energy.',
    iconColor: '#06b6d4',
    maxStack: 64
  },
  goblin_dagger: {
    id: 'goblin_dagger',
    name: 'Goblin Scrap Dagger',
    category: 'weapon',
    damage: 18,
    description: 'Crude dagger taken from a defeated goblin raider.',
    iconColor: '#65a30d',
    maxStack: 1
  },
  coins: {
    id: 'coins',
    name: 'Gold Coins',
    category: 'material',
    description: 'Standard currency of the realm.',
    iconColor: '#fbbf24',
    maxStack: 9999
  },
  runic_core: {
    id: 'runic_core',
    name: 'Ancient Runic Core',
    category: 'quest',
    description: 'An ancient relic that stabilizes the dimensional rift.',
    iconColor: '#8b5cf6',
    maxStack: 1
  }
};

export class Inventory {
  public hotbar: (ItemStack | null)[] = new Array(9).fill(null);
  public slots: (ItemStack | null)[] = new Array(28).fill(null); // RuneScape 28 slot grid
  public equippedWeapon: ItemStack | null = null;
  public selectedHotbarSlot: number = 0;

  constructor() {
    this.initDefaultStarterKit();
  }

  private initDefaultStarterKit(): void {
    // Starting loadout
    this.hotbar[0] = { id: 'wood_sword', count: 1 };
    this.hotbar[1] = { id: 'wood_pickaxe', count: 1 };
    this.hotbar[2] = { id: 'wood_axe', count: 1 };
    this.hotbar[3] = { id: 'wood_planks', count: 32 };
    this.hotbar[4] = { id: 'apple', count: 5 };

    this.equippedWeapon = { id: 'wood_sword', count: 1 };
  }

  public getActiveItem(): ItemStack | null {
    return this.hotbar[this.selectedHotbarSlot];
  }

  public addItem(id: string, count: number = 1): boolean {
    const def = ITEM_REGISTRY[id];
    if (!def) return false;

    // Check hotbar first for stackable items
    for (let i = 0; i < this.hotbar.length; i++) {
      const slot = this.hotbar[i];
      if (slot && slot.id === id && slot.count < def.maxStack) {
        const space = def.maxStack - slot.count;
        const toAdd = Math.min(space, count);
        slot.count += toAdd;
        count -= toAdd;
        if (count <= 0) return true;
      }
    }

    // Check main inventory slots
    for (let i = 0; i < this.slots.length; i++) {
      const slot = this.slots[i];
      if (slot && slot.id === id && slot.count < def.maxStack) {
        const space = def.maxStack - slot.count;
        const toAdd = Math.min(space, count);
        slot.count += toAdd;
        count -= toAdd;
        if (count <= 0) return true;
      }
    }

    // Place remaining into empty hotbar slot
    for (let i = 0; i < this.hotbar.length; i++) {
      if (!this.hotbar[i]) {
        const toAdd = Math.min(def.maxStack, count);
        this.hotbar[i] = { id, count: toAdd };
        count -= toAdd;
        if (count <= 0) return true;
      }
    }

    // Place remaining into empty inventory slot
    for (let i = 0; i < this.slots.length; i++) {
      if (!this.slots[i]) {
        const toAdd = Math.min(def.maxStack, count);
        this.slots[i] = { id, count: toAdd };
        count -= toAdd;
        if (count <= 0) return true;
      }
    }

    return count === 0;
  }

  public removeItem(id: string, count: number = 1): boolean {
    if (!this.hasItem(id, count)) return false;

    let remaining = count;
    // Remove from hotbar
    for (let i = 0; i < this.hotbar.length; i++) {
      const slot = this.hotbar[i];
      if (slot && slot.id === id) {
        const take = Math.min(remaining, slot.count);
        slot.count -= take;
        remaining -= take;
        if (slot.count <= 0) this.hotbar[i] = null;
        if (remaining <= 0) return true;
      }
    }

    // Remove from inventory
    for (let i = 0; i < this.slots.length; i++) {
      const slot = this.slots[i];
      if (slot && slot.id === id) {
        const take = Math.min(remaining, slot.count);
        slot.count -= take;
        remaining -= take;
        if (slot.count <= 0) this.slots[i] = null;
        if (remaining <= 0) return true;
      }
    }

    return true;
  }

  public hasItem(id: string, count: number = 1): boolean {
    let total = 0;
    for (const slot of this.hotbar) {
      if (slot && slot.id === id) total += slot.count;
    }
    for (const slot of this.slots) {
      if (slot && slot.id === id) total += slot.count;
    }
    return total >= count;
  }

  public getItemCount(id: string): number {
    let total = 0;
    for (const slot of this.hotbar) {
      if (slot && slot.id === id) total += slot.count;
    }
    for (const slot of this.slots) {
      if (slot && slot.id === id) total += slot.count;
    }
    return total;
  }
}
