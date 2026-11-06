import './style.css';
import { Engine } from './core/Engine';

window.addEventListener('DOMContentLoaded', () => {
  // Initialize Token Skin Voxel MMORPG & Battle Royale Engine
  const engine = new Engine();
  (window as unknown as { __tokenSkinEngine: Engine }).__tokenSkinEngine = engine;
});
