import { SoundEngine } from '../core/SoundEngine';

export interface QuestObjective {
  id: string;
  description: string;
  required: number;
  current: number;
  completed: boolean;
}

export interface Quest {
  id: string;
  title: string;
  summary: string;
  category: 'story' | 'combat' | 'crafting' | 'arena';
  objectives: QuestObjective[];
  rewards: {
    xpSkill?: 'woodcutting' | 'mining' | 'combat' | 'defense';
    xpAmount?: number;
    coins?: number;
    items?: { id: string; count: number }[];
  };
  isAccepted: boolean;
  isCompleted: boolean;
}

export class QuestManager {
  public quests: Map<string, Quest> = new Map();
  public activeQuestId: string = 'quest_awakening';
  private sound: SoundEngine;
  public onQuestUpdated?: (quest: Quest) => void;
  public onQuestCompleted?: (quest: Quest) => void;

  constructor(sound: SoundEngine) {
    this.sound = sound;
    this.initDefaultQuests();
  }

  private initDefaultQuests(): void {
    const list: Quest[] = [
      {
        id: 'quest_awakening',
        title: "The Pioneer's Awakening",
        summary: 'Elder Bob needs you to harvest wood to begin building the outpost defenses.',
        category: 'crafting',
        isAccepted: true,
        isCompleted: false,
        objectives: [
          { id: 'wood_chop', description: 'Chop 4 Oak Wood logs', required: 4, current: 0, completed: false },
          { id: 'planks_place', description: 'Place 2 Wood Planks', required: 2, current: 0, completed: false }
        ],
        rewards: {
          xpSkill: 'woodcutting',
          xpAmount: 120,
          coins: 50,
          items: [{ id: 'apple', count: 4 }]
        }
      },
      {
        id: 'quest_goblins',
        title: 'Goblin Incursion',
        summary: 'Hostile forest goblins have crept close to the shrine. Defend the settlement!',
        category: 'combat',
        isAccepted: true,
        isCompleted: false,
        objectives: [
          { id: 'goblin_kill', description: 'Defeat 2 Forest Goblins', required: 2, current: 0, completed: false }
        ],
        rewards: {
          xpSkill: 'combat',
          xpAmount: 200,
          coins: 100,
          items: [{ id: 'health_potion', count: 2 }]
        }
      },
      {
        id: 'quest_mining',
        title: 'Depths of Wealth',
        summary: 'Tunnel into the stone subterranean layers and uncover valuable mineral deposits.',
        category: 'story',
        isAccepted: true,
        isCompleted: false,
        objectives: [
          { id: 'stone_mine', description: 'Mine 5 Stone or Cobblestone blocks', required: 5, current: 0, completed: false },
          { id: 'ore_mine', description: 'Discover and mine 1 Gold or Diamond Ore', required: 1, current: 0, completed: false }
        ],
        rewards: {
          xpSkill: 'mining',
          xpAmount: 300,
          coins: 150,
          items: [{ id: 'diamond', count: 1 }]
        }
      },
      {
        id: 'quest_battleroyale',
        title: 'Arena Gladiator',
        summary: 'Enter Battle Royale mode (press B), outrun the electric storm, and claim supply crates.',
        category: 'arena',
        isAccepted: true,
        isCompleted: false,
        objectives: [
          { id: 'open_chest', description: 'Loot 1 Golden Supply Crate in the arena', required: 1, current: 0, completed: false },
          { id: 'survive_storm', description: 'Survive the first shrinking storm phase', required: 1, current: 0, completed: false }
        ],
        rewards: {
          xpSkill: 'combat',
          xpAmount: 500,
          coins: 300,
          items: [{ id: 'diamond_sword', count: 1 }]
        }
      }
    ];

    list.forEach((q) => this.quests.set(q.id, q));
  }

  public getActiveQuest(): Quest | undefined {
    return this.quests.get(this.activeQuestId);
  }

  public reportProgress(objectiveId: string, amount: number = 1): void {
    let changed = false;

    for (const quest of this.quests.values()) {
      if (quest.isCompleted || !quest.isAccepted) continue;

      for (const obj of quest.objectives) {
        if (obj.id === objectiveId && !obj.completed) {
          obj.current = Math.min(obj.required, obj.current + amount);
          if (obj.current >= obj.required) {
            obj.completed = true;
          }
          changed = true;
        }
      }

      // Check if all objectives complete
      const allDone = quest.objectives.every((o) => o.completed);
      if (allDone && !quest.isCompleted) {
        quest.isCompleted = true;
        this.sound.playQuestComplete();
        if (this.onQuestCompleted) {
          this.onQuestCompleted(quest);
        }
      }

      if (changed && this.onQuestUpdated) {
        this.onQuestUpdated(quest);
      }
    }
  }
}
