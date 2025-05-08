import{g as o,d as n,b as d}from"./sw-register-nWNmA_5D.js";class c extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"}),this.pdfPath=this.getAttribute("pdf-path"),this.currentPage=this.getAttribute("start-page")||1,this.totalPages=parseInt(this.getAttribute("total-pages"))||92}async connectedCallback(){this.hasPageIndex=this.hasAttribute("page-index"),this.hasPageIndex&&(this.pageIndex=await this.fetchPageIndex(),this.categories=Object.keys(this.pageIndex.categories)),this.render(),this.addEventListeners()}async fetchPageIndex(){try{const e=o();if(!e)return console.error("Firestore not initialized"),{};const[t,r]=this.getAttribute("page-index").split("/"),i=n(e,t,r);return(await d(i)).data()}catch(e){return console.error("Error fetching page index:",e),{}}}render(){this.shadowRoot.querySelector(".pdf_viewer")?(this.shadowRoot.getElementById("pdf_viewer__pdfImage").src=this.getImageSrc(this.currentPage),this.shadowRoot.getElementById("pdf_viewer__pageNumber").textContent=`עמוד ${this.currentPage}`):(this.shadowRoot.innerHTML=`
              <style>
                .pdf_viewer {
                    width: 100%;
                    border: 1px solid #ccc;
                    overflow: hidden;
                }

                .pdf_viewer__pdf-page {
                    display: flex;
                    justify-content: center;
                    width: fit-content;
                }

                .pdf_viewer__pdf-page img {
                    width: 100%;
                    height: auto;
                }

                .pdf_viewer__pdf-navigation {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px;
                    background-color: #f0f0f0;
                }

                .recipe-search {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding: 10px;
                    background-color: #f0f0f0;
                    gap: 10px;
                }

                .pdf_viewer__pdf-navigation button {
                    background-color: var(--primary-color);
                    color: white;
                    border: none;
                    padding: 5px 10px;
                    border-radius: 5px;
                    cursor: pointer;
                }

                .pdf-viewer .recipe-search {
                  padding: 1rem;
                  background-color: var(--background-color);
                  border-bottom: 1px solid var(--border-color);
                }

                .pdf_viewer #category-select,
                .pdf_viewer #search-input {
                  padding: 2px;
                  border: 1px solid var(--primary-color, #bb6016);
                  border-radius: 4px;
                  font-size: 1rem;
                  background: white;
                }
              </style>
              <div class="pdf_viewer">
                  ${this.hasPageIndex?`
                    <div dir="rtl" class="recipe-search">  
                      <select id="category-select" class="category-select">
                          <option value="">כל הקטגוריות</option>
                          ${this.categories.map(e=>`<option value="${e}">${e}</option>`).join("")}
                      </select>
                      <input list="recipe-list" type="text" class="search-input" id="search-input" placeholder="חיפוש...">
                      <datalist id="recipe-list"></datalist>
                    </div>
                  `:""}
                  <div class="pdf_viewer__pdf-page">
                      <img id="pdf_viewer__pdfImage" src="${this.getImageSrc(this.currentPage)}" alt="Page ${this.currentPage}">
                  </div>
                  <div class="pdf_viewer__pdf-navigation">
                      <button id="pdf_viewer__nextPage">הבא</button>
                      <span id="pdf_viewer__pageNumber">עמוד ${this.currentPage}</span>
                      <button id="pdf_viewer__prevPage">הקודם</button>
                  </div>
              </div>
          `,this.addEventListeners())}addEventListeners(){this.shadowRoot.querySelector("#pdf_viewer__prevPage").hasAttribute("listener")||(this.shadowRoot.getElementById("pdf_viewer__prevPage").addEventListener("click",()=>this.goToPage(this.currentPage-1)),this.shadowRoot.getElementById("pdf_viewer__prevPage").setAttribute("listener","true"),this.shadowRoot.getElementById("pdf_viewer__nextPage").addEventListener("click",()=>this.goToPage(this.currentPage+1)),this.shadowRoot.getElementById("pdf_viewer__nextPage").setAttribute("listener","true"),this.hasPageIndex&&(this.searchInput=this.shadowRoot.getElementById("search-input"),this.searchResults=this.shadowRoot.getElementById("recipe-list"),this.categorySelect=this.shadowRoot.getElementById("category-select"),this.searchInput.addEventListener("input",this.performSearch.bind(this)),this.categorySelect.addEventListener("change",this.performSearch.bind(this)),this.searchInput.addEventListener("input",()=>{const e=this.searchResults.querySelector(`option[value="${this.searchInput.value}"]`);if(e){const t=e.dataset.pageNumber;t&&this.goToPage(t)}})))}performSearch(){const e=this.searchInput.value.toLowerCase(),t=this.categorySelect.value;let r=Object.entries(this.pageIndex.recipes);t&&(r=r.filter(([s,a])=>this.getCategoryForPage(a)===t));const i=r.filter(([s])=>s.toLowerCase().includes(e));this.updateSearchResults(i)}updateSearchResults(e){this.searchResults.innerHTML="",e.forEach(([t,r])=>{const i=document.createElement("option");i.value=t,i.dataset.pageNumber=r,this.searchResults.appendChild(i)})}getCategoryForPage(e){for(const[t,r]of Object.entries(this.pageIndex.categories))if(e>=r.startPage&&e<=r.endPage)return t;return null}getImageSrc(e){return`https://firebasestorage.googleapis.com/v0/b/cook-book-test-479e8.appspot.com/o/${encodeURIComponent(`${this.pdfPath}page.${e}.jpg`)}?alt=media`}goToPage(e){console.log(e),this.currentPage=Math.max(1,Math.min(e,this.totalPages)),this.render()}}customElements.define("pdf-viewer",c);
