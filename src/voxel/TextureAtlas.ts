import * as THREE from 'three';
import { BlockType } from './BlockTypes';

export class TextureAtlas {
  public static materials: Map<string, THREE.Material> = new Map();
  private static canvasCache: Map<string, HTMLCanvasElement> = new Map();

  public static init(): void {
    if (this.materials.size > 0) return;

    // Generate procedural pixel textures for each block face
    const blockTextureDefs: Record<BlockType, { top?: string; bottom?: string; side?: string; all?: string }> = {
      [BlockType.AIR]: {},
      [BlockType.GRASS]: { top: 'grass_top', bottom: 'dirt', side: 'grass_side' },
      [BlockType.DIRT]: { all: 'dirt' },
      [BlockType.STONE]: { all: 'stone' },
      [BlockType.COBBLESTONE]: { all: 'cobblestone' },
      [BlockType.WOOD]: { top: 'wood_top', bottom: 'wood_top', side: 'wood_side' },
      [BlockType.PLANKS]: { all: 'planks' },
      [BlockType.LEAVES]: { all: 'leaves' },
      [BlockType.SAND]: { all: 'sand' },
      [BlockType.WATER]: { all: 'water' },
      [BlockType.GOLD_ORE]: { all: 'gold_ore' },
      [BlockType.DIAMOND_ORE]: { all: 'diamond_ore' },
      [BlockType.BRICK]: { all: 'brick' },
      [BlockType.CHEST]: { top: 'chest_top', bottom: 'wood_top', side: 'chest_side' },
      [BlockType.BEACON]: { all: 'beacon' },
      [BlockType.BEDROCK]: { all: 'bedrock' }
    };

    // Pre-render canvases
    const patterns = [
      'grass_top', 'grass_side', 'dirt', 'stone', 'cobblestone',
      'wood_side', 'wood_top', 'planks', 'leaves', 'sand',
      'water', 'gold_ore', 'diamond_ore', 'brick', 'chest_side',
      'chest_top', 'beacon', 'bedrock'
    ];

    for (const pattern of patterns) {
      const canvas = this.generateProceduralCanvas(pattern);
      this.canvasCache.set(pattern, canvas);
      const texture = new THREE.CanvasTexture(canvas);
      texture.magFilter = THREE.NearestFilter;
      texture.minFilter = THREE.NearestFilter;
      texture.colorSpace = THREE.SRGBColorSpace;

      const isTransparent = pattern === 'leaves' || pattern === 'water';
      const opacity = pattern === 'water' ? 0.75 : 1.0;

      const mat = new THREE.MeshLambertMaterial({
        map: texture,
        transparent: isTransparent,
        opacity: opacity,
        alphaTest: pattern === 'leaves' ? 0.2 : 0,
        side: THREE.DoubleSide
      });
      this.materials.set(pattern, mat);
    }
  }

  public static getMaterial(name: string): THREE.Material {
    if (this.materials.size === 0) this.init();
    return this.materials.get(name) || this.materials.get('dirt')!;
  }

  public static getMaterialForFace(type: BlockType, face: 'top' | 'bottom' | 'side'): THREE.Material {
    if (this.materials.size === 0) this.init();
    switch (type) {
      case BlockType.GRASS:
        if (face === 'top') return this.materials.get('grass_top')!;
        if (face === 'bottom') return this.materials.get('dirt')!;
        return this.materials.get('grass_side')!;
      case BlockType.WOOD:
        if (face === 'top' || face === 'bottom') return this.materials.get('wood_top')!;
        return this.materials.get('wood_side')!;
      case BlockType.CHEST:
        if (face === 'top') return this.materials.get('chest_top')!;
        if (face === 'bottom') return this.materials.get('wood_top')!;
        return this.materials.get('chest_side')!;
      case BlockType.STONE: return this.materials.get('stone')!;
      case BlockType.COBBLESTONE: return this.materials.get('cobblestone')!;
      case BlockType.PLANKS: return this.materials.get('planks')!;
      case BlockType.LEAVES: return this.materials.get('leaves')!;
      case BlockType.SAND: return this.materials.get('sand')!;
      case BlockType.WATER: return this.materials.get('water')!;
      case BlockType.GOLD_ORE: return this.materials.get('gold_ore')!;
      case BlockType.DIAMOND_ORE: return this.materials.get('diamond_ore')!;
      case BlockType.BRICK: return this.materials.get('brick')!;
      case BlockType.BEACON: return this.materials.get('beacon')!;
      case BlockType.BEDROCK: return this.materials.get('bedrock')!;
      case BlockType.DIRT:
      default:
        return this.materials.get('dirt')!;
    }
  }

