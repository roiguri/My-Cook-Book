import { getFirestoreInstance } from '../../../js/services/firebase-service.js';
import { doc, getDoc } from 'firebase/firestore';

// TODO: Add fullpage state
class PDFViewer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
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
      const db = getFirestoreInstance();
      if (!db) {
        console.error('Firestore not initialized');
        return {};
      }
      const [collectionName, fileName] = this.getAttribute('page-index').split('/'); // Split the attribute value
      const pageIndexRef = doc(db, collectionName, fileName);
      const pageIndexDocSnap = await getDoc(pageIndexRef);
      return pageIndexDocSnap.data();
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
                    border-radius: 12px;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04);
                    border: 1px solid rgba(0, 0, 0, 0.06);
                }

                .pdf_viewer__pdf-page {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    flex-grow: 1;
                    overflow: auto;
                    padding: 20px;
                    background: #ffffff;
                    position: relative;
                }

                .pdf_viewer__pdf-page::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 1px;
                    background: linear-gradient(90deg, transparent, rgba(0, 0, 0, 0.1), transparent);
                }

                .pdf_viewer__pdf-page img {
                    max-width: 100%;
                    max-height: 100%;
                    height: auto;
                    object-fit: contain;
                    border-radius: 8px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }

                .pdf_viewer__pdf-page img:hover {
                    transform: scale(1.02);
                    box-shadow: 0 12px 48px rgba(0, 0, 0, 0.16);
                }

                .pdf_viewer__pdf-navigation {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px 16px;
                    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                    flex-shrink: 0;
                    border-top: 1px solid rgba(0, 0, 0, 0.06);
                }

                .recipe-search {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding: 12px 16px;
                    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                    gap: 12px;
                    flex-shrink: 0;
                    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
                }

                .pdf_viewer__pdf-navigation button {
                    background: linear-gradient(135deg, var(--primary-color, #bb6016) 0%, #a0541a 100%);
                    color: white;
                    border: none;
                    padding: 12px 20px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 500;
                    font-size: 14px;
                    transition: all 0.2s ease;
                    box-shadow: 0 2px 8px rgba(187, 96, 22, 0.3);
                    position: relative;
                    overflow: hidden;
                }

                .pdf_viewer__pdf-navigation button::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
                    transition: left 0.5s ease;
                }

                .pdf_viewer__pdf-navigation button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 16px rgba(187, 96, 22, 0.4);
                }

                .pdf_viewer__pdf-navigation button:hover::before {
                    left: 100%;
                }

                .pdf_viewer__pdf-navigation button:active {
                    transform: translateY(0);
                }

                .pdf_viewer__pdf-navigation button:disabled {
                    background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%);
                    color: #6c757d;
                    cursor: not-allowed;
                    transform: none;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                }

                .pdf_viewer__pdf-navigation span {
                    background: rgba(255, 255, 255, 0.9);
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-weight: 500;
                    color: var(--text-color, #333);
                    border: 1px solid rgba(0, 0, 0, 0.08);
                    backdrop-filter: blur(10px);
                }

                .pdf-viewer .recipe-search {
                  padding: 12px 16px;
                  background: linear-gradient(135deg, var(--background-color, #f8f9fa) 0%, #e9ecef 100%);
                  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
                }

                .pdf_viewer #category-select,
                .pdf_viewer #search-input {
                  padding: 12px 16px;
                  border: 2px solid rgba(187, 96, 22, 0.2);
                  border-radius: 8px;
                  font-size: 14px;
                  background: rgba(255, 255, 255, 0.95);
                  transition: all 0.2s ease;
                  backdrop-filter: blur(10px);
                  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                }

                .pdf_viewer #category-select:focus,
                .pdf_viewer #search-input:focus {
                  outline: none;
                  border-color: var(--primary-color, #bb6016);
                  box-shadow: 0 0 0 3px rgba(187, 96, 22, 0.1);
                  background: #ffffff;
                }

                .pdf_viewer #category-select:hover,
                .pdf_viewer #search-input:hover {
                  border-color: rgba(187, 96, 22, 0.4);
                  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
                }

                @media (max-width: 768px) {
                  .pdf_viewer__pdf-page {
                    padding: 12px;
                  }
                  
                  .pdf_viewer__pdf-navigation {
                    padding: 6px 12px;
                  }
                  
                  .recipe-search {
                    padding: 10px 12px;
                    gap: 8px;
                    flex-wrap: wrap;
                  }
                  
                  .pdf_viewer #category-select,
                  .pdf_viewer #search-input {
                    padding: 10px 12px;
                    font-size: 16px;
                    min-width: 0;
                    flex: 1;
                  }
                  
                  .pdf_viewer__pdf-navigation button {
                    padding: 10px 16px;
                    font-size: 13px;
                  }
                }
              </style>
              <div class="pdf_viewer">
                  ${
                    this.hasPageIndex
                      ? `
                    <div dir="rtl" class="recipe-search">  
                      <select id="category-select" class="category-select">
                          <option value="">כל הקטגוריות</option>
                          ${this.categories.map((category) => `<option value="${category}">${category}</option>`).join('')}
                      </select>
                      <input list="recipe-list" type="text" class="search-input" id="search-input" placeholder="חיפוש...">
                      <datalist id="recipe-list"></datalist>
                    </div>
                  `
                      : ''
                  }
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
      this.shadowRoot.getElementById('pdf_viewer__pdfImage').src = this.getImageSrc(
        this.currentPage,
      );
      this.shadowRoot.getElementById('pdf_viewer__pageNumber').textContent =
        `עמוד ${this.currentPage}`;
    }
  }

  addEventListeners() {
    if (!this.shadowRoot.querySelector('#pdf_viewer__prevPage').hasAttribute('listener')) {
      this.shadowRoot
        .getElementById('pdf_viewer__prevPage')
        .addEventListener('click', () => this.goToPage(this.currentPage - 1));
      this.shadowRoot.getElementById('pdf_viewer__prevPage').setAttribute('listener', 'true');
      this.shadowRoot
        .getElementById('pdf_viewer__nextPage')
        .addEventListener('click', () => this.goToPage(this.currentPage + 1));
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
          const selectedOption = this.searchResults.querySelector(
            `option[value="${this.searchInput.value}"]`,
          );
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
    this.currentPage = Math.max(1, Math.min(pageNumber, this.totalPages));
    this.render();
  }
}

customElements.define('pdf-viewer', PDFViewer);
