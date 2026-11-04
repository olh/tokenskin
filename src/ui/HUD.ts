import { Player } from '../player/Player';
import { QuestManager } from '../rpg/QuestManager';
import { BattleRoyaleManager } from '../battleroyale/BattleRoyaleManager';
import { ITEM_REGISTRY, ItemStack } from '../player/Inventory';
import { SkillType } from '../player/SkillsManager';

export class HUD {
  private player: Player;
  private questManager: QuestManager;
  private brManager: BattleRoyaleManager;

  // DOM Elements
  private hpBarFill: HTMLElement;
  private hpText: HTMLElement;
  private staminaBarFill: HTMLElement;
  private xpBarFill: HTMLElement;
  private xpText: HTMLElement;
  private combatLvlText: HTMLElement;
  private hotbarSlots: HTMLElement[] = [];
  private questTitle: HTMLElement;
  private questObjectives: HTMLElement;
  private brStatusWidget: HTMLElement;
  private brTimerText: HTMLElement;
  private brAliveText: HTMLElement;
  private modeToggleBtn: HTMLElement;
  private stormHazardOverlay: HTMLElement;
  private floatingTextContainer: HTMLElement;

  // Modals
  private inventoryModal: HTMLElement;
  private questModal: HTMLElement;
  private helpModal: HTMLElement;
  private dialogueModal: HTMLElement;

  public activeSkillTracked: SkillType = 'woodcutting';

  constructor(player: Player, questManager: QuestManager, brManager: BattleRoyaleManager) {
    this.player = player;
    this.questManager = questManager;
    this.brManager = brManager;

    this.hpBarFill = document.getElementById('hp-bar-fill')!;
    this.hpText = document.getElementById('hp-text')!;
    this.staminaBarFill = document.getElementById('stamina-bar-fill')!;
    this.xpBarFill = document.getElementById('xp-bar-fill')!;
    this.xpText = document.getElementById('xp-text')!;
    this.combatLvlText = document.getElementById('combat-lvl-text')!;

    this.questTitle = document.getElementById('hud-quest-title')!;
    this.questObjectives = document.getElementById('hud-quest-objectives')!;

    this.brStatusWidget = document.getElementById('br-status-widget')!;
    this.brTimerText = document.getElementById('br-timer-text')!;
    this.brAliveText = document.getElementById('br-alive-text')!;
    this.modeToggleBtn = document.getElementById('mode-toggle-btn')!;
    this.stormHazardOverlay = document.getElementById('storm-hazard-overlay')!;
    this.floatingTextContainer = document.getElementById('floating-text-container')!;

    this.inventoryModal = document.getElementById('inventory-modal')!;
    this.questModal = document.getElementById('quest-modal')!;
    this.helpModal = document.getElementById('help-modal')!;
    this.dialogueModal = document.getElementById('dialogue-modal')!;

    this.initHotbarUI();
    this.setupModalListeners();
    this.setupCallbacks();
  }

  private initHotbarUI(): void {
    const container = document.getElementById('hotbar-container')!;
    container.innerHTML = '';
    this.hotbarSlots = [];

    for (let i = 0; i < 9; i++) {
      const slotEl = document.createElement('div');
      slotEl.className = `hotbar-slot ${i === 0 ? 'active' : ''}`;
      slotEl.dataset.slotIndex = `${i}`;

      const numEl = document.createElement('span');
      numEl.className = 'slot-number';
      numEl.textContent = `${i + 1}`;

      const iconEl = document.createElement('div');
      iconEl.className = 'slot-icon';

      const countEl = document.createElement('span');
      countEl.className = 'slot-count';

      slotEl.appendChild(numEl);
      slotEl.appendChild(iconEl);
      slotEl.appendChild(countEl);

      slotEl.addEventListener('click', () => {
        this.player.inventory.selectedHotbarSlot = i;
        this.updateHotbarSelection();
      });

      container.appendChild(slotEl);
      this.hotbarSlots.push(slotEl);
    }
  }

  private setupModalListeners(): void {
    // Inventory close
    document.getElementById('inventory-close-btn')?.addEventListener('click', () => {
      this.toggleInventory(false);
    });

    // Quest close
    document.getElementById('quest-close-btn')?.addEventListener('click', () => {
      this.toggleQuestModal(false);
    });

    // Help close
    document.getElementById('help-close-btn')?.addEventListener('click', () => {
      this.toggleHelpModal(false);
    });

    // Dialogue close
    document.getElementById('dialogue-close-btn')?.addEventListener('click', () => {
      this.toggleDialogue(false);
    });

    // Mode Toggle
    this.modeToggleBtn.addEventListener('click', () => {
      this.toggleGameMode();
    });
  }

