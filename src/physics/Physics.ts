import * as THREE from 'three';
import { AABB } from './AABB';
import { World } from '../voxel/World';
import { BlockType, BLOCK_DEFINITIONS } from '../voxel/BlockTypes';

export class Physics {
  public static GRAVITY = -24.0;
  public static JUMP_VELOCITY = 8.5;
  public static TERMINAL_VELOCITY = -35.0;

  public static simulate(
    position: THREE.Vector3,
    velocity: THREE.Vector3,
    dimensions: THREE.Vector3, // width, height, depth
    dt: number,
    world: World
  ): { onGround: boolean; inWater: boolean; stepped: boolean } {
    const halfW = dimensions.x * 0.5;
    const halfD = dimensions.z * 0.5;

    // Check if in water
    const blockAtFeet = world.getBlock(
      Math.floor(position.x),
      Math.floor(position.y),
      Math.floor(position.z)
    );
    const inWater = blockAtFeet === BlockType.WATER;

    // Apply gravity
    if (inWater) {
      velocity.y = Math.max(-4.0, velocity.y + Physics.GRAVITY * 0.2 * dt);
      velocity.x *= 0.85;
      velocity.z *= 0.85;
    } else {
      velocity.y = Math.max(Physics.TERMINAL_VELOCITY, velocity.y + Physics.GRAVITY * dt);
    }

    // Attempted movement vector
    const moveX = velocity.x * dt;
    const moveY = velocity.y * dt;
    const moveZ = velocity.z * dt;

    let onGround = false;
    let stepped = false;

    // Current player AABB
    const box = new AABB(
      new THREE.Vector3(position.x - halfW, position.y, position.z - halfD),
      new THREE.Vector3(position.x + halfW, position.y + dimensions.y, position.z + halfD)
    );

    // Helper: collect solid block boxes near entity
    const getNearbySolids = (testBox: AABB): AABB[] => {
      const solids: AABB[] = [];
      const minX = Math.floor(testBox.min.x - 0.2);
      const maxX = Math.floor(testBox.max.x + 0.2);
      const minY = Math.floor(testBox.min.y - 0.2);
      const maxY = Math.floor(testBox.max.y + 0.2);
      const minZ = Math.floor(testBox.min.z - 0.2);
      const maxZ = Math.floor(testBox.max.z + 0.2);

      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          for (let x = minX; x <= maxX; x++) {
            const block = world.getBlock(x, y, z);
            if (block !== BlockType.AIR && block !== BlockType.WATER) {
              const def = BLOCK_DEFINITIONS[block];
              if (def && def.isSolid) {
                solids.push(
                  new AABB(
                    new THREE.Vector3(x, y, z),
                    new THREE.Vector3(x + 1, y + 1, z + 1)
                  )
                );
              }
            }
          }
        }
      }
      return solids;
    };

    // 1. Resolve Y axis first
    let newY = position.y + moveY;
    const testBoxY = new AABB(
      new THREE.Vector3(position.x - halfW, newY, position.z - halfD),
      new THREE.Vector3(position.x + halfW, newY + dimensions.y, position.z + halfD)
    );

    const solidsY = getNearbySolids(testBoxY);
    for (const solid of solidsY) {
      if (testBoxY.intersects(solid)) {
        if (moveY < 0) {
          // Falling down onto block
          newY = solid.max.y;
          velocity.y = 0;
          onGround = true;
        } else if (moveY > 0) {
          // Hitting ceiling
          newY = solid.min.y - dimensions.y;
          velocity.y = 0;
        }
        testBoxY.min.y = newY;
        testBoxY.max.y = newY + dimensions.y;
      }
    }
    position.y = newY;

    // 2. Resolve X axis (with step-up check)
    let newX = position.x + moveX;
    const testBoxX = new AABB(
      new THREE.Vector3(newX - halfW, position.y, position.z - halfD),
      new THREE.Vector3(newX + halfW, position.y + dimensions.y, position.z + halfD)
    );

    const solidsX = getNearbySolids(testBoxX);
    let hitX = false;
    for (const solid of solidsX) {
      if (testBoxX.intersects(solid)) {
        hitX = true;
        break;
      }
    }

    if (hitX) {
      // Try step up 0.55 blocks
      const stepBoxX = new AABB(
        new THREE.Vector3(newX - halfW, position.y + 0.55, position.z - halfD),
        new THREE.Vector3(newX + halfW, position.y + dimensions.y + 0.55, position.z + halfD)
      );
      let stepBlocked = false;
      for (const solid of getNearbySolids(stepBoxX)) {
        if (stepBoxX.intersects(solid)) {
          stepBlocked = true;
          break;
        }
      }

      if (!stepBlocked && onGround) {
        position.y += 0.55;
        stepped = true;
      } else {
        // Blocked horizontally
        velocity.x = 0;
        newX = position.x;
      }
    }
    position.x = newX;

    // 3. Resolve Z axis (with step-up check)
    let newZ = position.z + moveZ;
    const testBoxZ = new AABB(
      new THREE.Vector3(position.x - halfW, position.y, newZ - halfD),
      new THREE.Vector3(position.x + halfW, position.y + dimensions.y, newZ + halfD)
    );

    const solidsZ = getNearbySolids(testBoxZ);
    let hitZ = false;
    for (const solid of solidsZ) {
      if (testBoxZ.intersects(solid)) {
        hitZ = true;
        break;
      }
    }

    if (hitZ) {
      const stepBoxZ = new AABB(
        new THREE.Vector3(position.x - halfW, position.y + 0.55, newZ - halfD),
        new THREE.Vector3(position.x + halfW, position.y + dimensions.y + 0.55, newZ + halfD)
      );
      let stepBlocked = false;
      for (const solid of getNearbySolids(stepBoxZ)) {
        if (stepBoxZ.intersects(solid)) {
          stepBlocked = true;
          break;
        }
      }

      if (!stepBlocked && onGround) {
        position.y += 0.55;
        stepped = true;
      } else {
        velocity.z = 0;
        newZ = position.z;
      }
    }
    position.z = newZ;

    return { onGround, inWater, stepped };
  }
}
