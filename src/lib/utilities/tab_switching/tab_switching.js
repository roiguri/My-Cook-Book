class TabSwitching extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.tabs = [];
    this.activeTab = 0;
    this.tabsColor = this.hasAttribute('tabs-color') ? this.getAttribute('tabs-color') : '#f0f0f0';
    this.contentWindowColor = this.hasAttribute('content-window-color')
      ? this.getAttribute('content-window-color')
      : '#ffffff';
  }

  connectedCallback() {
    this.tabs = this.querySelectorAll('tab');
    if (this.hasAttribute('width')) {
      this.style.setProperty('--tab-switching-width', this.getAttribute('width'));
    }
    if (this.hasAttribute('height')) {
      this.style.setProperty('--tab-switching-height', this.getAttribute('height'));
    }

    this.render();
    this.setupEventListeners();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>${this.styles()}</style>
      <div class="tab-switching">
        <div class="tab-switching__tabs">
          ${this.renderTabs()}
        </div>
        <div class="tab-switching__content-window">
          ${this.renderContent()}
        </div>
      </div>
    `;

    this.dispatchEvent(new CustomEvent('tab-content-ready'));
  }

  styles() {
    return `
      :host {
        display: block;
        width: var(--tab-switching-width, 100%);
        height: var(--tab-switching-height, auto);
      }
      .tab-switching {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        border: 1px solid #ccc;
        box-sizing: border-box;
      }
      .tab-switching__tabs {
        display: flex;
        background-color: ${this.tabsColor};
        flex-shrink: 0;
      }
      .tab-switching__tab {
        padding: 10px;
        cursor: pointer;
        border-bottom: 2px solid transparent; 
        transition: background-color 0.3s ease, border-color 0.3s ease;
      }
      .tab-switching__tab:hover {
        background-color: #eee; 
      }
      .tab-switching__tab.active {
        border-bottom-color: #bb6016; 
        background-color: #ddd;
      }
      .tab-switching__content-window {
        background-color: ${this.contentWindowColor};
        flex-grow: 1;
        overflow: auto;
      }
      /* Mobile responsiveness */
      @media (max-width: 600px) {
        .tab-switching__tabs {
          flex-direction: column;
        }
        .tab-switching__tab {
          border-bottom: 1px solid #ccc;
          text-align: center; 
        }
      }
    `;
  }

  renderTabs() {
    return Array.from(this.tabs)
      .map(
        (tab, index) => `
      <div class="tab-switching__tab ${index === this.activeTab ? 'active' : ''}" data-index="${index}">
        ${tab.getAttribute('name')}
      </div>
    `,
      )
      .join('');
  }

  renderContent() {
    if (this.tabs[this.activeTab]) {
      return this.tabs[this.activeTab].innerHTML;
    }
    return '';
  }

  setupEventListeners() {
    this.shadowRoot.querySelectorAll('.tab-switching__tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        this.setActiveTab(parseInt(tab.dataset.index));
      });
    });
  }

  setActiveTab(index) {
    this.activeTab = index;
    this.render();
    this.setupEventListeners();
  }
}

customElements.define('tab-switching', TabSwitching);