  private setupCallbacks(): void {
    this.player.skills.onXpGained = (skill, amount) => {
      this.activeSkillTracked = skill;
      this.spawnFloatingText(`+${amount} ${skill.toUpperCase()} XP`, '#facc15');
    };

    this.player.skills.onLevelUp = (skill, newLevel) => {
      this.player.sound.playLevelUp();
      this.spawnNotification(`🎉 LEVEL UP! ${skill.toUpperCase()} is now Level ${newLevel}!`);
    };

    this.questManager.onQuestCompleted = (quest) => {
      this.spawnNotification(`✨ QUEST COMPLETE: ${quest.title}!`);
    };
  }

  public update(): void {
    // Health & Stamina
    const hpPct = (this.player.health / this.player.maxHealth) * 100;
    this.hpBarFill.style.width = `${hpPct}%`;
    this.hpText.textContent = `${Math.ceil(this.player.health)} / ${this.player.maxHealth}`;

    const stamPct = (this.player.stamina / this.player.maxStamina) * 100;
    this.staminaBarFill.style.width = `${stamPct}%`;

    // Skills & XP
    const skillData = this.player.skills.skills[this.activeSkillTracked];
    const progress = this.player.skills.getProgressPercentage(this.activeSkillTracked);
    this.xpBarFill.style.width = `${progress}%`;
    this.xpText.textContent = `${this.activeSkillTracked.toUpperCase()} Lv.${skillData.level} (${Math.floor(progress)}%)`;
    this.combatLvlText.textContent = `Combat Lv. ${this.player.skills.getTotalCombatLevel()}`;

    // Hotbar slots update
    this.updateHotbarItems();
    this.updateHotbarSelection();

    // Active Quest Tracker
    const quest = this.questManager.getActiveQuest();
    if (quest) {
      this.questTitle.textContent = quest.title;
      this.questObjectives.innerHTML = quest.objectives
        .map(
          (o) => `
          <div class="quest-objective-item ${o.completed ? 'done' : ''}">
            <span class="check">${o.completed ? '✓' : '○'}</span>
            <span>${o.description} (${o.current}/${o.required})</span>
          </div>
        `
        )
        .join('');
    }

    // Battle Royale status
    if (this.brManager.isActive) {
      this.brStatusWidget.classList.remove('hidden');
      this.modeToggleBtn.textContent = 'MODE: BATTLE ROYALE';
      this.modeToggleBtn.classList.add('br-active');

      const sec = Math.max(0, Math.ceil(this.brManager.phaseTimer));
      this.brTimerText.textContent = `Zone Phase ${this.brManager.currentPhaseIndex + 1}: ${sec}s`;
      this.brAliveText.textContent = `Alive: ${this.brManager.playersRemaining}`;
    } else {
      this.brStatusWidget.classList.add('hidden');
      this.modeToggleBtn.textContent = 'MODE: MMORPG OPEN WORLD';
      this.modeToggleBtn.classList.remove('br-active');
    }
  }

  public setStormHazard(inStorm: boolean): void {
    if (inStorm) {
      this.stormHazardOverlay.classList.remove('hidden');
    } else {
      this.stormHazardOverlay.classList.add('hidden');
    }
  }

  private updateHotbarSelection(): void {
    const sel = this.player.inventory.selectedHotbarSlot;
    this.hotbarSlots.forEach((slot, idx) => {
      if (idx === sel) {
        slot.classList.add('active');
      } else {
        slot.classList.remove('active');
      }
    });
  }

  private updateHotbarItems(): void {
    this.player.inventory.hotbar.forEach((slot, idx) => {
      const slotEl = this.hotbarSlots[idx];
      const iconEl = slotEl.querySelector('.slot-icon') as HTMLElement;
      const countEl = slotEl.querySelector('.slot-count') as HTMLElement;

      if (slot) {
        const def = ITEM_REGISTRY[slot.id];
        if (def) {
          iconEl.style.backgroundColor = def.iconColor;
          iconEl.title = `${def.name}: ${def.description}`;
          countEl.textContent = slot.count > 1 ? `${slot.count}` : '';
        }
      } else {
        iconEl.style.backgroundColor = 'transparent';
        countEl.textContent = '';
      }
    });
  }

  public toggleInventory(force?: boolean): void {
    const show = force !== undefined ? force : this.inventoryModal.classList.contains('hidden');
    if (show) {
      this.renderInventoryGrid();
      this.inventoryModal.classList.remove('hidden');
    } else {
      this.inventoryModal.classList.add('hidden');
    }
  }

