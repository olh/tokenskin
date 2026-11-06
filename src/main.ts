import './style.css';
import { Engine } from './core/Engine';

let engineInstance: Engine | null = null;

export function initGame(): Engine {
  if (engineInstance) return engineInstance;
  try {
    engineInstance = new Engine();
    (window as unknown as { __tokenSkinEngine: Engine }).__tokenSkinEngine = engineInstance;
    console.log('✅ Token Skin Engine initialized successfully!');
  } catch (err) {
    console.error('❌ Failed to initialize Token Skin Engine:', err);
  }
  return engineInstance!;
}

// Global start trigger callable directly from UI click handlers
(window as unknown as { __startTokenSkin: () => void }).__startTokenSkin = () => {
  const engine = initGame();
  if (engine && engine.input) {
    engine.input.requestLock();
  }
};

// Ensure Engine boots immediately whether DOMContentLoaded fired or is pending
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initGame());
} else {
  initGame();
}

// Support auto-start and preview modes via URL query params for automated screenshots and preview
const params = new URLSearchParams(window.location.search);
if (params.has('autostart')) {
  setTimeout(() => {
    (window as unknown as { __startTokenSkin: () => void }).__startTokenSkin();
    if (params.get('mode') === 'br') {
      engineInstance?.brManager.activate();
    }
    if (params.has('thirdperson')) {
      engineInstance?.player.toggleCamera();
    }
    if (params.has('inventory')) {
      engineInstance?.hud.toggleInventory(true);
    }
    if (params.has('quests')) {
      engineInstance?.hud.toggleQuestModal(true);
    }
  }, 400);
}
