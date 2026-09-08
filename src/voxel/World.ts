import * as THREE from 'three';
import { BlockType, BLOCK_DEFINITIONS } from './BlockTypes';
import { Chunk, CHUNK_SIZE_X, CHUNK_SIZE_Y, CHUNK_SIZE_Z } from './Chunk';
import { SimplexNoise } from './SimplexNoise';

export interface RaycastResult {
  hit: boolean;
  point: THREE.Vector3;
  blockPos: THREE.Vector3;
  faceNormal: THREE.Vector3;
  blockType: BlockType;
}

export class World {
  public chunks: Map<string, Chunk> = new Map();
  public scene: THREE.Scene;
  public noise: SimplexNoise;
  public seed: number;

  constructor(scene: THREE.Scene, seed: number = 421337) {
    this.scene = scene;
    this.seed = seed;
    this.noise = new SimplexNoise(seed);
  }

  public getChunkKey(cx: number, cz: number): string {
    return `${cx},${cz}`;
  }

  public getChunk(cx: number, cz: number): Chunk | undefined {
    return this.chunks.get(this.getChunkKey(cx, cz));
  }

  public getOrCreateChunk(cx: number, cz: number): Chunk {
    const key = this.getChunkKey(cx, cz);
    let chunk = this.chunks.get(key);
    if (!chunk) {
      chunk = new Chunk(cx, cz, this);
      this.chunks.set(key, chunk);
      this.generateChunkTerrain(chunk);
      this.scene.add(chunk.meshGroup);
    }
    return chunk;
  }

  public getBlock(gx: number, gy: number, gz: number): BlockType {
    if (gy < 0 || gy >= CHUNK_SIZE_Y) return BlockType.AIR;
    const cx = Math.floor(gx / CHUNK_SIZE_X);
    const cz = Math.floor(gz / CHUNK_SIZE_Z);
    const chunk = this.chunks.get(this.getChunkKey(cx, cz));
    if (!chunk) return BlockType.AIR;

    const lx = ((gx % CHUNK_SIZE_X) + CHUNK_SIZE_X) % CHUNK_SIZE_X;
    const lz = ((gz % CHUNK_SIZE_Z) + CHUNK_SIZE_Z) % CHUNK_SIZE_Z;
    return chunk.getBlock(lx, gy, lz);
  }

  public setBlock(gx: number, gy: number, gz: number, type: BlockType): boolean {
    if (gy < 0 || gy >= CHUNK_SIZE_Y) return false;
    const cx = Math.floor(gx / CHUNK_SIZE_X);
    const cz = Math.floor(gz / CHUNK_SIZE_Z);
    const chunk = this.getOrCreateChunk(cx, cz);

    const lx = ((gx % CHUNK_SIZE_X) + CHUNK_SIZE_X) % CHUNK_SIZE_X;
    const lz = ((gz % CHUNK_SIZE_Z) + CHUNK_SIZE_Z) % CHUNK_SIZE_Z;

    chunk.setBlock(lx, gy, lz, type);
    chunk.rebuildMesh();

    // Mark neighbor chunks dirty if block is on chunk edge
    if (lx === 0) this.getChunk(cx - 1, cz)?.rebuildMesh();
    if (lx === CHUNK_SIZE_X - 1) this.getChunk(cx + 1, cz)?.rebuildMesh();
    if (lz === 0) this.getChunk(cx, cz - 1)?.rebuildMesh();
    if (lz === CHUNK_SIZE_Z - 1) this.getChunk(cx, cz + 1)?.rebuildMesh();

    return true;
  }

