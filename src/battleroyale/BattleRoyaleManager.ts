import * as THREE from 'three';
import { SoundEngine } from '../core/SoundEngine';
import { Player } from '../player/Player';

export interface StormPhase {
  phaseNumber: number;
  duration: number; // seconds
  startRadius: number;
  targetRadius: number;
}

export class BattleRoyaleManager {
  public isActive: boolean = false;
  public stormCenter: THREE.Vector3 = new THREE.Vector3(8, 0, 8);
  public currentRadius: number = 100;
  public targetRadius: number = 100;

  // Phase management
  public currentPhaseIndex: number = 0;
  public phaseTimer: number = 60; // 60s
  public phases: StormPhase[] = [
    { phaseNumber: 1, duration: 60, startRadius: 100, targetRadius: 55 },
    { phaseNumber: 2, duration: 45, startRadius: 55, targetRadius: 25 },
    { phaseNumber: 3, duration: 35, startRadius: 25, targetRadius: 8 }
  ];

  // Visuals
  public stormMesh: THREE.Mesh;
  public stormCylinderGeom: THREE.CylinderGeometry;
  private stormMaterial: THREE.MeshBasicMaterial;
  private scene: THREE.Scene;
  private sound: SoundEngine;

  // Stats
  public playersRemaining: number = 24;
  public killFeed: { message: string; timestamp: number }[] = [];
  public isWon: boolean = false;

  // Damage ticks
  private damageTickTimer: number = 0;
  private sirenTimer: number = 0;
  private killFeedTimer: number = 0;

  constructor(scene: THREE.Scene, sound: SoundEngine) {
    this.scene = scene;
    this.sound = sound;

    // Create 3D Holographic Storm Forcefield Cylinder
    this.stormCylinderGeom = new THREE.CylinderGeometry(100, 100, 60, 48, 1, true);
    this.stormMaterial = new THREE.MeshBasicMaterial({
      color: 0x8b5cf6, // Vibrant purple electric storm
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      wireframe: true
    });

    this.stormMesh = new THREE.Mesh(this.stormCylinderGeom, this.stormMaterial);
    this.stormMesh.position.set(this.stormCenter.x, 25, this.stormCenter.z);
    this.stormMesh.visible = false;
    this.scene.add(this.stormMesh);
  }

  public activate(): void {
    this.isActive = true;
    this.currentPhaseIndex = 0;
    this.currentRadius = this.phases[0].startRadius;
    this.targetRadius = this.phases[0].targetRadius;
    this.phaseTimer = this.phases[0].duration;
    this.stormMesh.visible = true;
    this.playersRemaining = 24;
    this.isWon = false;
    this.killFeed = [];
    this.sound.playStormSiren();
    this.addNotification('⚡ BATTLE ROYALE MODE ACTIVATED! The storm is forming...');
  }

  public deactivate(): void {
    this.isActive = false;
    this.stormMesh.visible = false;
  }

  public update(dt: number, player: Player): { isPlayerInStorm: boolean } {
    if (!this.isActive) return { isPlayerInStorm: false };

    // Update phase timer and radius interpolation
    this.phaseTimer -= dt;
    const curPhase = this.phases[this.currentPhaseIndex];

    if (this.phaseTimer > 0) {
      const progress = 1.0 - this.phaseTimer / curPhase.duration;
      this.currentRadius = THREE.MathUtils.lerp(curPhase.startRadius, curPhase.targetRadius, progress);
    } else {
      // Advance to next phase
      if (this.currentPhaseIndex < this.phases.length - 1) {
        this.currentPhaseIndex++;
        const next = this.phases[this.currentPhaseIndex];
        this.phaseTimer = next.duration;
        this.currentRadius = next.startRadius;
        this.targetRadius = next.targetRadius;
        this.sound.playStormSiren();
        this.addNotification(`⚠️ STORM COLLAPSING! Phase ${next.phaseNumber} initiated!`);
      } else {
        this.currentRadius = curPhase.targetRadius;
      }
    }

    // Scale cylinder mesh
    this.stormMesh.scale.set(this.currentRadius / 100, 1, this.currentRadius / 100);
    this.stormMesh.rotation.y += dt * 0.15; // Slow ambient rotation

    // Check if player is outside storm boundary
    const distFromCenter = Math.hypot(
      player.position.x - this.stormCenter.x,
      player.position.z - this.stormCenter.z
    );

    const isPlayerInStorm = distFromCenter > this.currentRadius;

    if (isPlayerInStorm) {
      // Storm damage tick
      this.damageTickTimer += dt;
      if (this.damageTickTimer >= 1.0) {
        this.damageTickTimer = 0;
        player.takeDamage(6);
      }

      this.sirenTimer += dt;
      if (this.sirenTimer >= 5.0) {
        this.sirenTimer = 0;
        this.sound.playStormSiren();
      }
    }

    // Simulated Killfeed & Player Count Reduction
    this.killFeedTimer += dt;
    if (this.killFeedTimer > 9.0 && this.playersRemaining > 2) {
      this.killFeedTimer = 0;
      this.playersRemaining = Math.max(2, this.playersRemaining - Math.floor(Math.random() * 2 + 1));
      const killers = ['ShadowStriker', 'VoxelSlayer', 'RuneKnight', 'StormSurfer', 'GlitchReaper'];
      const victims = ['Woodchopper99', 'NoobMaster', 'DiamondFinder', 'BlockMiner', 'PixelWarrior'];
      const weapons = ['Iron Blade', 'Token Sun Blade', 'Goblin Dagger', 'Crossbow'];

      const k = killers[Math.floor(Math.random() * killers.length)];
      const v = victims[Math.floor(Math.random() * victims.length)];
      const w = weapons[Math.floor(Math.random() * weapons.length)];
      this.addKillFeed(`${k} eliminated ${v} with ${w}`);
    }

    if (this.playersRemaining <= 2 && !this.isWon) {
      this.playersRemaining = 1;
      this.isWon = true;
      this.sound.playLevelUp();
      this.addNotification('🏆 VICTORY ROYALE! You survived the Token Arena!');
    }

    return { isPlayerInStorm };
  }

  public addKillFeed(msg: string): void {
    this.killFeed.unshift({ message: msg, timestamp: Date.now() });
    if (this.killFeed.length > 5) {
      this.killFeed.pop();
    }
  }

  private addNotification(text: string): void {
    const el = document.getElementById('notification-banner');
    if (el) {
      el.textContent = text;
      el.classList.remove('hidden');
      setTimeout(() => el.classList.add('hidden'), 5000);
    }
  }
}
