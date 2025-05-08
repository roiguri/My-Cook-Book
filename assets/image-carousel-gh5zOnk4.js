import{a as d}from"./sw-register-nWNmA_5D.js";import{S as c,g as m,f as l,c as _,l as g,b as h,k as u}from"./recipe-image-utils-BxyJQeAp.js";import{f as y,s as R}from"./recipe-ingredients-utils-z11E7uy4.js";class f extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"}),this.currentIndex=0,this.autoplayInterval=5e3}connectedCallback(){this.render(),this.initCarousel()}disconnectedCallback(){clearInterval(this.autoplayTimer)}static get observedAttributes(){return["image-ratio","auto-rotate","images","border-radius"]}attributeChangedCallback(e,i,t){e==="images"&&t&&(this.images=JSON.parse(t)),e==="image-ratio"&&t&&(this.imageRatio=t),e==="auto-rotate"&&t&&(this.autoRotate=t!=="false"),e==="border-radius"&&t&&(this.borderRadius=t,this.updateCarousel()),this.updateCarousel()}initCarousel(){this.carouselContainer=this.shadowRoot.querySelector(".image-carousel__container"),this.carouselList=this.shadowRoot.querySelector(".image-carousel__list"),this.dotsContainer=this.shadowRoot.querySelector(".image-carousel__dots"),this.prevButton=this.shadowRoot.querySelector(".image-carousel__button--prev"),this.nextButton=this.shadowRoot.querySelector(".image-carousel__button--next"),this.prevButton.addEventListener("click",()=>this.prevSlide()),this.nextButton.addEventListener("click",()=>this.nextSlide()),this.updateCarousel(),this.autoRotate&&this.startAutoplay()}async updateCarousel(){!this.carouselList||!this.images||(this.carouselList.innerHTML="",this.dotsContainer.innerHTML="",await Promise.all(this.images.map(async(e,i)=>{const t=document.createElement("li");t.classList.add("image-carousel__item");const o=document.createElement("img");if(typeof e=="string"&&e.startsWith("img/recipes/"))try{o.src=await c.getFileUrl(e)}catch(s){console.error("Error loading Firebase image:",s);try{o.src=await c.getFileUrl("img/recipes/compressed/place-holder-add-new.png")}catch(a){console.error("Error loading placeholder image:",a),o.src=""}}else o.src=e;o.alt=`Image ${i+1}`,o.classList.add("image-carousel__image"),t.appendChild(o),this.carouselList.appendChild(t);const n=document.createElement("div");n.classList.add("image-carousel__dot"),n.addEventListener("click",()=>this.goToSlide(i)),this.dotsContainer.appendChild(n)})),this.borderRadius&&(this.carouselContainer.style.borderRadius=this.borderRadius,this.carouselContainer.style.overflow="hidden"),this.goToSlide(this.currentIndex))}goToSlide(e){this.currentIndex=e;const i=-e*100+"%";this.carouselList.style.transform=`translateX(${i})`,this.dotsContainer.querySelectorAll(".image-carousel__dot").forEach((o,n)=>{o.classList.toggle("image-carousel__dot--active",n===e)})}nextSlide(){this.goToSlide((this.currentIndex+1)%this.images.length)}prevSlide(){this.goToSlide((this.currentIndex-1+this.images.length)%this.images.length)}startAutoplay(){clearInterval(this.autoplayTimer),this.autoplayTimer=setInterval(()=>{this.nextSlide()},this.autoplayInterval)}render(){this.shadowRoot.innerHTML=`
      <style>
        .image-carousel__container {
          border-radius: 20px;  
          position: relative;
          width: 100%;
          padding-top: 100%; /* Aspect ratio */
          overflow: hidden;
          height: 0;
        }

        .image-carousel__wrapper {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
        }

        .image-carousel__list {
          position: absolute;
          top: 0;           
          left: 0;          
          width: 100%;      
          height: 100%; 
          display: flex;
          transition: transform 0.5s ease-in-out;
          list-style: none;
          padding: 0;
          margin: 0;
        }

        /* RTL specific styles */
        [dir="rtl"] .image-carousel__list {
            flex-direction: row-reverse;
        }

        .image-carousel__item {
          flex: 0 0 100%;
          height: 100%;
          display: flex;          
          justify-content: center; 
          align-items: center;  
          overflow: hidden;
          -webkit-mask-image: radial-gradient(circle at center, black 50%, transparent 75%);
          mask-image: radial-gradient(circle at center, black 50%, transparent 75%);
        }

        .image-carousel__image {
            width: 100%;
            height: 100%;    
            object-fit: contain;
            border-radius: 20px;
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
          width: 10px;
          height: 10px;
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
      <div class="image-carousel__container" dir="ltr">
        <div class="image-carousel__wrapper">
          <ul class="image-carousel__list"></ul>
          <div class="image-carousel__dots"></div>
          <button class="image-carousel__button image-carousel__button--prev">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" 
                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <button class="image-carousel__button image-carousel__button--next">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" 
                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      </div>
    `}}customElements.define("image-carousel",f);class b extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"}),this._originalIngredients=null}connectedCallback(){this.render(),this.recipeId=this.getAttribute("recipe-id"),this.fetchAndPopulateRecipeData()}render(){this.shadowRoot.innerHTML=`
      <style>${this.styles()}</style>
      <div dir="rtl" class="Recipe_component">
        <header class="recipe_component__header">
          <h1 id="Recipe_component__name" class="Recipe_component__title"></h1>
          <div class="Recipe_component__meta">
            <span id="Recipe_component__prepTime" class="Recipe_component__prepTime"></span>
            <span id="Recipe_component__waitTime" class="Recipe_component__waitTime"></span>
            <span id="Recipe_component__difficulty" class="Recipe_component__difficulty"></span>
            <span id="Recipe_component__category" class="Recipe_component__category"></span>
          </div>
        </header>
        <div class="Recipe_component__content">
          <div class="Recipe_component__details">
            <div class="Recipe_component__serving-adjuster">
              <!-- disable password manager -->
              <input name="disable-pwd-mgr-1" type="password" id="disable-pwd-mgr-1" style="display: none;" value="disable-pwd-mgr-1" />
              <input name="disable-pwd-mgr-2" type="password" id="disable-pwd-mgr-2" style="display: none;" value="disable-pwd-mgr-2" />
              <input name="disable-pwd-mgr-3" type="password" id="disable-pwd-mgr-3" style="display: none;" value="disable-pwd-mgr-3" />

              <label for="Recipe_component__servings">מספר מנות</label>
              <input type="number" id="Recipe_component__servings" name="servings" value="4" min="1">
            </div>
            <div class="Recipe_component__ingredients">
              <h2>מצרכים:</h2>
              <ul id="Recipe_component__ingredients-list" class="Recipe_component__ingredients-list"></ul>
            </div>
          </div>
          <div class="Recipe_component__image-container">
            <img id="Recipe_component__image" src="" alt="" class="Recipe_component__image">
          </div>
        </div>
        <div class="Recipe_component__instructions">
          <h2>הוראות הכנה:</h2>
          <ol id="Recipe_component__instructions-list"></ol>
        </div>
        <div class="Recipe_component__comments" style="display: none;">
          <h2>הערות:</h2>
          <ol id="Recipe_component__comments-list"></ol>
        </div>
      </div>
    `}styles(){return`
    .Recipe_component {
      display: flex;
      flex-direction: column;
      width: 100%;
      font-family: var(--body-font);
      direction: rtl;
    }

    .Recipe_component__content {
      display: flex;
      gap: 2rem;
      margin-bottom: 40px;
    }

    .Recipe_component__image-container {
      flex: 1;
      min-width: 300px;
    }

    .Recipe_component__image {
      width: 100%;
      height: auto;
      object-fit: cover;
      border-radius: 10px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .Recipe_component__details {
      flex: 1;
    }

    .Recipe_component__title {
      font-family: var(--heading-font-he);
      font-size: 3rem;
      color: var(--primary-color);
      text-align: center;
      margin-bottom: 20px;
    }

    .Recipe_component__meta {
      display: flex;
      justify-content: center;
      gap: 20px;
      margin-bottom: 30px;
      font-size: 1rem;
      color: var(--text-color);
    }

    .Recipe_component__serving-adjuster {
      margin-top: 10px;  
      margin-bottom: 20px;
      display: flex;
      align-items: center;
    }

    .Recipe_component__serving-adjuster label {
      margin-left: 10px;
    }

    .Recipe_component__serving-adjuster input {
      width: 60px;
      padding: 5px;
      font-size: 1rem;
    }

    .Recipe_component__ingredients h2,
    .Recipe_component__instructions h2,
    .Recipe_component__comments h2 {
      font-family: var(--heading-font-he);
      font-size: 2rem;
      color: var(--primary-color);
      margin-bottom: 20px;
    }

    .Recipe_component__ingredients-list {
      list-style-type: none;
      padding: 0;
    }

    .Recipe_component__ingredients-list li {
      margin-bottom: 10px;
    }

    .Recipe_component__instructions ol {
      padding-right: 20px;
      margin-bottom: 20px;
    }

    .Recipe_component__instructions > ol {
      padding-right: 0;
    }

    .Recipe_component__instructions li {
      margin-bottom: 10px;
      line-height: 1.6;
    }

    .Recipe_component__comments ol {
      padding-right: 20px;
      margin-bottom: 20px;
    }

    .Recipe_component__comments li {
      margin-bottom: 10px;
      line-height: 1.6;
    }

    /* Responsive Styles */
    @media (max-width: 768px) {
      .Recipe_component{
        padding: 30px;
        width: auto;  
      }
      .Recipe_component__content {
        flex-direction: column;
        gap: 0.5rem;
        margin-bottom: 10px;
      }

      .Recipe_component__details,
      .Recipe_component__image-container {
        width: 100%;
      }

      .Recipe_component__meta {
        flex-direction: column;
        align-items: center;
      }
    }
    `}async fetchAndPopulateRecipeData(){try{const e=await m(this.recipeId);e?(this.populateRecipeDetails(e),this.setRecipeImage(e),this.populateIngredientsList(e),this.populateInstructions(e),this.populateCommentList(e),this.setupServingsAdjuster(e),this._originalIngredients=e.ingredients):console.warn("No such document!")}catch(e){console.error("Error getting recipe: ",e)}}populateRecipeDetails(e){this.shadowRoot.getElementById("Recipe_component__name").textContent=e.name,this.shadowRoot.getElementById("Recipe_component__prepTime").textContent=`זמן הכנה: ${l(e.prepTime)}`,this.shadowRoot.getElementById("Recipe_component__waitTime").textContent=`זמן המתנה: ${l(e.waitTime)}`,this.shadowRoot.getElementById("Recipe_component__difficulty").textContent=`רמת קושי: ${e.difficulty}`,this.shadowRoot.getElementById("Recipe_component__category").textContent=`קטגוריה: ${_(e.category)}`}async setRecipeImage(e){try{const i=this.shadowRoot.querySelector(".Recipe_component__image-container");let t=await d.getCurrentUserRole();t==="user"&&(t="public");const o=g(e,t);i.innerHTML="",o.length===0?await this.showPlaceholder(i):o.length===1?await this.showSingleImage(i,o[0]):this.showCarousel(i,o)}catch(i){console.error("Error setting recipe images:",i),await this.showPlaceholder(this.shadowRoot.querySelector(".Recipe_component__image-container"))}}async showPlaceholder(e){const i=document.createElement("img");i.className="Recipe_component__image",i.alt="תמונת מתכון לא זמינה";try{i.src=await h()}catch(t){console.error("Could not load placeholder image",t)}e.appendChild(i)}async showSingleImage(e,i){const t=document.createElement("img");try{const o=await u(i.full);if(!o)throw new Error("Failed to get image URL");t.src=o,t.alt="תמונת מתכון",t.className="Recipe_component__image",e.appendChild(t)}catch(o){console.error("Error loading image:",o),await this.showPlaceholder(e)}}async showCarousel(e,i){try{const o=[...i].sort((s,a)=>s.isPrimary?-1:a.isPrimary?1:0).map(s=>s.full),n=document.createElement("image-carousel");n.setAttribute("images",JSON.stringify(o)),e.appendChild(n)}catch(t){console.error("Error setting up carousel:",t),await this.showPlaceholder(e)}}populateIngredientsList(e){const i=this.shadowRoot.getElementById("Recipe_component__ingredients-list");i.innerHTML="",e.ingredients.forEach(t=>{const o=document.createElement("li");o.innerHTML=`
        <span class="amount">${y(t.amount)}</span>
        <span class="unit">${t.unit}</span>
        <span class="item">${t.item}</span>
      `,i.appendChild(o)})}populateInstructions(e){const i=this.shadowRoot.getElementById("Recipe_component__instructions-list");if(i.innerHTML="",e.stages&&e.stages.length>0)e.stages.forEach((t,o)=>{const n=document.createElement("h3");n.textContent=`שלב ${o+1}: ${t.title}`,n.classList.add("Recipe_component__stage-title"),i.appendChild(n);const s=document.createElement("ol");s.classList.add("Recipe_component__instruction-list"),t.instructions.forEach(a=>{const r=document.createElement("li");r.textContent=a,s.appendChild(r)}),i.appendChild(s)});else{const t=document.createElement("ol");t.classList.add("Recipe_component__instruction-list"),e.instructions.forEach(o=>{const n=document.createElement("li");n.textContent=o,t.appendChild(n)}),i.appendChild(t)}}populateCommentList(e){const i=this.shadowRoot.getElementById("Recipe_component__comments-list"),t=i.parentNode;Array.isArray(e.comments)&&e.comments.length>0&&(i.innerHTML="",e.comments.forEach(o=>{const n=document.createElement("li");n.textContent=o,i.appendChild(n)}),t.style.display="")}setupServingsAdjuster(e){const i=this.shadowRoot.getElementById("Recipe_component__servings");i.setAttribute("value",e.servings),this._originalIngredients=e.ingredients,i.addEventListener("change",()=>{const t=parseInt(i.value),o=R(this._originalIngredients,e.servings,t);this.populateIngredientsList({ingredients:o})})}}customElements.define("recipe-component",b);