  private renderInventoryGrid(): void {
    const grid = document.getElementById('inventory-grid')!;
    grid.innerHTML = '';

    this.player.inventory.slots.forEach((item, idx) => {
      const cell = document.createElement('div');
      cell.className = 'inv-cell';

      if (item) {
        const def = ITEM_REGISTRY[item.id];
        cell.style.backgroundColor = 'rgba(255,255,255,0.06)';
        cell.innerHTML = `
          <div class="inv-item-icon" style="background:${def.iconColor}"></div>
          <span class="inv-count">${item.count > 1 ? item.count : ''}</span>
          <div class="inv-tooltip">
            <strong>${def.name}</strong><br/>
            ${def.description}
          </div>
        `;

        cell.addEventListener('click', () => {
          if (def.category === 'consumable' && def.healAmount) {
            this.player.heal(def.healAmount);
            this.player.inventory.removeItem(item.id, 1);
            this.renderInventoryGrid();
          }
        });
      }

      grid.appendChild(cell);
    });
  }

  public toggleQuestModal(force?: boolean): void {
    const show = force !== undefined ? force : this.questModal.classList.contains('hidden');
    if (show) {
      this.renderQuestList();
      this.questModal.classList.remove('hidden');
    } else {
      this.questModal.classList.add('hidden');
    }
  }

  private renderQuestList(): void {
    const list = document.getElementById('quest-modal-list')!;
    list.innerHTML = '';

    for (const quest of this.questManager.quests.values()) {
      const item = document.createElement('div');
      item.className = `quest-entry ${quest.isCompleted ? 'completed' : ''}`;
      item.innerHTML = `
        <div class="quest-header">
          <h3>${quest.title} ${quest.isCompleted ? '<span class="tag-done">COMPLETED</span>' : ''}</h3>
          <span class="quest-cat">${quest.category.toUpperCase()}</span>
        </div>
        <p class="quest-desc">${quest.summary}</p>
        <div class="quest-objectives-box">
          ${quest.objectives
            .map(
              (o) => `
            <div class="quest-obj ${o.completed ? 'checked' : ''}">
              ${o.completed ? '✓' : '○'} ${o.description} (${o.current}/${o.required})
            </div>
          `
            )
            .join('')}
        </div>
      `;

      item.addEventListener('click', () => {
        this.questManager.activeQuestId = quest.id;
        this.renderQuestList();
      });

      list.appendChild(item);
    }
  }

  public toggleHelpModal(force?: boolean): void {
    const show = force !== undefined ? force : this.helpModal.classList.contains('hidden');
    if (show) {
      this.helpModal.classList.remove('hidden');
    } else {
      this.helpModal.classList.add('hidden');
    }
  }

  public showDialogue(speaker: string, lines: string[]): void {
    const speakerEl = document.getElementById('dialogue-speaker')!;
    const contentEl = document.getElementById('dialogue-content')!;
    speakerEl.textContent = speaker;
    contentEl.innerHTML = lines.map((l) => `<p>${l}</p>`).join('');
    this.dialogueModal.classList.remove('hidden');
  }

  public toggleDialogue(force?: boolean): void {
    const show = force !== undefined ? force : this.dialogueModal.classList.contains('hidden');
    if (show) {
      this.dialogueModal.classList.remove('hidden');
    } else {
      this.dialogueModal.classList.add('hidden');
    }
  }

  public toggleGameMode(): void {
    if (this.brManager.isActive) {
      this.brManager.deactivate();
      this.spawnNotification('🛡️ Switched to MMORPG Open World Mode.');
    } else {
      this.brManager.activate();
      this.questManager.reportProgress('open_chest', 0); // Activate quest trigger
    }
  }

  public spawnFloatingText(text: string, color: string = '#ffffff'): void {
    const el = document.createElement('div');
    el.className = 'floating-popup';
    el.textContent = text;
    el.style.color = color;
    el.style.left = `${50 + (Math.random() - 0.5) * 10}%`;
    el.style.top = `${45 + (Math.random() - 0.5) * 8}%`;

    this.floatingTextContainer.appendChild(el);
    setTimeout(() => {
      el.remove();
    }, 1200);
  }

  public spawnNotification(text: string): void {
    const banner = document.getElementById('notification-banner')!;
    banner.textContent = text;
    banner.classList.remove('hidden');
    setTimeout(() => {
      banner.classList.add('hidden');
    }, 4500);
  }
}
