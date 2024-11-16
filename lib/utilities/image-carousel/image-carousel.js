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

  async updateCarousel() {
    if (!this.carouselList || !this.images) return;

    this.carouselList.innerHTML = '';
    this.dotsContainer.innerHTML = '';

    // Process all images (could be URLs or Firebase paths)
    const processedImages = await Promise.all(
        this.images.map(async (image, index) => {
            const listItem = document.createElement('li');
            listItem.classList.add('image-carousel__item');
            const img = document.createElement('img');
            
            // Check if the image is a Firebase path
            if (typeof image === 'string' && image.startsWith('img/recipes/')) {
                try {
                    const storage = firebase.storage();
                    const imageRef = storage.ref(image);
                    img.src = await imageRef.getDownloadURL();
                } catch (error) {
                    console.error('Error loading Firebase image:', error);
                    // Fallback to placeholder if Firebase image fails
                    const placeholderRef = storage.ref('img/recipes/compressed/place-holder-add-new.png');
                    img.src = await placeholderRef.getDownloadURL();
                }
            } else {
                // Handle as direct URL or local path
                img.src = image;
            }

            img.alt = `Image ${index + 1}`;
            img.classList.add('image-carousel__image');
            listItem.appendChild(img);
            this.carouselList.appendChild(listItem);

            const dot = document.createElement('div');
            dot.classList.add('image-carousel__dot');
            dot.addEventListener('click', () => this.goToSlide(index));
            this.dotsContainer.appendChild(dot);
        })
    );

    // Apply border-radius if specified
    if (this.borderRadius) {
        this.carouselContainer.style.borderRadius = this.borderRadius;
        this.carouselContainer.style.overflow = 'hidden';
    }

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
          height: 100%;
        }

        /* RTL specific styles */
        [dir="rtl"] .image-carousel__list {
            flex-direction: row-reverse;
        }

        .image-carousel__item {
          flex-shrink: 0;
          width: 100%;
          display: flex;          
          justify-content: center; 
          align-items: center;     
        }

        .image-carousel__image {
          width: auto;           
          height: auto;          
          max-width: 100%;       
          max-height: 100%;      
          object-fit: contain; 
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
          background-color: white;
          cursor: pointer;
        }

        .image-carousel__dot--active {
          background-color: var(--primary-color);
        }

        .image-carousel__button {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background-color: var(--primary-color, #3498db);
          color: white;
          width: 30px;          
          height: 30px;         
          border-radius: 50%;
          cursor: pointer;
          opacity: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
          border: 2px solid white;
          font-size: 14px;      
          transition: transform 0.2s ease, background-color 0.2s ease, opacity 0.3s ease;
          z-index: 10;
        }

        .image-carousel__button:hover {
          background-color: var(--primary-dark, #2980b9);
          transform: translateY(-50%) scale(1.1);
        }

        .image-carousel__button:active {
          transform: translateY(-50%) scale(0.95);
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


            
        .image-carousel__item {
          position: relative;
      }
      
      .image-carousel__item.loading::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #f0f0f0;
          animation: pulse 1.5s infinite;
      }
      
      @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 0.8; }
          100% { opacity: 0.6; }
      }

        /* Responsive Styles */
        @media (max-width: 768px) {
          .image-carousel__button {
            opacity: 1; /* Show buttons on mobile */
          }
        }
      </style>
      <div class="image-carousel__container" dir="rtl">
        <ul class="image-carousel__list"></ul>
        <div class="image-carousel__dots"></div>
        <button class="image-carousel__button image-carousel__button--prev">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <button class="image-carousel__button image-carousel__button--next">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>
    `;
  }
}

customElements.define('image-carousel', ImageCarousel);