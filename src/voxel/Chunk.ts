import * as THREE from 'three';
import { BlockType, BLOCK_DEFINITIONS } from './BlockTypes';
import { TextureAtlas } from './TextureAtlas';
import type { World } from './World';

export const CHUNK_SIZE_X = 16;
export const CHUNK_SIZE_Y = 32;
export const CHUNK_SIZE_Z = 16;

export class Chunk {
  public cx: number;
  public cz: number;
  public blocks: Uint8Array;
  public meshGroup: THREE.Group;
  public isDirty: boolean = true;
  private world: World;

  constructor(cx: number, cz: number, world: World) {
    this.cx = cx;
    this.cz = cz;
    this.world = world;
    this.blocks = new Uint8Array(CHUNK_SIZE_X * CHUNK_SIZE_Y * CHUNK_SIZE_Z);
    this.meshGroup = new THREE.Group();
    this.meshGroup.position.set(cx * CHUNK_SIZE_X, 0, cz * CHUNK_SIZE_Z);
  }

  public getIndex(x: number, y: number, z: number): number {
    return y * CHUNK_SIZE_X * CHUNK_SIZE_Z + z * CHUNK_SIZE_X + x;
  }

  public getBlock(x: number, y: number, z: number): BlockType {
    if (x < 0 || x >= CHUNK_SIZE_X || y < 0 || y >= CHUNK_SIZE_Y || z < 0 || z >= CHUNK_SIZE_Z) {
      return BlockType.AIR;
    }
    return this.blocks[this.getIndex(x, y, z)] as BlockType;
  }

  public setBlock(x: number, y: number, z: number, type: BlockType): void {
    if (x < 0 || x >= CHUNK_SIZE_X || y < 0 || y >= CHUNK_SIZE_Y || z < 0 || z >= CHUNK_SIZE_Z) {
      return;
    }
    const idx = this.getIndex(x, y, z);
    if (this.blocks[idx] !== type) {
      this.blocks[idx] = type;
      this.isDirty = true;
    }
  }

