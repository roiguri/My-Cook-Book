import styles from './burger_stacker.css?inline';

export class BurgerStackerGame {
  constructor(container, config = {}) {
    this.container = container;
    this.config = Object.assign(
      {
        speed: 3,
        spawnRate: 1200,
        onComplete: null,
      },
      config,
    );

    this.targetIngredients = ['patty', 'cheese', 'lettuce', 'tomato', 'bun-top'];

    this.isRunning = false;
    this.items = [];
    this.stack = [];
    this.gameLoopId = null;
    this.spawnerId = null;
    this.catcherX = 50;
    this.catcherSpeed = 1.0;

    this.keys = { ArrowLeft: false, ArrowRight: false };

    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartPercent = 0;

    this.boundHandleKey = this.handleKey.bind(this);
    this.boundHandleTouch = this.handleTouch.bind(this);
    this.boundHandleTouchStart = this.handleTouchStart.bind(this);
    this.boundHandleTouchEnd = this.handleTouchEnd.bind(this);
  }

  start() {
    this.isRunning = true;
    this.stack = ['bun-bottom'];
    this.render();
    this.setupInputs();
    this.startGameLoop();
    this.startSpawner();

    if (this.config.onInteraction) {
      this.config.onInteraction();
    }
  }

  render() {
    this.container.innerHTML = `
      <style>${styles}</style>
      <div class="burger-game-container" id="game-area">
        <div class="recipe-sidebar" id="recipe-sidebar"></div>
        <div class="catcher" id="catcher" style="left: 50%;">
           <div class="ingredient-art bun-bottom"></div>
        </div>
      </div>
    `;
    this.gameArea = this.container.querySelector('#game-area');
    this.catcher = this.container.querySelector('#catcher');
    this.sidebar = this.container.querySelector('#recipe-sidebar');

    this.targetIngredients.forEach((type) => {
      const icon = document.createElement('div');
      icon.className = `recipe-item icon-${type}`;
      icon.dataset.type = type;
      this.sidebar.appendChild(icon);
    });
  }

  setupInputs() {
    window.addEventListener('keydown', this.boundHandleKey);
    window.addEventListener('keyup', this.boundHandleKey);

    this.gameArea.addEventListener('touchstart', this.boundHandleTouchStart, { passive: false });
    this.gameArea.addEventListener('touchmove', this.boundHandleTouch, { passive: false });
    this.gameArea.addEventListener('touchend', this.boundHandleTouchEnd);
  }

