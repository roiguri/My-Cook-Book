class ImageCarousel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.currentIndex = 0;
    this.autoplayInterval = 5000; // Default autoplay interval in milliseconds
  }

  connectedCallback() {
    this.render();
    this.initCarousel();
  }

  disconnectedCallback() {
    clearInterval(this.autoplayTimer);
  }

  static get observedAttributes() {
    return ['image-ratio', 'auto-rotate', 'images', 'border-radius'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'images' && newValue) {
      this.images = JSON.parse(newValue);
    }
    if (name === 'image-ratio' && newValue) {
      this.imageRatio = newValue;
    }
    if (name === 'auto-rotate' && newValue) {
      this.autoRotate = newValue !== 'false'; // Auto-rotate by default
    }
    if (name === 'border-radius' && newValue) {
      this.borderRadius = newValue;
      this.updateCarousel(); 
    }
    this.updateCarousel();
  }

  initCarousel() {
    this.carouselContainer = this.shadowRoot.querySelector('.image-carousel__container');
    this.carouselList = this.shadowRoot.querySelector('.image-carousel__list');
    this.dotsContainer = this.shadowRoot.querySelector('.image-carousel__dots');
    this.prevButton = this.shadowRoot.querySelector('.image-carousel__button--prev');
    this.nextButton = this.shadowRoot.querySelector('.image-carousel__button--next');

    this.prevButton.addEventListener('click', () => this.prevSlide());
    this.nextButton.addEventListener('click', () => this.nextSlide());

    this.updateCarousel();
    if (this.autoRotate) {
      this.startAutoplay();
    }
  }

  updateCarousel() {
    if (!this.carouselList || !this.images) return;

    this.carouselList.innerHTML = '';
    this.dotsContainer.innerHTML = '';

    this.images.forEach((imageUrl, index) => {
      const listItem = document.createElement('li');
      listItem.classList.add('image-carousel__item');
      const img = document.createElement('img');
      img.src = imageUrl;
      img.alt = `Image ${index + 1}`;
      img.classList.add('image-carousel__image');
      listItem.appendChild(img);
      this.carouselList.appendChild(listItem);

      const dot = document.createElement('div');
      dot.classList.add('image-carousel__dot');
      dot.addEventListener('click', () => this.goToSlide(index));
      this.dotsContainer.appendChild(dot);
    });

    // Apply border-radius to the carousel container
    this.carouselContainer.style.borderRadius = this.borderRadius;
    this.carouselContainer.style.overflow = 'hidden'; 

    this.goToSlide(this.currentIndex);
  }

  goToSlide(index) {
    this.currentIndex = index;
    const translateX = -index * 100 + '%';
    this.carouselList.style.transform = `translateX(${translateX})`;

    // Update active dot
    const dots = this.dotsContainer.querySelectorAll('.image-carousel__dot');
    dots.forEach((dot, i) => {
      dot.classList.toggle('image-carousel__dot--active', i === index);
    });
  }

  nextSlide() {
    this.goToSlide((this.currentIndex + 1) % this.images.length);
  }

  prevSlide() {
    this.goToSlide((this.currentIndex - 1 + this.images.length) % this.images.length);
  }

  startAutoplay() {
    clearInterval(this.autoplayTimer);
    this.autoplayTimer = setInterval(() => {
      this.nextSlide();
    }, this.autoplayInterval);
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        .image-carousel__container {
          position: relative;
          width: 100%;
          overflow: hidden;
        }

        .image-carousel__list {
          display: flex;
          transition: transform 0.5s ease-in-out;
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .image-carousel__item {
          flex-shrink: 0;
          width: 100%;
        }

        .image-carousel__image {
          width: 100%;
          display: block;
        }

        .image-carousel__dots {
          position: absolute;
          bottom: 10px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 5px;
        }

        .image-carousel__dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #ccc;
          cursor: pointer;
        }

        .image-carousel__dot--active {
          background-color: #333;
        }

        .image-carousel__button {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(0, 0, 0, 0.5);
          color: white;
          padding: 10px;
          border: none;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .image-carousel__button--prev {
          left: 10px;
        }

        .image-carousel__button--next {
          right: 10px;
        }

        .image-carousel__container:hover .image-carousel__button {
          opacity: 1;
        }

        /* Responsive Styles */
        @media (max-width: 768px) {
          .image-carousel__button {
            opacity: 1; /* Show buttons on mobile */
          }
        }
      </style>
      <div class="image-carousel__container">
        <ul class="image-carousel__list"></ul>
        <div class="image-carousel__dots"></div>
        <button class="image-carousel__button image-carousel__button--prev">&lt;</button>
        <button class="image-carousel__button image-carousel__button--next">&gt;</button>
      </div>
    `;
  }
}

customElements.define('image-carousel', ImageCarousel);