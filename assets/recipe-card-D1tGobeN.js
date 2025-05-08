import{a as o,g as n,b as u,d,u as c,c as f,e as b}from"./sw-register-nWNmA_5D.js";import{g as m,a as y,b as _,c as v,d as w,f as k,e as x}from"./recipe-image-utils-BxyJQeAp.js";import{e as C}from"./recipe-ingredients-utils-z11E7uy4.js";class L extends HTMLElement{static get observedAttributes(){return["recipe-id","layout","is-collapsed","is-collapsible","has-more-info-icon","card-width","card-height"]}constructor(){super(),this.attachShadow({mode:"open"}),this._defaults={vertical:{width:"200px",height:"300px"},horizontal:{width:"300px",height:"200px"}},this._currentLayout="vertical",this._isLoading=!0,this._recipeData=null,this._imageUrl=null,this._error=null,this._handleArrowClick=this._handleArrowClick.bind(this),this._handleCardClick=this._handleCardClick.bind(this),this._userFavorites=new Set}get recipeId(){return this.getAttribute("recipe-id")}get layout(){return this.getAttribute("layout")||"vertical"}get isCollapsed(){return this.hasAttribute("is-collapsed")}get isCollapsible(){return this.hasAttribute("is-collapsible")}get hasMoreInfoIcon(){return this.hasAttribute("has-more-info-icon")}get cardWidth(){return this.getAttribute("card-width")||this._defaultWidth}get cardHeight(){return this.getAttribute("card-height")||this._defaultHeight}_getCurrentDimensions(){const e=this.getAttribute("layout")||"vertical";return{width:this.getAttribute("card-width")||this._defaults[e].width,height:this.getAttribute("card-height")||this._defaults[e].height}}connectedCallback(){this._initialize()}disconnectedCallback(){this._removeEventListeners()}attributeChangedCallback(e,t,i){if(t!==i)switch(e){case"recipe-id":this.isConnected&&this._fetchRecipeData();break;case"layout":this._updateLayout();break;case"is-collapsed":this.isCollapsible&&this._updateCollapseState();break;case"card-width":case"card-height":this._updateDimensions();break}}async _initialize(){this._setupStyles(),await Promise.all([this._fetchRecipeData(),this._fetchUserFavorites()]),this._render(),this._setupEventListeners()}_setupEventListeners(){this._removeEventListeners();const e=this.shadowRoot.querySelector(".recipe-card"),t=this.shadowRoot.querySelector(".collapse-arrow");e&&e.addEventListener("click",this._handleCardClick),t&&t.addEventListener("click",this._handleArrowClick),this._card=e,this._arrow=t;const i=this.shadowRoot.querySelector(".favorite-btn");i&&!i.hasAttribute("listener-attached")&&(i.setAttribute("listener-attached","true"),i.addEventListener("click",async r=>{console.log("Favorite button clicked"),r.stopPropagation();const a=i.classList.contains("active");i.classList.toggle("active"),await this._toggleFavorite(),this.dispatchEvent(new CustomEvent(a?"remove-favorite":"add-favorite",{bubbles:!0,composed:!0,detail:{recipeId:this.recipeId}}))}))}_removeEventListeners(){this._card&&this._card.removeEventListener("click",this._handleCardClick),this._arrow&&this._arrow.removeEventListener("click",this._handleArrowClick)}_handleCardClick(e){if(e.target.closest(".collapse-arrow"))return;console.log("Card clicked, emitting event for recipe:",this.recipeId);const t=new CustomEvent("recipe-card-open",{detail:{recipeId:this.recipeId},bubbles:!0,composed:!0});this.dispatchEvent(t)}_handleArrowClick(e){console.log("Arrow clicked, current collapsed state:",this.isCollapsed),e.stopPropagation(),this.isCollapsible&&(this.toggleAttribute("is-collapsed"),this._updateCollapseState())}async _fetchRecipeData(){if(!this.recipeId){this._handleError("No recipe ID provided");return}try{if(this._isLoading=!0,this._render(),this._recipeData=await m(this.recipeId),!this._recipeData)throw new Error("Recipe not found");await this._fetchRecipeImage(),this._isLoading=!1,this._render()}catch(e){this._handleError(e)}}async _fetchRecipeImage(){try{this._imageUrl=await y(this._recipeData)}catch(e){console.error("Error fetching recipe image:",e),this._imageUrl=await _()}}_handleError(e){console.error("Recipe Card Error:",e),this._isLoading=!1,this._error=e.message,this._render()}_setupStyles(){const e=document.createElement("style");e.textContent=this._getStyles(),this.shadowRoot.appendChild(e)}_getStyles(){return`
        ${this._getBaseStyles()}
        ${this._getLayoutStyles()}
        ${this._getLoadingStyles()}
        ${this._getErrorStyles()}
        ${this._getCollapseStyles()}
    `}_getBaseStyles(){return`
        :host {
              display: block;
              width: var(--card-width, ${this._defaultWidth});
              height: var(--card-height, ${this._defaultHeight});
          }

          .recipe-card {
              position: relative; /* Added for absolute positioning of arrow */
              background: var(--card-bg, white);
              border-radius: 10px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              transition: all 0.3s ease;
              height: 100%;
              display: flex;
              flex-direction: column;
              cursor: pointer;
              overflow: hidden;
              transform: translateY(0);
              transition: transform 0.3s ease, box-shadow 0.3s ease;
          }

          .recipe-card:hover {
              transform: translateY(-5px);
              box-shadow: 0 8px 12px rgba(0, 0, 0, 0.15);
          }

          .badge {
              display: inline-flex;
              align-items: center;
              padding: 0.25rem 0.75rem;
              border-radius: 12px;
              font-size: 0.85rem;
              font-weight: 500;
              color: white;
              width: auto;
              flex-wrap: nowrap;
              white-space: nowrap;
              overflow: hidden;
          }

          /* Cooking Time Badges */
          .badge.time {
              background: linear-gradient(135deg, #60a5fa, #3b82f6);  /* Sky Blue to Blue */
          }
          .badge.time.quick { /* <= 30 mins */
              background: linear-gradient(135deg, #93c5fd, #60a5fa);  /* Lighter Sky Blue to Sky Blue */
          }
          .badge.time.medium { /* 31-60 mins */
              background: linear-gradient(135deg, #60a5fa, #3b82f6);  /* Sky Blue to Blue */
          }
          .badge.time.long { /* > 60 mins */
              background: linear-gradient(135deg, #3b82f6, #1d4ed8);  /* Blue to Dark Blue */
          }

          /* Difficulty Badges */
          .badge.difficulty.easy {
              background: linear-gradient(135deg, #86efac, #22c55e);  /* Light Green to Green */
          }
          .badge.difficulty.medium {
              background: linear-gradient(135deg, #fde047, #eab308);  /* Light Yellow to Yellow */
          }
          .badge.difficulty.hard {
              background: linear-gradient(135deg, #fca5a5, #ef4444);  /* Light Red to Red */
          }

          /* Category Badges */
          .badge.category.appetizers {
              background: linear-gradient(135deg, #f9a8d4, #ec4899);  /* Light Pink to Pink */
          }
          .badge.category.main-courses {
              background: linear-gradient(135deg, #c084fc, #a855f7);  /* Light Purple to Purple */
          }
          .badge.category.side-dishes {
              background: linear-gradient(135deg, #5eead4, #0d9488);  /* Light Teal to Teal */
          }
          .badge.category.soups-stews {
              background: linear-gradient(135deg, #bef264, #84cc16);  /* Light Lime to Lime */
          }
          .badge.category.salads {
              background: linear-gradient(135deg, #6ee7b7, #10b981);  /* Light Emerald to Emerald */
          }
          .badge.category.desserts {
              background: linear-gradient(135deg, #fb923c, #ea580c);  /* Light Orange-Red to Orange-Red */
          }
          .badge.category.breakfast-brunch {
              background: linear-gradient(135deg, #fcd34d, #d97706);  /* Light Amber to Amber */
          } 
          .badge.category.snacks {
              background: linear-gradient(135deg, #fdba74, #f97316);  /* Light Orange to Orange */
          }
          .badge.category.beverages {
              background: linear-gradient(135deg, #a5b4fc, #6366f1);  /* Light Indigo to Indigo */
          }

          .collapse-arrow {
              position: absolute;
              top: 8px;
              left: 8px;
              width: 24px;
              height: 24px;
              display: flex;
              align-items: center;
              justify-content: center;
              background: rgba(0, 0, 0, 0.1);
              border-radius: 50%;
              cursor: pointer;
              z-index: 10;
              transition: all 0.5s ease;
          }

          .collapse-arrow::before {
              content: "▼";
              font-size: 12px;
              color: #666;
              transition: color 0.5s ease;
          }

          .collapse-arrow:hover {
              background: rgba(0, 0, 0, 0.2);
          }

          .recipe-card.collapsed .collapse-arrow {
              transform: rotate(-90deg);
          }

          .recipe-image {
              position: relative;
              width: 100%;
              height: 50%;
              object-fit: cover;
              flex-shrink: 0;
              box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.1);
              opacity: 0;
              transition: opacity 0.3s ease;
              background-color: #f0f0f0; /* Placeholder color while loading */
          }

          .recipe-image.loaded {
              opacity: 1;
          }

          .recipe-content {
              padding: 0.5rem;
              flex: 1;
              display: flex;
              flex-direction: column;
              justify-content: space-between;  /* Center content vertically */
              gap: 0.5rem;
          }

          .recipe-title {
              text-align: center;
              margin: 0 auto;
              display: flex;
              gap: 0.5rem;
              font-size: 1.2rem;              
          }

          .more-info {
            order: -1;
          }

          .recipe-meta {
              display: flex;
              padding: 0.5rem;
              align-items: right;
              gap: 0.3rem;
              flex-direction: column;
          }

          .recipe-meta span {
              text-align: right;
              white-space: nowrap; /* Allow text to wrap naturally */
              line-height: 1.4;    /* Added for better readability */
              display: block;      /* Added to ensure block-level behavior */
              font-size: 0.9rem;
          }

          .recipe-info {
              text-align: center;
              width: 100%;
          }

          .category-container {
              width: 100%;
              display: flex;
              justify-content: center;
          }

          .stats-container {
              width: 100%;
              display: flex;
              justify-content: center;
              flex-wrap: nowrap;
              gap: 0.3rem;
          }

          .favorite-btn {
              position: absolute;
              top: 8px;
              right: 8px;
              width: 24px;
              height: 24px;
              padding: 0;
              background: none;
              border: none;
              cursor: pointer;
              z-index: 10;
          }

          .favorite-btn svg {
              width: 100%;
              height: 100%;
              stroke: rgba(0, 0, 0, 0.2);
              fill: white;
              transition: fill 0.3s ease, transform 0.3s ease; /* Added fill transition */
          }

          .favorite-btn.active svg {
              fill: #ff4b4b;
          }

          .favorite-btn:hover svg {
              transform: scale(1.1);
          }
              

          /* Responsive adjustments */
          @media (max-width: 260px) {
              .stats-container {
                  flex-direction: column;
                  align-items: center;
              }

              .badge {
                  width: 90%;  /* Take most of the width but leave some margin */
                  justify-content: center;
              }
          }
      `}_getLayoutStyles(){return`
        .recipe-card[data-layout="horizontal"] {
            display: flex;
            flex-direction: row-reverse;
        }

        .recipe-card[data-layout="horizontal"] .recipe-image {
            width: 50%;  /* Changed from 40% to 50% */
            height: 100%;
        }

        .recipe-card[data-layout="horizontal"] .recipe-content {
            width: 50%;  /* Changed from 60% to 50% */
            padding: 0.5rem;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }
    `}_getLoadingStyles(){return`
          .recipe-card.loading {
              position: relative;
              min-height: 200px;
          }

          .loading::after {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
              background-size: 200% 100%;
              animation: loading 1.5s infinite;
          }

          @keyframes loading {
              0% { background-position: 200% 0; }
              100% { background-position: -200% 0; }
          }
      `}_getErrorStyles(){return`
          .error-state {
              padding: 1rem;
              text-align: center;
              color: #721c24;
              background-color: #f8d7da;
              border: 1px solid #f5c6cb;
              border-radius: 10px;
              height: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
          }
      `}_getCollapseStyles(){return`
          .recipe-card.collapsed .recipe-content > *:not(.recipe-title) {
              display: none;
          }

          .recipe-card.collapsed {
              height: auto;
              min-height: 80px;
          }

          .recipe-card.collapsed .recipe-image {
              display: none;
          }

          .recipe-details {
              max-height: 0;
              transition: max-height 0.3s ease-out;
          }

          .recipe-card:not(.collapsed) .recipe-details {
              max-height: 500px;
              transition: max-height 0.3s ease-in;
          }
      `}_render(){if(this._isLoading){this._renderLoadingState();return}if(this._error){this._renderErrorState();return}this._recipeData&&this._renderRecipe()}_renderLoadingState(){this.shadowRoot.innerHTML=`
          <style>${this._getStyles()}</style>
          <div class="recipe-card loading"></div>
      `}_renderErrorState(){this.shadowRoot.innerHTML=`
          <style>${this._getStyles()}</style>
          <div class="error-state">
              ${this._error}
          </div>
      `}_renderRecipe(){const{name:e,category:t,prepTime:i,waitTime:r,difficulty:a}=this._recipeData,s=i+r,l=w(s),h=x(a),g=C(this._recipeData.ingredients).join(", "),p=this.hasAttribute("show-favorites")?`
        <button class="favorite-btn ${this._isFavorite()?"active":""}" 
                aria-label="Add to favorites">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" 
                      stroke-width="2" />
            </svg>
        </button>
    `:"";this.shadowRoot.innerHTML=`
        <style>${this._getStyles()}</style>
        <div class="recipe-card ${this.isCollapsed?"collapsed":""}" 
             data-layout="${this.layout}">
            ${p}
            ${this.isCollapsible?`
                <div class="collapse-arrow"></div>
            `:""}
            ${this.isCollapsed?"":`
                <img class="recipe-image" 
                  src="${this._imageUrl}" 
                  alt="${e}"
                  onload="this.classList.add('loaded')"
                  onerror="this.src='/img/placeholder.jpg'; this.classList.add('loaded')">
            `}
            <div class="recipe-content">
                <h3 class="recipe-title">
                    ${e}
                    ${this.hasMoreInfoIcon?`
                        <span class="more-info" title="${g}">ℹ️</span>
                    `:""}
                </h3>
                <div class="recipe-details">
                    <div class="recipe-meta">
                        <div class="category-container">
                            <span class="badge category ${t}">
                                ${v(t)}
                            </span>
                        </div>
                        <div class="stats-container">
                            <span dir="rtl" class="badge time ${l}">
                                ${k(s)}
                            </span>
                            <span class="badge difficulty ${h}">
                                <span class="icon">${this._getDifficultyIcon()} ${a}</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,this._setupEventListeners()}async _fetchUserFavorites(){var e;try{const t=o.getCurrentUser(),i=t==null?void 0:t.uid;if(!i)return;const r=n(),s=((e=(await u(d(r,"users",i))).data())==null?void 0:e.favorites)||[];this._userFavorites=new Set(s)}catch(t){console.error("Error fetching favorites:",t)}}async _toggleFavorite(){try{const e=o.getCurrentUser(),t=e==null?void 0:e.uid;if(!t)return;const i=n(),r=d(i,"users",t);this._isFavorite()?(await c(r,{favorites:f(this.recipeId)}),this._userFavorites.delete(this.recipeId)):(await c(r,{favorites:b(this.recipeId)}),this._userFavorites.add(this.recipeId)),this._renderRecipe()}catch(e){console.error("Error toggling favorite:",e)}}_isFavorite(){return this._userFavorites.has(this.recipeId)}_getDifficultyIcon(){return""}_updateCollapseState(){const e=this.shadowRoot.querySelector(".recipe-card");e&&e.classList.toggle("collapsed",this.isCollapsed)}_updateLayout(){const e=this.getAttribute("layout")||"vertical";this._currentLayout=e;const t=this._getCurrentDimensions();this.style.setProperty("--card-width",t.width),this.style.setProperty("--card-height",t.height);const i=this.shadowRoot.querySelector(".recipe-card");i&&i.setAttribute("data-layout",e)}_updateDimensions(){this.style.setProperty("--card-width",this.cardWidth),this.style.setProperty("--card-height",this.cardHeight)}}customElements.define("recipe-card",L);
