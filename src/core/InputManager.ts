export class InputManager {
  public keys: Record<string, boolean> = {};
  public isPointerLocked: boolean = false;
  public hasStarted: boolean = false;
  public isMouseDown: boolean = false;
  public mouseSensitivity: number = 0.0022;

  public onLeftClick?: () => void;
  public onRightClick?: () => void;
  public onCameraToggle?: () => void;
  public onInventoryToggle?: () => void;
  public onQuestToggle?: () => void;
  public onHelpToggle?: () => void;
  public onBattleRoyaleToggle?: () => void;
  public onHotbarSelect?: (slotIndex: number) => void;
  public onLook?: (deltaYaw: number, deltaPitch: number) => void;

  private canvas: HTMLCanvasElement;
  private lastMouseX: number = 0;
  private lastMouseY: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.setupListeners();
  }

  public requestLock(): void {
    this.hasStarted = true;
    const blocker = document.getElementById('click-to-play-overlay');
    if (blocker) {
      blocker.classList.add('hidden');
      blocker.style.display = 'none';
    }

    try {
      const promise = this.canvas.requestPointerLock();
      if (promise && 'catch' in promise) {
        promise.catch(() => {
          // Pointer lock rejected or not supported, fallback to drag-to-look
        });
      }
    } catch {
      // Ignored
    }
  }

  private setupListeners(): void {
    // Explicit click listeners on the start overlay & button
    const overlay = document.getElementById('click-to-play-overlay');
    const playBtn = document.getElementById('start-play-btn') || overlay?.querySelector('.play-btn');

    if (overlay) {
      overlay.addEventListener('click', () => this.requestLock());
    }
    if (playBtn) {
      playBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.requestLock();
      });
    }

    // Keyboard down
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      // Handle one-shot hotkeys
      if (e.code === 'KeyV') {
        this.onCameraToggle?.();
      } else if (e.code === 'KeyE') {
        this.onInventoryToggle?.();
      } else if (e.code === 'KeyQ') {
        this.onQuestToggle?.();
      } else if (e.code === 'KeyH') {
        this.onHelpToggle?.();
      } else if (e.code === 'KeyB') {
        this.onBattleRoyaleToggle?.();
      } else if (e.code >= 'Digit1' && e.code <= 'Digit9') {
        const slot = parseInt(e.code.replace('Digit', ''), 10) - 1;
        this.onHotbarSelect?.(slot);
      }
    });

    // Keyboard up
    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Pointer Lock Request on Canvas Click
    this.canvas.addEventListener('click', () => {
      if (!this.isPointerLocked) {
        this.requestLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === this.canvas;
      const blocker = document.getElementById('click-to-play-overlay');
      if (blocker) {
        if (this.isPointerLocked || this.hasStarted) {
          blocker.classList.add('hidden');
          blocker.style.display = 'none';
        }
      }
    });

    // Mouse Movement
    document.addEventListener('mousemove', (e) => {
      if (this.isPointerLocked) {
        const deltaYaw = -e.movementX * this.mouseSensitivity;
        const deltaPitch = -e.movementY * this.mouseSensitivity;
        this.onLook?.(deltaYaw, deltaPitch);
      } else if (this.isMouseDown && this.hasStarted) {
        // Fallback drag-to-look when pointer lock is released or unsupported
        const dx = e.clientX - this.lastMouseX;
        const dy = e.clientY - this.lastMouseY;
        this.onLook?.(-dx * this.mouseSensitivity, -dy * this.mouseSensitivity);
      }
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });

    // Mouse Clicks
    this.canvas.addEventListener('mousedown', (e) => {
      this.isMouseDown = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;

      if (!this.isPointerLocked && !this.hasStarted) {
        this.requestLock();
        return;
      }

      if (e.button === 0) {
        this.onLeftClick?.();
      } else if (e.button === 2) {
        this.onRightClick?.();
      }
    });

    window.addEventListener('mouseup', () => {
      this.isMouseDown = false;
    });

    // Prevent context menu
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // Mouse Wheel for Hotbar
    window.addEventListener('wheel', (e) => {
      const dir = Math.sign(e.deltaY);
      this.onHotbarSelect?.(dir);
    });
  }

  public getMovementInput() {
    return {
      forward: !!(this.keys['KeyW'] || this.keys['ArrowUp']),
      backward: !!(this.keys['KeyS'] || this.keys['ArrowDown']),
      left: !!(this.keys['KeyA'] || this.keys['ArrowLeft']),
      right: !!(this.keys['KeyD'] || this.keys['ArrowRight']),
      jump: !!this.keys['Space'],
      sprint: !!(this.keys['ShiftLeft'] || this.keys['ShiftRight'])
    };
  }
}