  private generateChunkTerrain(chunk: Chunk): void {
    const seaLevel = 8;
    const baseHeight = 12;

    for (let x = 0; x < CHUNK_SIZE_X; x++) {
      for (let z = 0; z < CHUNK_SIZE_Z; z++) {
        const gx = chunk.cx * CHUNK_SIZE_X + x;
        const gz = chunk.cz * CHUNK_SIZE_Z + z;

        // Multi-octave elevation
        const n1 = this.noise.fbm2D(gx * 0.015, gz * 0.015, 3, 0.5);
        const n2 = this.noise.noise2D(gx * 0.05, gz * 0.05) * 3;
        const height = Math.floor(baseHeight + n1 * 9 + n2);
        const clampedHeight = Math.max(1, Math.min(CHUNK_SIZE_Y - 7, height));

        // Bedrock
        chunk.setBlock(x, 0, z, BlockType.BEDROCK);

        // Underground & Stone
        for (let y = 1; y < clampedHeight; y++) {
          if (y < clampedHeight - 3) {
            // Check ore veins
            const oreNoise = this.noise.fbm3D(gx * 0.2, y * 0.2, gz * 0.2);
            if (y <= 5 && oreNoise > 0.65) {
              chunk.setBlock(x, y, z, BlockType.DIAMOND_ORE);
            } else if (y <= 10 && oreNoise > 0.5) {
              chunk.setBlock(x, y, z, BlockType.GOLD_ORE);
            } else {
              chunk.setBlock(x, y, z, BlockType.STONE);
            }
          } else {
            chunk.setBlock(x, y, z, BlockType.DIRT);
          }
        }

        // Surface block
        if (clampedHeight <= seaLevel + 1) {
          chunk.setBlock(x, clampedHeight, z, BlockType.SAND);
          // Fill water up to sea level
          for (let y = clampedHeight + 1; y <= seaLevel; y++) {
            chunk.setBlock(x, y, z, BlockType.WATER);
          }
        } else {
          chunk.setBlock(x, clampedHeight, z, BlockType.GRASS);
        }

        // Water fill in pits
        if (clampedHeight < seaLevel) {
          for (let y = clampedHeight; y <= seaLevel; y++) {
            if (chunk.getBlock(x, y, z) === BlockType.AIR) {
              chunk.setBlock(x, y, z, BlockType.WATER);
            }
          }
        }
      }
    }

    // Tree generation
    for (let x = 2; x < CHUNK_SIZE_X - 2; x++) {
      for (let z = 2; z < CHUNK_SIZE_Z - 2; z++) {
        const gx = chunk.cx * CHUNK_SIZE_X + x;
        const gz = chunk.cz * CHUNK_SIZE_Z + z;
        const treeNoise = Math.abs(this.noise.noise2D(gx * 0.8, gz * 0.8));

        // Find surface
        let surfaceY = -1;
        for (let y = CHUNK_SIZE_Y - 8; y >= seaLevel + 2; y--) {
          if (chunk.getBlock(x, y, z) === BlockType.GRASS) {
            surfaceY = y;
            break;
          }
        }

        if (surfaceY > 0 && treeNoise > 0.72) {
          this.plantTree(chunk, x, surfaceY + 1, z);
        }
      }
    }

    // Rare Shrine structure at origin area
    if (chunk.cx === 0 && chunk.cz === 0) {
      this.buildSpawnRuins(chunk);
    }
  }