  public rebuildMesh(): void {
    if (!this.isDirty) return;
    this.isDirty = false;

    // Dispose old meshes
    while (this.meshGroup.children.length > 0) {
      const child = this.meshGroup.children[0] as THREE.Mesh;
      if (child.geometry) child.geometry.dispose();
      this.meshGroup.remove(child);
    }

    // Accumulators per material
    type FaceData = {
      positions: number[];
      normals: number[];
      uvs: number[];
      colors: number[];
    };

    const materialBuffers: Map<THREE.Material, FaceData> = new Map();

    const getBuffer = (mat: THREE.Material): FaceData => {
      let buf = materialBuffers.get(mat);
      if (!buf) {
        buf = { positions: [], normals: [], uvs: [], colors: [] };
        materialBuffers.set(mat, buf);
      }
      return buf;
    };

    const isBlockOpaque = (type: BlockType): boolean => {
      if (type === BlockType.AIR) return false;
      const def = BLOCK_DEFINITIONS[type];
      return def ? !def.isTransparent : false;
    };

    const getNeighborOpaque = (gx: number, gy: number, gz: number): boolean => {
      if (gy < 0) return true;
      if (gy >= CHUNK_SIZE_Y) return false;
      const b = this.world.getBlock(gx, gy, gz);
      return isBlockOpaque(b);
    };

    // Calculate ambient occlusion factor (0.0 to 1.0)
    const computeAO = (side1: boolean, side2: boolean, corner: boolean): number => {
      if (side1 && side2) return 0.5;
      const count = (side1 ? 1 : 0) + (side2 ? 1 : 0) + (corner ? 1 : 0);
      return 1.0 - count * 0.16;
    };

    for (let y = 0; y < CHUNK_SIZE_Y; y++) {
      for (let z = 0; z < CHUNK_SIZE_Z; z++) {
        for (let x = 0; x < CHUNK_SIZE_X; x++) {
          const type = this.getBlock(x, y, z);
          if (type === BlockType.AIR) continue;

          const gx = this.cx * CHUNK_SIZE_X + x;
          const gy = y;
          const gz = this.cz * CHUNK_SIZE_Z + z;

          // Check 6 faces
          // Top face (Y+)
          if (!getNeighborOpaque(gx, gy + 1, gz)) {
            const mat = TextureAtlas.getMaterialForFace(type, 'top');
            const buf = getBuffer(mat);

            // Compute AO for 4 corners of top face
            const sW = getNeighborOpaque(gx - 1, gy + 1, gz);
            const sE = getNeighborOpaque(gx + 1, gy + 1, gz);
            const sN = getNeighborOpaque(gx, gy + 1, gz - 1);
            const sS = getNeighborOpaque(gx, gy + 1, gz + 1);

            const ao0 = computeAO(sW, sN, getNeighborOpaque(gx - 1, gy + 1, gz - 1));
            const ao1 = computeAO(sW, sS, getNeighborOpaque(gx - 1, gy + 1, gz + 1));
            const ao2 = computeAO(sE, sS, getNeighborOpaque(gx + 1, gy + 1, gz + 1));
            const ao3 = computeAO(sE, sN, getNeighborOpaque(gx + 1, gy + 1, gz - 1));

            // Vertices: (x, y+1, z) -> (x, y+1, z+1) -> (x+1, y+1, z+1) -> (x+1, y+1, z)
            // Tri 1: 0, 1, 2
            buf.positions.push(
              x, y + 1, z,
              x, y + 1, z + 1,
              x + 1, y + 1, z + 1,
              x, y + 1, z,
              x + 1, y + 1, z + 1,
              x + 1, y + 1, z
            );
            for (let i = 0; i < 6; i++) buf.normals.push(0, 1, 0);
            buf.uvs.push(0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0);
            buf.colors.push(
              ao0, ao0, ao0,
              ao1, ao1, ao1,
              ao2, ao2, ao2,
              ao0, ao0, ao0,
              ao2, ao2, ao2,
              ao3, ao3, ao3
            );
          }

          // Bottom face (Y-)
          if (!getNeighborOpaque(gx, gy - 1, gz)) {
            const mat = TextureAtlas.getMaterialForFace(type, 'bottom');
            const buf = getBuffer(mat);
            buf.positions.push(
              x, y, z + 1,
              x, y, z,
              x + 1, y, z,
              x, y, z + 1,
              x + 1, y, z,
              x + 1, y, z + 1
            );
            for (let i = 0; i < 6; i++) buf.normals.push(0, -1, 0);
            buf.uvs.push(0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0);
            for (let i = 0; i < 6; i++) buf.colors.push(0.65, 0.65, 0.65);
          }

          // North face (Z-)
          if (!getNeighborOpaque(gx, gy, gz - 1)) {
            const mat = TextureAtlas.getMaterialForFace(type, 'side');
            const buf = getBuffer(mat);
            buf.positions.push(
              x + 1, y, z,
              x, y, z,
              x, y + 1, z,
              x + 1, y, z,
              x, y + 1, z,
              x + 1, y + 1, z
            );
            for (let i = 0; i < 6; i++) buf.normals.push(0, 0, -1);
            buf.uvs.push(0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1);
            for (let i = 0; i < 6; i++) buf.colors.push(0.85, 0.85, 0.85);
          }

          // South face (Z+)
          if (!getNeighborOpaque(gx, gy, gz + 1)) {
            const mat = TextureAtlas.getMaterialForFace(type, 'side');
            const buf = getBuffer(mat);
            buf.positions.push(
              x, y, z + 1,
              x + 1, y, z + 1,
              x + 1, y + 1, z + 1,
              x, y, z + 1,
              x + 1, y + 1, z + 1,
              x, y + 1, z + 1
            );
            for (let i = 0; i < 6; i++) buf.normals.push(0, 0, 1);
            buf.uvs.push(0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1);
            for (let i = 0; i < 6; i++) buf.colors.push(0.85, 0.85, 0.85);
          }

          // West face (X-)
          if (!getNeighborOpaque(gx - 1, gy, gz)) {
            const mat = TextureAtlas.getMaterialForFace(type, 'side');
            const buf = getBuffer(mat);
            buf.positions.push(
              x, y, z,
              x, y, z + 1,
              x, y + 1, z + 1,
              x, y, z,
              x, y + 1, z + 1,
              x, y + 1, z
            );
            for (let i = 0; i < 6; i++) buf.normals.push(-1, 0, 0);
            buf.uvs.push(0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1);
            for (let i = 0; i < 6; i++) buf.colors.push(0.78, 0.78, 0.78);
          }

          // East face (X+)
          if (!getNeighborOpaque(gx + 1, gy, gz)) {
            const mat = TextureAtlas.getMaterialForFace(type, 'side');
            const buf = getBuffer(mat);
            buf.positions.push(
              x + 1, y, z + 1,
              x + 1, y, z,
              x + 1, y + 1, z,
              x + 1, y, z + 1,
              x + 1, y + 1, z,
              x + 1, y + 1, z + 1
            );
            for (let i = 0; i < 6; i++) buf.normals.push(1, 0, 0);
            buf.uvs.push(0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1);
            for (let i = 0; i < 6; i++) buf.colors.push(0.78, 0.78, 0.78);
          }
        }
      }
    }

    // Build Three.js meshes
    for (const [mat, data] of materialBuffers.entries()) {
      if (data.positions.length === 0) continue;

      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.Float32BufferAttribute(data.positions, 3));
      geom.setAttribute('normal', new THREE.Float32BufferAttribute(data.normals, 3));
      geom.setAttribute('uv', new THREE.Float32BufferAttribute(data.uvs, 2));
      geom.setAttribute('color', new THREE.Float32BufferAttribute(data.colors, 3));

      // Clone material with vertexColors enabled if not already
      let meshMat = mat;
      if (!meshMat.vertexColors) {
        meshMat = mat.clone();
        meshMat.vertexColors = true;
      }

      const mesh = new THREE.Mesh(geom, meshMat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.meshGroup.add(mesh);
    }
  }
}
