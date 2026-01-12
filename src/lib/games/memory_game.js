export class CookingMemoryGame {
  constructor(container, config = {}) {
    this.container = container;
    this.config = Object.assign({ rows: 4 }, config); // Default 4 rows
    this.allEmojis = ['🍕', '🍔', '🍟', '🍳', '🥦', '🥕', '🥩', '🍞']; // 8 pairs
    this.emojis = [];
    this.flippedCards = [];
    this.matchedPairs = 0;
    this.isLocked = false;
  }

  start() {
    this.matchedPairs = 0;
    this.flippedCards = [];
    this.isLocked = false;
    this.render();
  }

  shuffle(array) {
    // Duplicate and Shuffle
    const deck = [...array, ...array];
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

  render() {
    this.container.innerHTML = '';

    // Calculate needed pairs based on rows (4 columns fixed)
    const totalCards = this.config.rows * 4;
    const totalPairs = totalCards / 2;

    // Select subset of emojis
    const selectedEmojis = this.allEmojis.slice(0, totalPairs);
    this.emojis = selectedEmojis;

    const deck = this.shuffle(selectedEmojis);

    const gameBoard = document.createElement('div');
    gameBoard.className = 'memory-game-board';

    // Adjust grid rows
    gameBoard.style.gridTemplateRows = `repeat(${this.config.rows}, 1fr)`;

    deck.forEach((emoji) => {
      const card = document.createElement('div');
      card.className = 'memory-card';
      // ... same card creation ...
      card.dataset.emoji = emoji;

      const front = document.createElement('div');
      front.className = 'memory-card-front';
      front.textContent = emoji;

      const back = document.createElement('div');
      back.className = 'memory-card-back';
      back.textContent = '👨‍🍳';

      card.appendChild(front);
      card.appendChild(back);

      card.addEventListener('click', () => this.flipCard(card));
      gameBoard.appendChild(card);
    });

    this.container.appendChild(gameBoard);
  }

  flipCard(card) {
    if (this.config.onInteraction) {
      this.config.onInteraction();
      // Only trigger once
      this.config.onInteraction = null;
    }

    if (this.isLocked) return;
    if (card === this.flippedCards[0]) return; // Clicked same card
    if (card.classList.contains('flipped')) return; // Already matched or flipped

    card.classList.add('flipped');
    this.flippedCards.push(card);

    if (this.flippedCards.length === 2) {
      this.checkMatch();
    }
  }

  checkMatch() {
    this.isLocked = true;
    const [card1, card2] = this.flippedCards;
    const match = card1.dataset.emoji === card2.dataset.emoji;

    if (match) {
      this.disableCards();
    } else {
      this.unflipCards();
    }
  }

  disableCards() {
    this.flippedCards.forEach((card) => {
      card.removeEventListener('click', this.flipCard);
      card.classList.add('matched');
    });
    this.resetBoard();
    this.matchedPairs++;
    if (this.matchedPairs === this.emojis.length) {
      if (this.config.onComplete) {
        setTimeout(() => this.config.onComplete(), 500);
      }
    }
  }

  unflipCards() {
    setTimeout(() => {
      this.flippedCards.forEach((card) => card.classList.remove('flipped'));
      this.resetBoard();
    }, 1000);
  }

  resetBoard() {
    [this.flippedCards, this.isLocked] = [[], false];
  }

  destroy() {
    this.container.innerHTML = '';
  }
}
