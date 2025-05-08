import{a as l,F as r}from"./sw-register-nWNmA_5D.js";class h extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"}),this.state={isLoading:!1,matchingCount:0,filters:{cookingTime:"",difficulty:"",mainIngredient:"",tags:[]},availableFilters:{mainIngredients:[],tags:[]},category:null}}static get observedAttributes(){return["category","cooking-time-filter","difficulty-filter","ingredient-filter","tags-filter"]}async connectedCallback(){l.getCurrentUser()&&await this.loadInitialData(),this.render(),this.setupEventListeners()}attributeChangedCallback(t,e,i){if(e!==i)switch(t){case"category":this.state.category=i,this.loadInitialData();break}}render(){this.shadowRoot.innerHTML=`
      <style>${this.styles()}</style>
      <custom-modal height="auto" width="auto">
        <div class="filter-container">
          ${this.renderHeader()}
          ${this.renderFilterGrid()}
          ${this.renderFooter()}
        </div>
      </custom-modal>
    `}styles(){return`
      .filter-container {
        padding: 16px;
      }

      .filter-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        gap: 8px;
      }

      .filter-header h2 {
        margin: 0;
        font-size: 1.25rem;
      }

      .results-counter {
        color: #666;
        font-size: 0.9em;
        white-space: nowrap;
      }

      .filter-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 12px;
        margin-bottom: 16px;
      }

      .filter-section {
        background: #f5f5f5;
        padding: 12px;
        border-radius: 8px;
        box-sizing: border-box;
        width: 100%;
      }

      .filter-section h3 {
        margin: 0 0 8px 0;
        font-size: 1rem;
        color: #333;
      }

      .filter-content {
        width: 100%;
        box-sizing: border-box;
      }
      
      .searchable-select-container {
        width: 100%;
        box-sizing: border-box;
      }

      select, input {
        width: 100%;
        padding: 6px 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        background: white;
        font-size: 0.9rem;
        margin: 0;
      }

      #tags-select {
        width: auto;
      }

      .tags-container {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 8px;
        min-height: 28px;
      }

      .tag {
        background: #e0e0e0;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.85rem;
        display: flex;
        align-items: center;
        gap: 4px;
        margin: 2px 0;
      }

      .tag-remove {
        cursor: pointer;
        color: #666;
        margin-left: 2px;
        font-size: 1.1rem;
        line-height: 1;
      }

      .tag-remove:hover {
        color: #333;
      }

      .filter-footer {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        padding-top: 12px;
        border-top: 1px solid #ddd;
      }

      button {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
        font-size: 0.9rem;
      }

      .apply-btn {
        background: var(--primary-color, #bb6016);
        color: white;
      }

      .apply-btn:disabled {
        background: #cccccc;
        cursor: not-allowed;
      }

      .clear-btn {
        background: #f5f5f5;
        color: #333;
      }

      .button:hover:not(:disabled) {
        opacity: 0.9;
      }

      .loading-text {
        padding: 8px;
        text-align: center;
        color: #666;
        font-style: italic;
        font-size: 0.9rem;
      }

      /* Custom scrollbar for better visual */
      ::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }

      ::-webkit-scrollbar-track {
        background: #f1f1f1;
      }

      ::-webkit-scrollbar-thumb {
        background: #ddd;
        border-radius: 3px;
      }

      ::-webkit-scrollbar-thumb:hover {
        background: #ccc;
      }

      @media (max-width: 600px) {
        .filter-container {
          padding: 12px;
        }

        .filter-grid {
          grid-template-columns: 1fr;
          gap: 8px;
        }

        .filter-header {
          flex-direction: column;
          align-items: flex-start;
          margin-bottom: 8px;
        }

        .filter-section {
          padding: 10px;
        }

        .filter-footer {
          padding-top: 8px;
        }

        button {
          padding: 6px 12px;
          font-size: 0.85rem;
        }
      }
    `}renderHeader(){return`
      <div class="filter-header">
        <h2>סינון מתכונים</h2>
        <span class="results-counter">
          ${this.state.isLoading?"טוען...":`${this.state.matchingCount} מתכונים תואמים`}
        </span>
      </div>
    `}renderFilterGrid(){return`
      <div class="filter-grid">
        ${this.getAttribute("cooking-time-filter")!=="false"?this.renderCookingTimeFilter():""}
        ${this.getAttribute("difficulty-filter")!=="false"?this.renderDifficultyFilter():""}
        ${this.getAttribute("ingredient-filter")!=="false"?this.renderIngredientFilter():""}
        ${this.getAttribute("tags-filter")!=="false"?this.renderTagsFilter():""}
      </div>
    `}renderCookingTimeFilter(){return`
      <div class="filter-section">
        <h3>זמן הכנה</h3>
        <div class="loading-text" style="display: ${this.state.isLoading?"block":"none"}">
          ${this.renderLoading()}
        </div>
        <div class="filter-content" style="display: ${this.state.isLoading?"none":"block"}">
          <select id="cooking-time">
            <option value="">הכל</option>
            <option value="0-30">0-30 דקות</option>
            <option value="31-60">31-60 דקות</option>
            <option value="61">מעל שעה</option>
          </select>
        </div>
      </div>
    `}renderDifficultyFilter(){return`
      <div class="filter-section">
        <h3>רמת קושי</h3>
        <div class="loading-text" style="display: ${this.state.isLoading?"block":"none"}">
          ${this.renderLoading()}
        </div>
        <div class="filter-content" style="display: ${this.state.isLoading?"none":"block"}">
          <select id="difficulty">
            <option value="">הכל</option>
            <option value="קלה">קלה</option>
            <option value="בינונית">בינונית</option>
            <option value="קשה">קשה</option>
          </select>
        </div>
      </div>
    `}renderIngredientFilter(){return`
      <div class="filter-section">
        <h3>מרכיב עיקרי</h3>
        <div class="loading-text" style="display: ${this.state.isLoading?"block":"none"}">
          ${this.renderLoading()}
        </div>
        <div class="filter-content" style="display: ${this.state.isLoading?"none":"block"}">
          <select id="main-ingredient">
            <option value="">הכל</option>
            ${this.state.availableFilters.mainIngredients.map(t=>`<option value="${t}" ${this.state.filters.mainIngredient===t?"selected":""}>
                ${t}
              </option>`).join("")}
          </select>
        </div>
      </div>
    `}renderTagsFilter(){return`
      <div class="filter-section">
        <h3>תגיות</h3>
        <div class="loading-text" style="display: ${this.state.isLoading?"block":"none"}">
          ${this.renderLoading()}
        </div>
        <div class="filter-content" style="display: ${this.state.isLoading?"none":"block"}">
          <div class="searchable-select-container">
            <input 
              list="tags-list" 
              id="tags-select" 
              placeholder="חפש והוסף תגיות..."
              autocomplete="off"
            >
            <datalist id="tags-list">
              ${this.state.availableFilters.tags.filter(t=>!this.state.filters.tags.includes(t)).map(t=>`<option value="${t}">`).join("")}
            </datalist>
          </div>
          <div class="tags-container">
            ${this.state.filters.tags.map(t=>`
              <span class="tag">
                ${t}
                <span class="tag-remove" data-tag="${t}">×</span>
              </span>
            `).join("")}
          </div>
        </div>
      </div>
    `}renderFooter(){return`
      <div class="filter-footer">
        <button class="clear-btn">נקה הכל</button>
        <button class="apply-btn" ${this.state.isLoading?"disabled":""}>
          החל סינון
        </button>
      </div>
    `}renderLoading(){return'<div class="loading-indicator">טוען...</div>'}setupEventListeners(){this.shadowRoot.querySelector("custom-modal"),["cooking-time","difficulty","main-ingredient"].forEach(a=>{const s=this.shadowRoot.getElementById(a);s&&s.addEventListener("change",()=>this.handleFilterChange())});const t=this.shadowRoot.getElementById("tag-search");t&&t.addEventListener("input",a=>this.handleTagSearch(a));const e=this.shadowRoot.getElementById("tags-select");e&&(e.addEventListener("change",a=>{const s=a.target.value;s&&!this.state.filters.tags.includes(s)&&(this.addTag(s),a.target.value="")}),e.addEventListener("keypress",a=>{if(a.key==="Enter"){const s=a.target.value;s&&!this.state.filters.tags.includes(s)&&(this.addTag(s),a.target.value=""),a.preventDefault()}})),this.shadowRoot.addEventListener("click",a=>{if(a.target.classList.contains("tag-remove")){const s=a.target.dataset.tag;this.removeTag(s)}});const i=this.shadowRoot.querySelector(".apply-btn"),n=this.shadowRoot.querySelector(".clear-btn");i&&i.addEventListener("click",()=>this.applyFilters()),n&&n.addEventListener("click",()=>this.clearFilters())}addTag(t){this.state.filters.tags.includes(t)||(this.state.filters.tags.push(t),this.handleFilterChange())}removeTag(t){this.state.filters.tags=this.state.filters.tags.filter(e=>e!==t),this.handleFilterChange()}async loadInitialData(){this.state.isLoading=!0,this.updateUI();try{const t=l.getCurrentUser();if(this.hasAttribute("favorites-only")){const e=t.uid,i=await r.getDocument("users",e),n=(i==null?void 0:i.favorites)||[],a=await Promise.all(n.map(async s=>await r.getDocument("recipes",s)));this.state.availableFilters.mainIngredients=[...new Set(a.map(s=>s==null?void 0:s.mainIngredient).filter(s=>s&&s.trim()))].sort((s,o)=>s.localeCompare(o)),this.state.availableFilters.tags=[...new Set(a.flatMap(s=>(s==null?void 0:s.tags)||[]))],this.state.matchingCount=a.length}else{const e={where:[["approved","==",!0]]};this.state.category&&e.where.push(["category","==",this.state.category]);const i=await r.queryDocuments("recipes",e);this.state.availableFilters.mainIngredients=[...new Set(i.map(n=>n==null?void 0:n.mainIngredient).filter(n=>n&&n.trim()))].sort((n,a)=>n.localeCompare(a)),this.state.availableFilters.tags=[...new Set(i.flatMap(n=>(n==null?void 0:n.tags)||[]))],this.state.matchingCount=i.length}}catch(t){console.error("Error loading initial data:",t)}finally{this.state.isLoading=!1,this.updateUI()}}async handleFilterChange(){this.updateFilterState(),await this.updateMatchingCount()}async handleTagSearch(t){const e=t.target.value.toLowerCase(),i=this.state.availableFilters.tags.filter(a=>a.toLowerCase().includes(e)&&!this.state.filters.tags.includes(a)),n=this.shadowRoot.getElementById("tag-suggestions");n.innerHTML=i.map(a=>`<div class="tag-suggestion" data-tag="${a}">${a}</div>`).join("")}updateFilterState(){var n,a,s;const t=(n=this.shadowRoot.getElementById("cooking-time"))==null?void 0:n.value,e=(a=this.shadowRoot.getElementById("difficulty"))==null?void 0:a.value,i=(s=this.shadowRoot.getElementById("main-ingredient"))==null?void 0:s.value;this.state.filters={...this.state.filters,cookingTime:t,difficulty:e,mainIngredient:i}}async updateMatchingCount(){this.state.isLoading=!0,this.updateUI();try{const t=l.getCurrentUser();let e;if(this.currentRecipes)e=this.currentRecipes;else if(this.hasAttribute("favorites-only")&&t){const i=t.uid,n=await r.getDocument("users",i),a=(n==null?void 0:n.favorites)||[];e=await Promise.all(a.map(async s=>await r.getDocument("recipes",s)))}else{const i={where:[["approved","==",!0]]};this.state.category&&i.where.push(["category","==",this.state.category]),e=await r.queryDocuments("recipes",i)}e=this.applyFiltersToRecipes(e),this.state.matchingCount=e.length}catch(t){console.error("Error updating matching count:",t)}finally{this.state.isLoading=!1,this.updateUI()}}applyFiltersToRecipes(t){const{cookingTime:e,difficulty:i,mainIngredient:n,tags:a}=this.state.filters;return t.filter(s=>{if(e){const o=s.prepTime+s.waitTime,[d,c]=e.split("-").map(Number);if(c){if(o<d||o>c)return!1}else if(o<d)return!1}return!(i&&s.difficulty!==i||n&&s.mainIngredient!==n||a.length>0&&!a.every(o=>s.tags.includes(o)))})}async applyFilters(){this.state.isLoading=!0,this.updateUI();try{const t=l.getCurrentUser();let e;if(this.currentRecipes)e=this.currentRecipes;else if(this.hasAttribute("favorites-only")&&t){const i=t.uid,n=await r.getDocument("users",i),a=(n==null?void 0:n.favorites)||[];e=await Promise.all(a.map(async s=>await r.getDocument("recipes",s)))}else{const i={where:[["approved","==",!0]]};this.state.category&&i.where.push(["category","==",this.state.category]),e=await r.queryDocuments("recipes",i)}e=this.applyFiltersToRecipes(e),this.dispatchEvent(new CustomEvent("filter-applied",{bubbles:!0,composed:!0,detail:{recipes:e,filters:{...this.state.filters,category:this.state.category}}})),this.close()}catch(t){console.error("Error applying filters:",t)}finally{this.state.isLoading=!1,this.updateUI()}}clearFilters(){this.state.filters={cookingTime:"",difficulty:"",mainIngredient:"",tags:[]},["cooking-time","difficulty","main-ingredient"].forEach(i=>{const n=this.shadowRoot.getElementById(i);n&&(n.value="")});const e=this.shadowRoot.getElementById("tag-search");e&&(e.value=""),this.updateMatchingCount(),this.dispatchEvent(new CustomEvent("filter-reset",{bubbles:!0,composed:!0,detail:{recipes:this.currentRecipes||null,category:this.state.category}}))}updateUI(){this.updateLoadingState(),this.updateCounter(),this.updateFilterValues(),this.updateTagsDisplay(),this.updateApplyButton(),this.updateIngredientSelect()}updateLoadingState(){this.shadowRoot.querySelectorAll(".loading-text").forEach(i=>{i.style.display=this.state.isLoading?"block":"none"}),this.shadowRoot.querySelectorAll(".filter-content").forEach(i=>{i.style.display=this.state.isLoading?"none":"block"})}async updateCounter(){const t=this.shadowRoot.querySelector(".results-counter");t&&(t.textContent=this.state.isLoading?"טוען...":`${this.state.matchingCount} מתכונים תואמים`)}updateFilterValues(){const{cookingTime:t,difficulty:e,mainIngredient:i}=this.state.filters;Object.entries({"cooking-time":t,difficulty:e,"main-ingredient":i}).forEach(([a,s])=>{const o=this.shadowRoot.getElementById(a);o&&s&&(o.value=s)})}updateTagsDisplay(){const t=this.shadowRoot.querySelector(".tags-container");t&&(t.innerHTML=this.state.filters.tags.map(i=>`
        <span class="tag">
          ${i}
          <span class="tag-remove" data-tag="${i}">×</span>
        </span>
      `).join(""));const e=this.shadowRoot.getElementById("tags-list");e&&(e.innerHTML=this.state.availableFilters.tags.filter(i=>!this.state.filters.tags.includes(i)).map(i=>`<option value="${i}">`).join(""))}updateApplyButton(){const t=this.shadowRoot.querySelector(".apply-btn");t&&(t.disabled=this.state.isLoading)}updateIngredientSelect(){const t=this.shadowRoot.getElementById("main-ingredient");if(t){const e=t.value;t.innerHTML=`
        <option value="">הכל</option>
        ${this.state.availableFilters.mainIngredients.map(i=>`<option value="${i}" ${e===i?"selected":""}>
            ${i}
          </option>`).join("")}
      `}}setInitialRecipes(t){this.currentRecipes=t,this.state.availableFilters.mainIngredients=[...new Set(t.map(e=>e.mainIngredient).filter(e=>e&&e.trim()))].sort((e,i)=>e.localeCompare(i)),this.state.availableFilters.tags=[...new Set(t.flatMap(e=>e.tags||[]))],this.state.matchingCount=t.length,this.updateUI()}open(){const t=this.shadowRoot.querySelector("custom-modal");t&&t.open()}close(){const t=this.shadowRoot.querySelector("custom-modal");t&&t.close()}}customElements.define("recipe-filter-component",h);
