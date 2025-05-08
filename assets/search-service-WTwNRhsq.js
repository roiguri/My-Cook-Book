class h extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"})}connectedCallback(){this.render(),this.setupEventListeners()}render(){const e=this.getAttribute("placeholder")||"חיפוש מתכונים...";this.shadowRoot.innerHTML=`
      <style>
        :host {
          display: block;
          width: 100%;
        }

        .search-container {
          position: relative;
          width: 100%;
          display: flex;
          align-items: center;
        }

        .search-input {
          width: 100%;
          padding: 10px;
          padding-left: 40px; /* Space for the search icon */
          border: 2px solid var(--border-color, #ccc);
          border-radius: 4px;
          font-size: var(--size-body);
          font-family: var(--body-font);
        }

        .search-input:focus {
          outline: none;
          border-color: var(--submenu-color);
        }

        .search-icon {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-color);
          pointer-events: none;
          font-size: var(--size-icon);
        }

        /* Mobile Responsiveness */
        @media (max-width: 768px) {
          .search-container {
            grid-column: span 2;
          }
        }
      </style>

      <div class="search-container" dir="rtl">
        <input 
          type="text" 
          class="search-input" 
          placeholder="${e}"
          aria-label="חיפוש מתכונים">
        <span class="search-icon">🔍</span>
      </div>
    `}setupEventListeners(){this.shadowRoot.querySelector(".search-input").addEventListener("input",t=>{const s=t.target.value.trim();this.dispatchEvent(new CustomEvent("search-input",{bubbles:!0,composed:!0,detail:{searchText:s}}))})}getValue(){return this.shadowRoot.querySelector(".search-input").value}setValue(e){this.shadowRoot.querySelector(".search-input").value=e}clear(){const e=this.shadowRoot.querySelector(".search-input");e.value!==""&&(e.value="",this.dispatchEvent(new CustomEvent("search-input",{bubbles:!0,composed:!0,detail:{searchText:""}})))}}customElements.define("filter-search-bar",h);class d extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"}),this.state={searchText:"",currentFilters:null,category:null,favoritesOnly:!1,isLoading:!1},this.handleSearch=this.debounce(this.handleSearch.bind(this),300),this.handleFilterUpdate=this.handleFilterUpdate.bind(this)}connectedCallback(){this.render(),this.setupEventListeners()}render(){this.shadowRoot.innerHTML=`
      <style>
        :host {
          display: block;
        }
        .search-container {
          position: relative;
        }
      </style>
      
      <div class="search-container">
        <slot name="search-input"></slot>
      </div>
    `}setupEventListeners(){const e=this.shadowRoot.querySelector("slot");e.addEventListener("slotchange",t=>{const i=e.assignedElements().find(r=>r.tagName==="INPUT");i&&i.addEventListener("input",r=>{this.state.searchText=r.target.value,this.handleSearch()})}),document.addEventListener("filter-applied",t=>{this.handleFilterUpdate(t.detail.filters)})}async updateSearchParams(e={}){Object.assign(this.state,e),await this.handleSearch()}async handleSearch(){if(!this.state.isLoading){this.state.isLoading=!0;try{let e=await this.fetchRecipes();e=this.filterRecipes(e),this.dispatchEvent(new CustomEvent("search-results-updated",{bubbles:!0,composed:!0,detail:{results:e,searchParams:{text:this.state.searchText,category:this.state.category,filters:this.state.currentFilters}}}))}catch(e){console.error("Search error:",e)}finally{this.state.isLoading=!1}}}async fetchRecipes(){if(this.state.favoritesOnly){const s=authService.getCurrentUser(),i=s==null?void 0:s.uid;if(!i)return[];const r=await FirestoreService.getDocument("users",i),a=(r==null?void 0:r.favorites)||[];return(await Promise.all(a.map(n=>FirestoreService.getDocument("recipes",n)))).filter(n=>n&&n.approved).map(n=>n)}const e={where:[["approved","==",!0]]};return this.state.category&&e.where.push(["category","==",this.state.category]),await FirestoreService.queryDocuments("recipes",e)}filterRecipes(e){if(!e.length)return[];let t=e;if(this.state.searchText){const s=this.state.searchText.toLowerCase().trim().split(/\s+/);t=t.filter(i=>{const r=[i.name,i.category,...i.tags||[]].join(" ").toLowerCase();return s.every(a=>r.includes(a))})}if(this.state.currentFilters){const{cookingTime:s,difficulty:i,mainIngredient:r,tags:a}=this.state.currentFilters;s&&(t=this.filterByCookingTime(t,s)),i&&(t=t.filter(o=>o.difficulty===i)),r&&(t=t.filter(o=>o.mainIngredient===r)),a!=null&&a.length&&(t=t.filter(o=>a.every(n=>{var c;return(c=o.tags)==null?void 0:c.includes(n)})))}return t}filterByCookingTime(e,t){const[s,i]=t.split("-").map(Number);return e.filter(r=>{const a=(r.prepTime||0)+(r.waitTime||0);return i?a>=s&&a<=i:a>=s})}handleFilterUpdate(e){this.state.currentFilters=e,this.handleSearch()}debounce(e,t){let s;return function(...r){const a=()=>{clearTimeout(s),e(...r)};clearTimeout(s),s=setTimeout(a,t)}}}customElements.define("search-service",d);
