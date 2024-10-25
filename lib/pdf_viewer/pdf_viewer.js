class PDFViewer extends HTMLElement {
  constructor() {
      super();
      this.attachShadow({mode: 'open'});
      this.pdfPath = this.getAttribute('pdf-path');
      this.currentPage = this.getAttribute('start-page') || 1;
      this.totalPages = parseInt(this.getAttribute('total-pages')) || 92;
  }

  async connectedCallback() {
    this.render();
    this.addEventListeners();
  }

  async fetchPageIndex() {
    try {
        const db = firebase.firestore();
        const pageIndexDoc = await db.collection('cookbook').doc('recipes').get();
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

                .pdf_viewer__pdf-navigation button {
                    background-color: #007bff;
                    color: white;
                    border: none;
                    padding: 5px 10px;
                    border-radius: 5px;
                    cursor: pointer;
                }
              </style>
              <div class="pdf_viewer">
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
      // Attach event listeners only once
      if (!this.shadowRoot.querySelector('#pdf_viewer__prevPage').hasAttribute('listener')) {
          this.shadowRoot.getElementById('pdf_viewer__prevPage').addEventListener('click', () => this.goToPage(this.currentPage - 1));
          this.shadowRoot.getElementById('pdf_viewer__prevPage').setAttribute('listener', 'true');
          this.shadowRoot.getElementById('pdf_viewer__nextPage').addEventListener('click', () => this.goToPage(this.currentPage + 1));
          this.shadowRoot.getElementById('pdf_viewer__nextPage').setAttribute('listener', 'true');
      }
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