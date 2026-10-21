import * as THREE from 'three';
import { Entity } from './Entity';
import { World } from '../voxel/World';
import { SoundEngine } from '../core/SoundEngine';

export class NPC extends Entity {
  public dialogue: string[];
  public questId?: string;
  private questMarker: THREE.Mesh;
  private floatTime: number = 0;

  constructor(id: string, name: string, x: number, y: number, z: number, dialogue: string[], questId?: string) {
    super(id, name, x, y, z, 200, 0.6, 1.8);
    this.isHostile = false;
    this.dialogue = dialogue;
    this.questId = questId;

    // Green health bar for friendly NPC
    (this.healthBarFg.material as THREE.MeshBasicMaterial).color.set(0x22c55e);

    // Build Elder Bob 3D model
    const skinMat = new THREE.MeshLambertMaterial({ color: 0xffdbac });
    const robeMat = new THREE.MeshLambertMaterial({ color: 0x6366f1 }); // purple elder robe
    const beardMat = new THREE.MeshLambertMaterial({ color: 0xf8fafc });

    // Head & Beard
    const headGeom = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    const head = new THREE.Mesh(headGeom, skinMat);
    head.position.set(0, 1.6, 0);
    this.mesh.add(head);

    const beardGeom = new THREE.BoxGeometry(0.3, 0.25, 0.15);
    const beard = new THREE.Mesh(beardGeom, beardMat);
    beard.position.set(0, 1.45, 0.18);
    this.mesh.add(beard);

    // Robe body
    const bodyGeom = new THREE.BoxGeometry(0.6, 1.2, 0.4);
    const body = new THREE.Mesh(bodyGeom, robeMat);
    body.position.set(0, 0.75, 0);
    this.mesh.add(body);

    // Floating Quest Exclamation Marker [!]
    const markerCanvas = document.createElement('canvas');
    markerCanvas.width = 64;
    markerCanvas.height = 64;
    const mctx = markerCanvas.getContext('2d')!;
    mctx.fillStyle = '#facc15';
    mctx.beginPath();
    mctx.arc(32, 32, 28, 0, Math.PI * 2);
    mctx.fill();
    mctx.lineWidth = 4;
    mctx.strokeStyle = '#854d0e';
    mctx.stroke();
    mctx.fillStyle = '#1e293b';
    mctx.font = 'bold 42px monospace';
    mctx.textAlign = 'center';
    mctx.textBaseline = 'middle';
    mctx.fillText('!', 32, 34);

    const markerTex = new THREE.CanvasTexture(markerCanvas);
    const markerMat = new THREE.MeshBasicMaterial({ map: markerTex, transparent: true, side: THREE.DoubleSide });
    this.questMarker = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.6), markerMat);
    this.questMarker.position.set(0, 2.5, 0);
    this.mesh.add(this.questMarker);
  }

  public update(dt: number, _world: World, playerPos: THREE.Vector3, _sound: SoundEngine): void {
    // Face towards player when nearby
    const dx = playerPos.x - this.position.x;
    const dz = playerPos.z - this.position.z;
    const dist = Math.hypot(dx, dz);

    if (dist < 8.0) {
      this.mesh.rotation.y = Math.atan2(dx, dz);
    }

    // Animate quest marker float and spin
    this.floatTime += dt * 3.0;
    this.questMarker.position.y = 2.4 + Math.sin(this.floatTime) * 0.12;
  }

  public takeDamage(_amount: number, _knockbackDir: THREE.Vector3, _sound: SoundEngine): void {
    // Friendly NPCs do not take damage
  }
}