  private static generateProceduralCanvas(name: string): HTMLCanvasElement {
    const size = 16;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Helper random variation
    const noise = (base: number, range: number) => {
      const delta = (Math.random() - 0.5) * range;
      return Math.min(255, Math.max(0, Math.floor(base + delta)));
    };

    switch (name) {
      case 'grass_top': {
        for (let y = 0; y < size; y++) {
          for (let x = 0; x < size; x++) {
            const g = noise(140, 45);
            const r = Math.floor(g * 0.45);
            const b = Math.floor(g * 0.25);
            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.fillRect(x, y, 1, 1);
          }
        }
        break;
      }

      case 'grass_side': {
        // Top 4 pixels grass lip, bottom dirt
        for (let y = 0; y < size; y++) {
          for (let x = 0; x < size; x++) {
            const isGrass = y < 4 || (y < 6 && (x % 3 === 0 || x % 5 === 0));
            if (isGrass) {
              const g = noise(130, 40);
              ctx.fillStyle = `rgb(${Math.floor(g * 0.45)},${g},${Math.floor(g * 0.25)})`;
            } else {
              const r = noise(120, 30);
              const g = Math.floor(r * 0.65);
              const b = Math.floor(r * 0.35);
              ctx.fillStyle = `rgb(${r},${g},${b})`;
            }
            ctx.fillRect(x, y, 1, 1);
          }
        }
        break;
      }

      case 'dirt': {
        for (let y = 0; y < size; y++) {
          for (let x = 0; x < size; x++) {
            const r = noise(115, 30);
            const g = Math.floor(r * 0.65);
            const b = Math.floor(r * 0.35);
            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.fillRect(x, y, 1, 1);
          }
        }
        break;
      }

      case 'stone': {
        for (let y = 0; y < size; y++) {
          for (let x = 0; x < size; x++) {
            const v = noise(128, 40);
            ctx.fillStyle = `rgb(${v},${v},${v + 5})`;
            ctx.fillRect(x, y, 1, 1);
          }
        }
        break;
      }

      case 'cobblestone': {
        for (let y = 0; y < size; y++) {
          for (let x = 0; x < size; x++) {
            const isMortar = (x % 4 === 0 && y % 4 === 0) || (x + y) % 6 === 0;
            const base = isMortar ? 75 : 135;
            const v = noise(base, 35);
            ctx.fillStyle = `rgb(${v},${v},${v + 2})`;
            ctx.fillRect(x, y, 1, 1);
          }
        }
        break;
      }

      case 'wood_side': {
        for (let y = 0; y < size; y++) {
          for (let x = 0; x < size; x++) {
            const stripe = Math.sin(x * 1.5) * 15;
            const r = noise(105 + stripe, 20);
            const g = Math.floor(r * 0.6);
            const b = Math.floor(r * 0.3);
            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.fillRect(x, y, 1, 1);
          }
        }
        break;
      }

      case 'wood_top': {
        const center = size / 2;
        for (let y = 0; y < size; y++) {
          for (let x = 0; x < size; x++) {
            const dist = Math.hypot(x - center, y - center);
            const ring = Math.floor(dist * 2) % 2 === 0 ? 20 : -10;
            const r = noise(150 + ring, 25);
            const g = Math.floor(r * 0.7);
            const b = Math.floor(r * 0.4);
            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.fillRect(x, y, 1, 1);
          }
        }
        break;
      }

      case 'planks': {
        for (let y = 0; y < size; y++) {
          for (let x = 0; x < size; x++) {
            const isDivider = y % 4 === 0;
            const r = isDivider ? 85 : noise(165, 25);
            const g = Math.floor(r * 0.72);
            const b = Math.floor(r * 0.42);
            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.fillRect(x, y, 1, 1);
          }
        }
        break;
      }

      case 'leaves': {
        for (let y = 0; y < size; y++) {
          for (let x = 0; x < size; x++) {
            if (Math.random() > 0.85) {
              ctx.clearRect(x, y, 1, 1);
            } else {
              const g = noise(140, 50);
              const r = Math.floor(g * 0.3);
              const b = Math.floor(g * 0.2);
              ctx.fillStyle = `rgb(${r},${g},${b})`;
              ctx.fillRect(x, y, 1, 1);
            }
          }
        }
        break;
      }

      case 'sand': {
        for (let y = 0; y < size; y++) {
          for (let x = 0; x < size; x++) {
            const r = noise(220, 25);
            const g = noise(195, 25);
            const b = noise(130, 20);
            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.fillRect(x, y, 1, 1);
          }
        }
        break;
      }

      case 'water': {
        for (let y = 0; y < size; y++) {
          for (let x = 0; x < size; x++) {
            const wave = Math.sin((x + y) * 0.8) * 20;
            const b = noise(210 + wave, 25);
            const g = Math.floor(b * 0.65);
            const r = Math.floor(b * 0.2);
            ctx.fillStyle = `rgba(${r},${g},${b},0.8)`;
            ctx.fillRect(x, y, 1, 1);
          }
        }
        break;
      }

      case 'gold_ore': {
        // Base stone + gold flecks
        for (let y = 0; y < size; y++) {
          for (let x = 0; x < size; x++) {
            const isGold = (x >= 4 && x <= 6 && y >= 4 && y <= 6) ||
                           (x >= 10 && x <= 12 && y >= 9 && y <= 11) ||
                           (x === 8 && y === 12);
            if (isGold) {
              ctx.fillStyle = Math.random() > 0.3 ? '#fcd34d' : '#f59e0b';
            } else {
              const v = noise(125, 30);
              ctx.fillStyle = `rgb(${v},${v},${v + 5})`;
            }
            ctx.fillRect(x, y, 1, 1);
          }
        }
        break;
      }

      case 'diamond_ore': {
        // Base stone + diamond cyan flecks
        for (let y = 0; y < size; y++) {
          for (let x = 0; x < size; x++) {
            const isDia = (x >= 5 && x <= 7 && y >= 3 && y <= 5) ||
                          (x >= 9 && x <= 11 && y >= 10 && y <= 12) ||
                          (x === 3 && y === 11);
            if (isDia) {
              ctx.fillStyle = Math.random() > 0.4 ? '#38bdf8' : '#67e8f9';
            } else {
              const v = noise(120, 30);
              ctx.fillStyle = `rgb(${v},${v},${v + 5})`;
            }
            ctx.fillRect(x, y, 1, 1);
          }
        }
        break;
      }

      case 'brick': {
        for (let y = 0; y < size; y++) {
          for (let x = 0; x < size; x++) {
            const isHorizontalMortar = y % 4 === 0;
            const row = Math.floor(y / 4);
            const isVerticalMortar = (x + (row % 2) * 4) % 8 === 0;
            if (isHorizontalMortar || isVerticalMortar) {
              ctx.fillStyle = '#94a3b8';
            } else {
              const r = noise(160, 30);
              ctx.fillStyle = `rgb(${r},${Math.floor(r * 0.4)},${Math.floor(r * 0.3)})`;
            }
            ctx.fillRect(x, y, 1, 1);
          }
        }
        break;
      }

      case 'chest_side': {
        ctx.fillStyle = '#854d0e';
        ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = '#1e293b';
        ctx.strokeRect(1, 1, size - 2, size - 2);
        // Lock
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(7, 6, 2, 4);
        break;
      }

      case 'chest_top': {
        ctx.fillStyle = '#713f12';
        ctx.fillRect(0, 0, size, size);
        ctx.strokeStyle = '#1e293b';
        ctx.strokeRect(1, 1, size - 2, size - 2);
        break;
      }

      case 'beacon': {
        // Glowing cyan runic pattern
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = '#06b6d4';
        ctx.fillRect(4, 4, 8, 8);
        ctx.fillStyle = '#67e8f9';
        ctx.fillRect(6, 6, 4, 4);
        break;
      }

      case 'bedrock': {
        for (let y = 0; y < size; y++) {
          for (let x = 0; x < size; x++) {
            const v = noise(35, 25);
            ctx.fillStyle = `rgb(${v},${v},${v})`;
            ctx.fillRect(x, y, 1, 1);
          }
        }
        break;
      }

      default: {
        ctx.fillStyle = '#a855f7';
        ctx.fillRect(0, 0, size, size);
        break;
      }
    }

    return canvas;
  }
}
