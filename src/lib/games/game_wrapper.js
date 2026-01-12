export class GameWrapper {
  constructor(container, GameClass, config = {}) {
    this.container = container;
    this.GameClass = GameClass;
    this.config = config;
    this.game = null;
    this.startTime = null;
    this.timerInterval = null;
    this.hasStarted = false;
  }

  init() {
    this.renderWrapper();
    const gameContainer = this.container.querySelector('.game-content');

    this.game = new this.GameClass(gameContainer, {
      ...this.config,
      onInteraction: () => this.startTimer(),
      onComplete: () => this.onGameComplete(),
    });

    this.game.start();
  }

  renderWrapper() {
    this.container.innerHTML = `
      <div class="game-wrapper">
        <div class="game-header">
          <div class="timer">⏱️ <span id="game-timer">00:00</span></div>
        </div>
        <div class="game-content"></div>
        <div class="game-success-overlay" style="display: none;">
          <div class="success-content">
            <div class="success-icon">🏆</div>
            <h3>כל הכבוד!</h3>
            <p>סיימת את המשחק בזמן:</p>
            <div class="final-time">00:00</div>
          </div>
        </div>
      </div>
    `;
  }

  startTimer() {
    if (this.hasStarted) return;
    this.hasStarted = true;
    this.startTime = Date.now();

    this.timerInterval = setInterval(() => {
      const elapsed = Date.now() - this.startTime;
      this.updateTimerDisplay(elapsed);
    }, 1000);
  }

  updateTimerDisplay(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    const timeString = `${minutes}:${seconds}`;

    const timerDisplay = this.container.querySelector('#game-timer');
    if (timerDisplay) timerDisplay.textContent = timeString;
    return timeString;
  }

  onGameComplete() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    const elapsed = Date.now() - this.startTime;
    const finalTimeString = this.updateTimerDisplay(elapsed);

    const overlay = this.container.querySelector('.game-success-overlay');
    const finalTimeDisplay = this.container.querySelector('.final-time');

    if (overlay && finalTimeDisplay) {
      finalTimeDisplay.textContent = finalTimeString;
      overlay.style.display = 'flex';
      setTimeout(() => overlay.classList.add('show'), 10);
    }
  }

  destroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    if (this.game && typeof this.game.destroy === 'function') {
      this.game.destroy();
    }
    this.container.innerHTML = '';
  }
}
