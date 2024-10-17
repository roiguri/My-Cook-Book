const componentList = document.querySelector('.component-list');
const componentDetails = document.getElementById('component-details');

componentList.addEventListener('click', (event) => {
    const componentName = event.target.dataset.component;
    if (componentName) {
        showComponentDetails(componentName);
    }
});

function showComponentDetails(componentName) {
    // Placeholder for fetching component data (replace with actual data)
    const componentData = getComponentData(componentName);

    // Generate HTML for component details
    let detailsHTML = `
        <h2>${componentData.name}</h2>
        <p>${componentData.description}</p>
        <h3>Inputs</h3>
        ${generateInputsHTML(componentData.inputs)}
        <h3>Events</h3>
        <ul>${componentData.events.map(event => `<li>${event}</li>`).join('')}</ul>
        <h3>Dependencies</h3>
        <ul>${componentData.dependencies.map(dependency => `<li>${dependency}</li>`).join('')}</ul>
        <h3>Demo</h3>
        <div class="demo-area">${componentData.demo}</div>
        <h3>Code Snippet</h3>
        <pre>${componentData.code}</pre>
    `;

    componentDetails.innerHTML = detailsHTML;

    // Generate code snippet
    const codeSnippet = generateCodeSnippet(componentName, componentData);
    detailsHTML += `<h3>Code Snippet</h3><pre><code>${codeSnippet}</code></pre>`;

    componentDetails.innerHTML = detailsHTML;

    // Add event listeners to input fields
    const inputFields = componentDetails.querySelectorAll('.input-group input, .input-group select');
    inputFields.forEach(inputField => {
        inputField.addEventListener('input', () => {
            const updatedCodeSnippet = generateCodeSnippet(componentName, componentData);
            const codeSnippetElement = componentDetails.querySelector('pre code');
            codeSnippetElement.textContent = updatedCodeSnippet;
        });
    });
}

function generateCodeSnippet(componentName, componentData) {
  const htmlSnippet = generateHTMLSnippet(componentName, componentData);
  const jsSnippet = generateJavaScriptSnippet(componentName, componentData);
  return `${htmlSnippet}\n\n<script>\n${jsSnippet}\n</script>`;
}

function generateHTMLSnippet(componentName, componentData) {
  const inputAttributes = componentData.inputs.map(input => {
      const inputValue = document.getElementById(input.name).value;
      return `${input.name}="${inputValue}"`;
  }).join(' ');
  return `<${componentName} ${inputAttributes}></${componentName}>`;
}

function generateJavaScriptSnippet(componentName, componentData) {
  // Placeholder for generating JavaScript snippet
  // This will depend on the specific component and its interactions
  let jsSnippet = '';
  if (componentName === 'custom-modal') {
      jsSnippet = `
          const myModal = document.getElementById('my-modal');
          myModal.addEventListener('modal-opened', () => {
              console.log('Modal opened!');
          });
      `;
  } else if (componentName === 'message-modal') {
      const message = document.getElementById('message').value;
      const title = document.getElementById('title').value;
      jsSnippet = `
          const myMessageModal = document.querySelector('message-modal');
          myMessageModal.show('${message}', '${title}');
      `;
  }
  return jsSnippet;
}

function generateInputsHTML(inputs) {
    let inputsHTML = '';
    inputs.forEach(input => {
        inputsHTML += `
            <div class="input-group">
                <label for="${input.name}">${input.name} (${input.type})</label>
                ${getInputElement(input)}
            </div>
        `;
    });
    return inputsHTML;
}

function getInputElement(input) {
    switch (input.type) {
        case 'string':
            return `<input type="text" id="${input.name}" value="${input.defaultValue || ''}">`;
        case 'number':
            return `<input type="number" id="${input.name}" value="${input.defaultValue || 0}">`;
        case 'boolean':
            return `<input type="checkbox" id="${input.name}" ${input.defaultValue ? 'checked' : ''}>`;
        case 'select':
            const options = input.options.map(option => `<option value="${option}">${option}</option>`).join('');
            return `<select id="${input.name}">${options}</select>`;
        default:
            return '';
    }
}

// Placeholder for fetching component data (replace with actual data fetching)
function getComponentData(componentName) {
    if (componentName === 'custom-modal') {
        return {
            name: 'Custom Modal',
            description: 'A basic modal component.',
            inputs: [
                { name: 'width', type: 'string', defaultValue: '300px' },
                { name: 'height', type: 'string', defaultValue: '200px' },
                { name: 'backgroundColor', type: 'string', defaultValue: '#f0f0f0' }
            ],
            events: ['modal-opened', 'modal-closed'],
            dependencies: [],
            demo: '<custom-modal id="my-modal">This is the modal content.</custom-modal><button onclick="document.getElementById(\'my-modal\').open()">Open Modal</button>',
            code: `class Modal extends HTMLElement {
                // ... Modal code ...
            }`
        };
    } else if (componentName === 'message-modal') {
        return {
            name: 'Message Modal',
            description: 'A modal component for displaying messages.',
            inputs: [
                { name: 'message', type: 'string', defaultValue: 'This is a message.' },
                { name: 'title', type: 'string', defaultValue: 'Message Title' }
            ],
            events: ['modal-opened', 'modal-closed'],
            dependencies: ['modal.js'],
            demo: '<message-modal></message-modal><button onclick="document.querySelector(\'message-modal\').show(\'This is the message!\', \'This is the title\')">Open Modal</button>',
            code: `class MessageModal extends Modal {
                // ... MessageModal code ...
            }`
        };
    }
}