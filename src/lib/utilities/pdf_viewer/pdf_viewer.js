class PDFViewer extends HTMLElement {
  constructor() {
      super();
      this.attachShadow({mode: 'open'});
      this.pdfPath = this.getAttribute('pdf-path');
      this.currentPage = this.getAttribute('start-page') || 1;
      this.totalPages = parseInt(this.getAttribute('total-pages')) || 92;
  }

  async connectedCallback() {
    this.hasPageIndex = this.hasAttribute('page-index');

    if (this.hasPageIndex) {
        this.pageIndex = await this.fetchPageIndex();
        this.categories = Object.keys(this.pageIndex.categories);
    }

    this.render();
    this.addEventListeners();
  }

  async fetchPageIndex() {
    try {
        const db = firebase.firestore();
        const [collectionName, fileName] = this.getAttribute('page-index').split('/'); // Split the attribute value
        const pageIndexDoc = await db.collection(collectionName).doc(fileName).get();
        return pageIndexDoc.data();
    } catch (error) {
        console.error('Error fetching page index:', error);
        return {};
    }
  }

  render() {

      // Initial rendering (only once)
      if (!this.shadowRoot.querySelector('.pdf_viewer')) {
          this.shadowRoot.innerHTML = `
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
                  ${this.hasPageIndex ? `
                    <div dir="rtl" class="recipe-search">  
                      <select id="category-select" class="category-select">
                          <option value="">כל הקטגוריות</option>
                          ${this.categories.map(category => `<option value="${category}">${category}</option>`).join('')}
                      </select>
                      <input list="recipe-list" type="text" class="search-input" id="search-input" placeholder="חיפוש...">
                      <datalist id="recipe-list"></datalist>
                    </div>
                  ` : ''}
                  <div class="pdf_viewer__pdf-page">
                      <img id="pdf_viewer__pdfImage" src="${this.getImageSrc(this.currentPage)}" alt="Page ${this.currentPage}">
                  </div>
                  <div class="pdf_viewer__pdf-navigation">
                      <button id="pdf_viewer__nextPage">הבא</button>
                      <span id="pdf_viewer__pageNumber">עמוד ${this.currentPage}</span>
                      <button id="pdf_viewer__prevPage">הקודם</button>
                  </div>
              </div>
          `;
          this.addEventListeners(); // Attach event listeners after initial rendering
      } else {
          // Update only the necessary parts
          this.shadowRoot.getElementById('pdf_viewer__pdfImage').src = this.getImageSrc(this.currentPage);
          this.shadowRoot.getElementById('pdf_viewer__pageNumber').textContent = `עמוד ${this.currentPage}`;
      }
  }

  addEventListeners() {
    if (!this.shadowRoot.querySelector('#pdf_viewer__prevPage').hasAttribute('listener')) {
        this.shadowRoot.getElementById('pdf_viewer__prevPage').addEventListener('click', () => this.goToPage(this.currentPage - 1));
        this.shadowRoot.getElementById('pdf_viewer__prevPage').setAttribute('listener', 'true');
        this.shadowRoot.getElementById('pdf_viewer__nextPage').addEventListener('click', () => this.goToPage(this.currentPage + 1));
        this.shadowRoot.getElementById('pdf_viewer__nextPage').setAttribute('listener', 'true');

        // Moved search-related event listeners here
        if (this.hasPageIndex) {
            this.searchInput = this.shadowRoot.getElementById('search-input');
            this.searchResults = this.shadowRoot.getElementById('recipe-list');
            this.categorySelect = this.shadowRoot.getElementById('category-select');
            this.searchInput.addEventListener('input', this.performSearch.bind(this));
            this.categorySelect.addEventListener('change', this.performSearch.bind(this));

            // Add event listener for search suggestions
            this.searchInput.addEventListener('input', () => {
                // Find the selected option in the datalist
                const selectedOption = this.searchResults.querySelector(`option[value="${this.searchInput.value}"]`);
                if (selectedOption) {
                    // Get the page number from the selected option's data attribute (if available)
                    const pageNumber = selectedOption.dataset.pageNumber;
                    if (pageNumber) {
                        this.goToPage(pageNumber);
                    }
                }
            });
        }
    }
  }

  performSearch() {
    const searchTerm = this.searchInput.value.toLowerCase();
    const selectedCategory = this.categorySelect.value;
    let recipes = Object.entries(this.pageIndex.recipes);
  
    if (selectedCategory) {
      recipes = recipes.filter(([recipeName, pageNumber]) => {
        const recipeCategory = this.getCategoryForPage(pageNumber);
        return recipeCategory === selectedCategory;
      });
    }
  
    const matchedRecipes = recipes.filter(([recipeName]) => {
      return recipeName.toLowerCase().includes(searchTerm);
    });
  
    this.updateSearchResults(matchedRecipes);
  }
  
  updateSearchResults(results) {
    this.searchResults.innerHTML = ''; // Clear previous results
  
    results.forEach(([recipeName, pageNumber]) => {
      const option = document.createElement('option');
      option.value = recipeName;
      option.dataset.pageNumber = pageNumber;
      this.searchResults.appendChild(option);
    });
  }

  getCategoryForPage(pageNumber) {
    for (const [categoryName, categoryData] of Object.entries(this.pageIndex.categories)) {
        if (pageNumber >= categoryData.startPage && pageNumber <= categoryData.endPage) {
            return categoryName;
        }
    }
    return null; // Or a default category if needed
  }

  getImageSrc(pageNumber) {
    // Use the pdf-path attribute to construct the URL
    const storageBucket = 'cook-book-test-479e8.appspot.com';
    return `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o/${encodeURIComponent(`${this.pdfPath}page.${pageNumber}.jpg`)}?alt=media`;
  }

  goToPage(pageNumber) {
    console.log(pageNumber);
    this.currentPage = Math.max(1, Math.min(pageNumber, this.totalPages));
    this.render();
  }
}

customElements.define('pdf-viewer', PDFViewer);