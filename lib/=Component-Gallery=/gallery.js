// gallery.js

class ComponentGallery {
  constructor() {
    this.navigationStructure = {
      "Playgrounds": {
        type: "folder",
        groupPath: "playgrounds",
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
          groupPath: "utilities",
          items: {
              "modal": {
                  type: "component",
                  name: "Modal",
                  path: "modal"
              }
          }
      },
      "Modals": {
        type: "folder",
        groupPath: "modals",
        items: {
            "confirmation-modal": {
                type: "component",
                name: "Confirmation Modal",
                path: "confirmation-modal"
            },
            "filter-modal": {
              type: "component",
              name: "Filter Modal",
              path: "filter-modal"
            },
            "image-approval": {
              type: "component",
              name: "Image Approval Modal",
              path: "image-approval"
            },
            "message-modal": {
              type: "component",
              name: "Message Modal",
              path: "message-modal"
            },
            "missing-image-upload": {
              type: "component",
              name: "Missing Image Upload Modal",
              path: "missing-image-upload"
            }
        }
      },
      // Multiple Folders Example
      // "Folder Example": {
      //     type: "folder",
      //     items: {
      //         "text-input": {
      //             type: "component",
      //             name: "Text Input",
      //             path: "text-input"
      //         },
      //         "Complex Forms": {
      //             type: "folder",
      //             items: {
      //                 "form-validation": {
      //                     type: "component",
      //                     name: "Form Validation",
      //                     path: "form-validation"
      //                 }
      //             }
      //         }
      //     }
      // }
    };

    this.initializeEventListeners();
    this.customizationSidebar = document.querySelector('.customization-sidebar');
    this.loadNavigation();
    this.setupSearch();
    this.cleanupUnusedSections();
  }

  async loadNavigation() {
    // This could be loaded from a JSON file in a real application
    this.renderNavigation(this.navigationStructure);
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
    // Get the component area
    const componentArea = document.querySelector('.component-area');
    
    // Hide all component sections
    document.querySelectorAll('.component-section').forEach(section => {
        section.classList.remove('active');
    });

    // Get or create the selected section
    let selectedSection = document.getElementById(`${componentName}-section`);
    if (!selectedSection) {
        // Create new section if it doesn't exist
        selectedSection = document.createElement('div');
        selectedSection.id = `${componentName}-section`;
        selectedSection.className = 'component-section';
        componentArea.appendChild(selectedSection);
    }

    // Show the selected component section
    selectedSection.classList.add('active');
    
    // Load component content if not already loaded
    if (!selectedSection.hasAttribute('data-loaded')) {
        await this.loadComponentContent(componentName, selectedSection);
    }
  }

  cleanupUnusedSections() {
    // Keep track of valid component paths
    const validComponents = new Set();
    const processItems = (items) => {
        Object.values(items).forEach(item => {
            if (item.type === 'component') {
                validComponents.add(item.path);
            } else if (item.type === 'folder' && item.items) {
                processItems(item.items);
            }
        });
    };
    
    processItems(this.navigationStructure);

    // Remove sections that don't correspond to current components
    document.querySelectorAll('.component-section').forEach(section => {
        const componentName = section.id.replace('-section', '');
        if (!validComponents.has(componentName)) {
            section.remove();
        }
    });
  }

  async loadComponentContent(componentName, section) {
      try {
          // Find component info from navigation structure
          const componentInfo = this.findComponentInfo(componentName);
          if (!componentInfo) {
              throw new Error('Component not found in navigation');
          }

          await this.loadComponentStyles(componentName, componentInfo);

          // Load component HTML
          const response = await fetch(`components/${componentInfo.groupPath}/${componentInfo.path}/${componentInfo.path}-demo.html`);
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
          await this.loadComponentScript(componentName, componentInfo);
          
      } catch (error) {
          console.error(`Error loading component ${componentName}:`, error);
          section.innerHTML = '<p>Error loading component</p>';
      }
  }

  async loadComponentScript(componentName, componentInfo) {
      const script = document.createElement('script');
      script.src = `components/${componentInfo.groupPath}/${componentInfo.path}/${componentInfo.path}-demo.js`;
      document.body.appendChild(script);
      
      return new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
      });
  }

  async loadComponentStyles(componentName, componentInfo) {
    try {
        // First check if CSS file exists
        const cssResponse = await fetch(`components/${componentInfo.groupPath}/${componentInfo.path}/${componentInfo.path}-demo.css`);
        if (!cssResponse.ok) {
            // CSS doesn't exist, just return
            return;
        }

        // CSS exists, load it
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `components/${componentInfo.groupPath}/${componentInfo.path}/${componentInfo.path}-demo.css`;
        
        return new Promise((resolve, reject) => {
            link.onload = resolve;
            link.onerror = reject;
            document.head.appendChild(link);
        });
    } catch (error) {
        // Silently handle missing CSS file
        console.log(`No CSS file found for ${componentName}`);
        return;
    }
  }

  findComponentInfo(componentName, structure = this.navigationStructure) {
    // Iterate through top-level groups (Utilities, Auth, etc.)
    for (const [groupName, group] of Object.entries(structure)) {
        if (!group.items) continue;

        // Search in group's items
        const searchInItems = (items) => {
            for (const [itemName, item] of Object.entries(items)) {
                // Direct component match
                if (item.type === 'component' && item.path === componentName) {
                    return {
                        ...item,
                        groupPath: group.groupPath
                    };
                }
                // If it's a nested folder, search its items
                if (item.type === 'folder' && item.items) {
                    const nestedResult = searchInItems(item.items);
                    if (nestedResult) return nestedResult;
                }
            }
            return null;
        };

        const result = searchInItems(group.items);
        if (result) return result;
    }
    return null;
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