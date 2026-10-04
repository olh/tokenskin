export type SkillType = 'woodcutting' | 'mining' | 'combat' | 'defense';

export interface SkillData {
  xp: number;
  level: number;
}

export class SkillsManager {
  public skills: Record<SkillType, SkillData> = {
    woodcutting: { xp: 0, level: 1 },
    mining: { xp: 0, level: 1 },
    combat: { xp: 0, level: 1 },
    defense: { xp: 0, level: 1 }
  };

  private levelTable: number[] = [];
  public onLevelUp?: (skill: SkillType, newLevel: number) => void;
  public onXpGained?: (skill: SkillType, amount: number) => void;

  constructor() {
    this.buildLevelTable();
  }

  /**
   * Generates RuneScape XP milestones up to level 99
   */
  private buildLevelTable(): void {
    let points = 0;
    this.levelTable[1] = 0;
    for (let lvl = 1; lvl < 100; lvl++) {
      points += Math.floor(lvl + 300 * Math.pow(2, lvl / 7.0));
      this.levelTable[lvl + 1] = Math.floor(points / 4);
    }
  }

  public getXpForLevel(level: number): number {
    if (level <= 1) return 0;
    if (level >= 99) return this.levelTable[99];
    return this.levelTable[level];
  }

  public getLevelFromXp(xp: number): number {
    for (let lvl = 99; lvl >= 1; lvl--) {
      if (xp >= this.levelTable[lvl]) {
        return lvl;
      }
    }
    return 1;
  }

  public addXp(skill: SkillType, amount: number): boolean {
    if (amount <= 0) return false;
    const data = this.skills[skill];
    data.xp += amount;

    if (this.onXpGained) {
      this.onXpGained(skill, amount);
    }

    const calculatedLevel = this.getLevelFromXp(data.xp);
    if (calculatedLevel > data.level) {
      const oldLevel = data.level;
      data.level = calculatedLevel;
      if (this.onLevelUp) {
        this.onLevelUp(skill, data.level);
      }
      return true;
    }
    return false;
  }

  public getProgressPercentage(skill: SkillType): number {
    const data = this.skills[skill];
    if (data.level >= 99) return 100;
    const currentLvlXp = this.getXpForLevel(data.level);
    const nextLvlXp = this.getXpForLevel(data.level + 1);
    const progress = (data.xp - currentLvlXp) / (nextLvlXp - currentLvlXp);
    return Math.max(0, Math.min(100, progress * 100));
  }

  public getTotalCombatLevel(): number {
    // RuneScape combat formula approximation
    const def = this.skills.defense.level;
    const atk = this.skills.combat.level;
    return Math.floor((def + atk) * 0.5) + 3;
  }
}