  handleKey(e) {
    if (e.repeat) return;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      this.keys[e.key] = e.type === 'keydown';
    }
  }

  handleTouchStart(e) {
    if (e.cancelable) e.preventDefault();
    const touch = e.touches[0];
    this.isDragging = true;
    this.dragStartX = touch.clientX;
    this.dragStartPercent = this.catcherX;
  }

  handleTouch(e) {
    if (!this.isDragging) return;
    if (e.cancelable) e.preventDefault();

    const touch = e.touches[0];
    const rect = this.gameArea.getBoundingClientRect();

    const deltaX = touch.clientX - this.dragStartX;
    const deltaPercent = (deltaX / rect.width) * 100;

    this.catcherX = Math.max(10, Math.min(90, this.dragStartPercent + deltaPercent));
    this.catcher.style.left = `${this.catcherX}%`;
  }

  handleTouchEnd(e) {
    this.isDragging = false;
  }

  startGameLoop() {
    const loop = () => {
      if (!this.isRunning) return;
      this.update();
      this.gameLoopId = requestAnimationFrame(loop);
    };
    this.gameLoopId = requestAnimationFrame(loop);
  }

  startSpawner() {
    this.spawnerId = setInterval(() => {
      if (!this.isRunning) return;
      this.spawnItem();
    }, this.config.spawnRate);
  }

  spawnItem() {
    const nextIndex = this.stack.length - 1;
    const nextNeeded = this.targetIngredients[nextIndex];

    const rand = Math.random();
    let type;

    if (rand < 0.15) {
      type = 'bad';
    } else if (nextNeeded && rand < 0.75) {
      type = nextNeeded;
    } else {
      const opts = ['patty', 'cheese', 'lettuce', 'tomato', 'bun-top'];
      const distractions = opts.filter((o) => o !== nextNeeded);
      type = distractions[Math.floor(Math.random() * distractions.length)];
    }

    const item = document.createElement('div');
    item.className = 'falling-item';

    if (type === 'bad') {
      item.innerHTML = '<div class="bad-item"></div>';
      item.dataset.type = 'bad';
    } else {
      item.innerHTML = `<div class="ingredient-art ${type}"></div>`;
      item.dataset.type = type;
    }

    const randomX = 10 + Math.random() * 80;
    item.style.left = `${randomX}%`;
    item.style.top = '-60px';

    this.gameArea.appendChild(item);
    this.items.push({
      element: item,
      y: -60,
      speed: 2.5 + Math.random() * 2,
      type: type,
    });
  }

  update() {
    if (this.keys.ArrowLeft) this.catcherX = Math.max(10, this.catcherX - this.catcherSpeed);
    if (this.keys.ArrowRight) this.catcherX = Math.min(90, this.catcherX + this.catcherSpeed);
    this.catcher.style.left = `${this.catcherX}%`;

    const catcherRect = this.catcher.getBoundingClientRect();
    const removeIndices = [];

    this.items.forEach((item, index) => {
      item.y += item.speed;
      item.element.style.top = `${item.y}px`;

      const itemRect = item.element.getBoundingClientRect();

      const horizontalHit =
        itemRect.right > catcherRect.left + 10 && itemRect.left < catcherRect.right - 10;

      const verticalHit =
        itemRect.bottom >= catcherRect.top && itemRect.bottom <= catcherRect.top + 30;

      if (horizontalHit && verticalHit) {
        this.handleCatch(item, index);
        removeIndices.push(index);
      } else if (item.y > 600) {
        item.element.remove();
        removeIndices.push(index);
      }
    });

    for (let i = removeIndices.length - 1; i >= 0; i--) {
      this.items.splice(removeIndices[i], 1);
    }
  }

  handleCatch(item, index) {
    item.element.remove();
    const type = item.type;

    if (type === 'bad') {
      this.gameOver('אוי לא! תפסת נעל!');
      return;
    }

    const nextIndex = this.stack.length - 1;
    const expected = this.targetIngredients[nextIndex];

    if (type !== expected) {
      if (this.stack.includes(type)) {
        this.gameOver('שמת את המרכיב הזה כבר! ההמבורגר נהרס.');
      } else {
        this.gameOver(`סדר לא נכון! היית צריך לתפוס ${this.getHebrewName(expected)}`);
      }
      return;
    }

    this.addIngredientToStack(type);

    if (type === 'bun-top') {
      this.gameWin();
    }
  }

  getHebrewName(type) {
    const map = {
      patty: 'קציצה',
      cheese: 'גבינה',
      lettuce: 'חסה',
      tomato: 'עגבניה',
      'bun-top': 'לחמניה עליונה',
    };
    return map[type] || type;
  }

  addIngredientToStack(type) {
    this.stack.push(type);

    const div = document.createElement('div');
    div.className = `ingredient-art ${type}`;
    this.catcher.appendChild(div);

    const sidebarItem = this.sidebar.querySelector(`.icon-${type}`);
    if (sidebarItem) {
      sidebarItem.classList.add('caught');
    }
  }

  gameOver(reason) {
    this.stopGame();
    if (this.config.onGameOver) {
      this.config.onGameOver(reason);
    }
  }

  gameWin() {
    this.isRunning = false;
    if (this.config.onComplete) {
      this.config.onComplete();
    }
  }

  stopGame() {
    this.isRunning = false;
    window.removeEventListener('keydown', this.boundHandleKey);
    window.removeEventListener('keyup', this.boundHandleKey);
    this.gameArea.removeEventListener('touchstart', this.boundHandleTouchStart);
    this.gameArea.removeEventListener('touchmove', this.boundHandleTouch);
    this.gameArea.removeEventListener('touchend', this.boundHandleTouchEnd);

    if (this.gameLoopId) cancelAnimationFrame(this.gameLoopId);
    if (this.spawnerId) clearInterval(this.spawnerId);
  }

  destroy() {
    this.stopGame();
    this.container.innerHTML = '';
  }
}
