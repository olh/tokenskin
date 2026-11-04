import * as THREE from 'three';
import { World } from '../voxel/World';
import { Player } from '../player/Player';
import { Entity } from '../entities/Entity';
import { Monster } from '../entities/Monster';
import { NPC } from '../entities/NPC';
import { BattleRoyaleManager } from '../battleroyale/BattleRoyaleManager';

export class Minimap {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private size: number = 180;
  private zoom: number = 1.8; // pixels per world meter

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.canvas.width = this.size;
    this.canvas.height = this.size;
    this.ctx = canvas.getContext('2d')!;
  }

  public render(
    player: Player,
    entities: Entity[],
    brManager: BattleRoyaleManager,
    _world: World
  ): void {
    const ctx = this.ctx;
    const center = this.size * 0.5;

    // Clear background
    ctx.clearRect(0, 0, this.size, this.size);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.arc(center, center, center - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#38bdf8';
    ctx.stroke();

    ctx.save();
    // Clip to radar circle
    ctx.beginPath();
    ctx.arc(center, center, center - 4, 0, Math.PI * 2);
    ctx.clip();

    // Subtle grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let r = 25; r < center; r += 25) {
      ctx.beginPath();
      ctx.arc(center, center, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // World-to-radar mapping
    const toRadar = (wx: number, wz: number) => {
      const dx = (wx - player.position.x) * this.zoom;
      const dz = (wz - player.position.z) * this.zoom;
      return { x: center + dx, y: center + dz };
    };

    // Draw Battle Royale Storm Circle if active
    if (brManager.isActive) {
      const stormPos = toRadar(brManager.stormCenter.x, brManager.stormCenter.z);
      const stormRadiusPx = brManager.currentRadius * this.zoom;

      ctx.beginPath();
      ctx.arc(stormPos.x, stormPos.y, stormRadiusPx, 0, Math.PI * 2);
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = 'rgba(168, 85, 247, 0.12)';
      ctx.fill();
    }

    // Draw Entities
    for (const entity of entities) {
      if (entity.isDead) continue;
      const pos = toRadar(entity.position.x, entity.position.z);
      const distSq = (pos.x - center) ** 2 + (pos.y - center) ** 2;
      if (distSq > (center - 8) ** 2) continue; // Out of radar radius

      if (entity instanceof Monster) {
        ctx.fillStyle = '#ef4444'; // Red hostile blip
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (entity instanceof NPC) {
        ctx.fillStyle = '#22c55e'; // Green friendly NPC blip
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    // Draw Player marker at center
    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(-player.yaw);

    // Player Direction Arrow
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(6, 6);
    ctx.lineTo(0, 3);
    ctx.lineTo(-6, 6);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();

    ctx.restore(); // Restore clipping

    // Compass indicator (North)
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('N', center, 14);
  }
}