  private plantTree(chunk: Chunk, x: number, y: number, z: number): void {
    const trunkHeight = 4;
    // Wood trunk
    for (let dy = 0; dy < trunkHeight; dy++) {
      if (y + dy < CHUNK_SIZE_Y) {
        chunk.setBlock(x, y + dy, z, BlockType.WOOD);
      }
    }

    // Leaves canopy
    const leafY = y + trunkHeight - 1;
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        for (let dy = 0; dy <= 2; dy++) {
          if (Math.abs(dx) === 2 && Math.abs(dz) === 2 && dy === 2) continue;
          const lx = x + dx;
          const ly = leafY + dy;
          const lz = z + dz;
          if (lx >= 0 && lx < CHUNK_SIZE_X && lz >= 0 && lz < CHUNK_SIZE_Z && ly < CHUNK_SIZE_Y) {
            if (chunk.getBlock(lx, ly, lz) === BlockType.AIR) {
              chunk.setBlock(lx, ly, lz, BlockType.LEAVES);
            }
          }
        }
      }
    }
  }

  private buildSpawnRuins(chunk: Chunk): void {
    const rx = 6;
    const rz = 6;
    let ry = 10;
    while (ry < CHUNK_SIZE_Y && chunk.getBlock(rx, ry, rz) !== BlockType.AIR) {
      ry++;
    }

    // Stone foundation
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        chunk.setBlock(rx + dx, ry, rz + dz, BlockType.BRICK);
      }
    }

    // Pillars
    chunk.setBlock(rx - 2, ry + 1, rz - 2, BlockType.BRICK);
    chunk.setBlock(rx - 2, ry + 2, rz - 2, BlockType.BRICK);
    chunk.setBlock(rx + 2, ry + 1, rz - 2, BlockType.BRICK);
    chunk.setBlock(rx + 2, ry + 2, rz - 2, BlockType.BRICK);
    chunk.setBlock(rx - 2, ry + 1, rz + 2, BlockType.BRICK);
    chunk.setBlock(rx - 2, ry + 2, rz + 2, BlockType.BRICK);
    chunk.setBlock(rx + 2, ry + 1, rz + 2, BlockType.BRICK);
    chunk.setBlock(rx + 2, ry + 2, rz + 2, BlockType.BRICK);

    // Central Runic Beacon & Treasure Chest
    chunk.setBlock(rx, ry + 1, rz, BlockType.BEACON);
    chunk.setBlock(rx + 1, ry + 1, rz, BlockType.CHEST);
  }

  public initSurroundingChunks(centerChunkX: number, centerChunkZ: number, radius: number = 2): void {
    for (let cx = centerChunkX - radius; cx <= centerChunkX + radius; cx++) {
      for (let cz = centerChunkZ - radius; cz <= centerChunkZ + radius; cz++) {
        this.getOrCreateChunk(cx, cz);
      }
    }

    // Rebuild all created meshes
    for (let cx = centerChunkX - radius; cx <= centerChunkX + radius; cx++) {
      for (let cz = centerChunkZ - radius; cz <= centerChunkZ + radius; cz++) {
        const chunk = this.getChunk(cx, cz);
        if (chunk) chunk.rebuildMesh();
      }
    }
  }

  /**
   * Fast DDA (Digital Differential Analyzer) voxel raycaster
   */
  public raycast(origin: THREE.Vector3, direction: THREE.Vector3, maxDistance: number = 6.0): RaycastResult {
    const dir = direction.clone().normalize();
    const result: RaycastResult = {
      hit: false,
      point: new THREE.Vector3(),
      blockPos: new THREE.Vector3(),
      faceNormal: new THREE.Vector3(),
      blockType: BlockType.AIR
    };

    let px = Math.floor(origin.x);
    let py = Math.floor(origin.y);
    let pz = Math.floor(origin.z);

    const stepX = dir.x > 0 ? 1 : dir.x < 0 ? -1 : 0;
    const stepY = dir.y > 0 ? 1 : dir.y < 0 ? -1 : 0;
    const stepZ = dir.z > 0 ? 1 : dir.z < 0 ? -1 : 0;

    const tDeltaX = dir.x !== 0 ? Math.abs(1 / dir.x) : Infinity;
    const tDeltaY = dir.y !== 0 ? Math.abs(1 / dir.y) : Infinity;
    const tDeltaZ = dir.z !== 0 ? Math.abs(1 / dir.z) : Infinity;

    let tMaxX = stepX > 0 ? (px + 1 - origin.x) * tDeltaX : (origin.x - px) * tDeltaX;
    let tMaxY = stepY > 0 ? (py + 1 - origin.y) * tDeltaY : (origin.y - py) * tDeltaY;
    let tMaxZ = stepZ > 0 ? (pz + 1 - origin.z) * tDeltaZ : (origin.z - pz) * tDeltaZ;

    let t = 0;
    let normalX = 0;
    let normalY = 0;
    let normalZ = 0;

    while (t <= maxDistance) {
      const block = this.getBlock(px, py, pz);
      if (block !== BlockType.AIR && block !== BlockType.WATER) {
        result.hit = true;
        result.blockPos.set(px, py, pz);
        result.faceNormal.set(normalX, normalY, normalZ);
        result.point.copy(origin).addScaledVector(dir, t);
        result.blockType = block;
        return result;
      }

      if (tMaxX < tMaxY) {
        if (tMaxX < tMaxZ) {
          px += stepX;
          t = tMaxX;
          tMaxX += tDeltaX;
          normalX = -stepX;
          normalY = 0;
          normalZ = 0;
        } else {
          pz += stepZ;
          t = tMaxZ;
          tMaxZ += tDeltaZ;
          normalX = 0;
          normalY = 0;
          normalZ = -stepZ;
        }
      } else {
        if (tMaxY < tMaxZ) {
          py += stepY;
          t = tMaxY;
          tMaxY += tDeltaY;
          normalX = 0;
          normalY = -stepY;
          normalZ = 0;
        } else {
          pz += stepZ;
          t = tMaxZ;
          tMaxZ += tDeltaZ;
          normalX = 0;
          normalY = 0;
          normalZ = -stepZ;
        }
      }
    }

    return result;
  }
}
