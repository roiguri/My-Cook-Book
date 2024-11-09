// gallery.js

class ComponentGallery {
  constructor() {
    this.initializeEventListeners();
    this.customizationSidebar = document.querySelector('.customization-sidebar');
    this.loadNavigation();
    this.setupSearch();
  }

  async loadNavigation() {
    // This could be loaded from a JSON file in a real application
    const navigationStructure = {
        "Playgrounds": {
          type: "folder",
          items: {
              "playground": {
                  type: "component",
                  name: "Playground",
                  path: "playground"
              }
          }
        },
        "Utilities": {
            type: "folder",
            items: {
                "modal": {
                    type: "component",
                    name: "Modal",
                    path: "modal"
                }
            }
        },
        "Folder Example": {
            type: "folder",
            items: {
                "text-input": {
                    type: "component",
                    name: "Text Input",
                    path: "text-input"
                },
                "Complex Forms": {
                    type: "folder",
                    items: {
                        "form-validation": {
                            type: "component",
                            name: "Form Validation",
                            path: "form-validation"
                        }
                    }
                }
            }
        }
    };

    this.renderNavigation(navigationStructure);
  }

  renderNavigation(structure, parentElement = document.querySelector('.nav-sidebar ul')) {
    parentElement.innerHTML = ''; // Clear existing items

    Object.entries(structure).forEach(([key, value]) => {
        const li = document.createElement('li');
        
        if (value.type === 'folder') {
            // Create folder structure
            const folderDiv = document.createElement('div');
            folderDiv.className = 'folder';
            
            const folderButton = document.createElement('button');
            folderButton.className = 'folder-toggle';
            folderButton.innerHTML = `
                <span class="folder-icon">▶</span>
                <span class="folder-name">${key}</span>
            `;
            folderDiv.appendChild(folderButton);

            const subList = document.createElement('ul');
            subList.className = 'folder-content';
            
            // Recursively render subfolder content
            this.renderNavigation(value.items, subList);
            
            folderDiv.appendChild(subList);
            li.appendChild(folderDiv);

            // Add click handler for folder
            folderButton.addEventListener('click', () => {
                folderButton.classList.toggle('open');
                subList.classList.toggle('open');
                folderButton.querySelector('.folder-icon').textContent = 
                    folderButton.classList.contains('open') ? '▼' : '▶';
            });
        } else {
            // Create component link
            const link = document.createElement('a');
            link.href = '#';
            link.setAttribute('data-component', value.path);
            link.textContent = value.name;
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.showComponent(value.path);
            });
            li.appendChild(link);
        }

        parentElement.appendChild(li);
    });
  }

  setupSearch() {
    const searchInput = document.getElementById('component-search');
    searchInput.addEventListener('input', (e) => {
        console.log("search input");
        const searchTerm = e.target.value.toLowerCase();
        this.filterNavigation(searchTerm);
    });
  }

  filterNavigation(searchTerm) {
    const allFolders = document.querySelectorAll('.folder');
    const allComponents = document.querySelectorAll('.nav-sidebar a');

    // Reset visibility
    allFolders.forEach(folder => {
        folder.style.display = 'block';
        folder.classList.remove('search-active');
    });

    allComponents.forEach(component => {
        component.style.display = 'block';
        const li = component.parentElement;
        li.style.display = 'block';
    });

    if (searchTerm) {
        // Filter components
        allComponents.forEach(component => {
            const matches = component.textContent.toLowerCase().includes(searchTerm);
            component.style.display = matches ? 'block' : 'none';
            const li = component.parentElement;
            li.style.display = matches ? 'block' : 'none';
        });

        // Show folders that have matching components
        allFolders.forEach(folder => {
            const hasVisibleComponents = [...folder.querySelectorAll('a')].some(
                component => component.style.display !== 'none'
            );
            
            if (hasVisibleComponents) {
                folder.style.display = 'block';
                folder.classList.add('search-active');
                // Open folders with matches
                const folderContent = folder.querySelector('.folder-content');
                const folderToggle = folder.querySelector('.folder-toggle');
                if (folderContent && folderToggle) {
                    folderContent.classList.add('open');
                    folderToggle.classList.add('open');
                }
            } else {
                folder.style.display = 'none';
            }
        });
    }
  }

  initializeEventListeners() {
      document.querySelectorAll('.nav-sidebar a').forEach(link => {
          link.addEventListener('click', (e) => {
              e.preventDefault();
              const componentName = e.target.getAttribute('data-component');
              this.showComponent(componentName);
          });
      });
  }

  async showComponent(componentName) {
      // Hide all component sections
      document.querySelectorAll('.component-section').forEach(section => {
          section.classList.remove('active');
      });

      // Show the selected component section
      const selectedSection = document.getElementById(`${componentName}-section`);
      if (selectedSection) {
          selectedSection.classList.add('active');
          
          // Load component content if not already loaded
          if (!selectedSection.hasAttribute('data-loaded')) {
              await this.loadComponentContent(componentName, selectedSection);
          }
      }
  }

  async loadComponentContent(componentName, section) {
      try {
          // Load component HTML
          const response = await fetch(`components/${componentName}/${componentName}-demo.html`);
          const html = await response.text();
          
          // Create temporary container to parse HTML
          const temp = document.createElement('div');
          temp.innerHTML = html;
          
          // Move customization controls to sidebar
          const customControls = temp.querySelector('.customization-controls');
          if (customControls) {
              this.customizationSidebar.innerHTML = customControls.innerHTML;
              customControls.remove();
          }
          
          // Set remaining content to section
          section.innerHTML = temp.innerHTML;
          section.setAttribute('data-loaded', 'true');

          // Load and execute component's JavaScript
          await this.loadComponentScript(componentName);
          
      } catch (error) {
          console.error(`Error loading component ${componentName}:`, error);
          section.innerHTML = '<p>Error loading component</p>';
      }
  }

  async loadComponentScript(componentName) {
      const script = document.createElement('script');
      script.src = `components/${componentName}/${componentName}-demo.js`;
      document.body.appendChild(script);
      
      return new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
      });
  }

  updateCodeSnippet(componentName, code) {
      const codeSnippet = document.getElementById(`${componentName}-code-snippet`);
      if (codeSnippet) {
          codeSnippet.textContent = code;
      }
  }
}

// Initialize gallery when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.gallery = new ComponentGallery();
  // Load default component
  window.gallery.showComponent('playground');
});