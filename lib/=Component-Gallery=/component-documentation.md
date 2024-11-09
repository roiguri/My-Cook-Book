# Adding New Components to the Gallery

This guide explains how to add new components to the Component Gallery.

## Directory Structure
```
components/
└── your-component/
    ├── your-component-demo.html    # Component documentation and demo
    ├── your-component-demo.css     # Component-specific styles
    └── your-component-demo.js      # Component-specific logic
```

## Step-by-Step Guide

### 1. Create Component Files

Create a new folder under `components/` with your component name. Add these files:

#### a. Component Demo HTML (`your-component-demo.html`)
```html
<section class="component-docs">
    <h2>Your Component Name</h2>
    
    <!-- Component Description -->
    <div class="component-description">
        <p>Brief description of your component and its purpose.</p>
    </div>

    <!-- Attributes Documentation -->
    <div class="component-attributes">
        <h3>Attributes</h3>
        <table class="attributes-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Default</th>
                    <th>Description</th>
                </tr>
            </thead>
            <tbody>
                <!-- Add your component's attributes here -->
                <tr>
                    <td>attribute-name</td>
                    <td>type</td>
                    <td>default-value</td>
                    <td>Description of the attribute</td>
                </tr>
            </tbody>
        </table>
    </div>

    <!-- Events Documentation -->
    <div class="component-events">
        <h3>Events</h3>
        <table class="events-table">
            <thead>
                <tr>
                    <th>Event Name</th>
                    <th>Description</th>
                    <th>Detail</th>
                </tr>
            </thead>
            <tbody>
                <!-- Add your component's events here -->
                <tr>
                    <td>event-name</td>
                    <td>Description of when the event fires</td>
                    <td>Structure of the event detail object</td>
                </tr>
            </tbody>
        </table>
    </div>

    <!-- Live Demo -->
    <div class="component-demo">
        <h3>Live Demo</h3>
        <div class="demo-area">
            <!-- Add your live demo implementation here -->
        </div>
    </div>

    <!-- Code Example -->
    <div class="component-code">
        <h3>Code Example</h3>
        <pre class="code-snippet" id="your-component-code-snippet">
<!-- Add your code example here -->
        </pre>
    </div>

    <!-- Customization Controls -->
    <div class="customization-controls">
        <h3>Customize</h3>
        <!-- Add your customization controls here -->
        <div class="customization-control">
            <label for="control-id">Control Label:</label>
            <input type="text" id="control-id" value="default">
        </div>
        <button class="apply-customization">Apply Changes</button>
    </div>

    <!-- Event Monitor -->
    <div class="event-monitor">
        <h3>Event Monitor</h3>
        <div class="event-log" id="your-component-event-log">
            <p class="event-log-empty">Events will be displayed here...</p>
        </div>
    </div>
</section>
```

#### b. Component Demo JavaScript (`your-component-demo.js`)
```javascript
class YourComponentDemo {
    constructor() {
        this.initializeDemo();
    }

    initializeDemo() {
        // Setup demo functionality
        this.setupEventLogging();
        this.setupCustomizationControls();
    }

    setupEventLogging() {
        const eventLog = document.getElementById('your-component-event-log');
        
        // Add event listeners for your component
        const demoComponent = document.querySelector('your-component');
        ['event-name'].forEach(eventName => {
            demoComponent?.addEventListener(eventName, (event) => {
                this.logEvent(eventName, event.detail);
            });
        });
    }

    setupCustomizationControls() {
        const applyButton = document.querySelector('.customization-sidebar .apply-customization');
        if (applyButton) {
            applyButton.addEventListener('click', () => this.applyCustomizations());
        }
    }

    applyCustomizations() {
        // Apply customization changes and update code snippet
        this.updateCodeSnippet();
    }

    updateCodeSnippet() {
        // Update the code snippet based on current customization
        const code = `
<!-- Your updated code example -->
        `.trim();

        window.gallery.updateCodeSnippet('your-component', code);
    }

    logEvent(eventName, detail) {
        const eventLog = document.getElementById('your-component-event-log');
        const timestamp = new Date().toLocaleTimeString();
        const eventEntry = document.createElement('div');
        eventEntry.className = 'event-entry';
        eventEntry.textContent = `${timestamp}: ${eventName} event fired`;
        
        const emptyMessage = eventLog.querySelector('.event-log-empty');
        if (emptyMessage) {
            eventLog.removeChild(emptyMessage);
        }
        
        eventLog.insertBefore(eventEntry, eventLog.firstChild);
    }
}

// Initialize demo when script loads
new YourComponentDemo();
```

### 2. Add to Navigation

Add your component to the navigation structure in `gallery.js`:

```javascript
const navigationStructure = {
    "Category Name": {
        type: "folder",
        items: {
            "your-component": {
                type: "component",
                name: "Your Component",
                path: "your-component"
            }
        }
    }
};
```

### 3. Create Component Section

Add a section for your component in `index.html`:

```html
<div id="your-component-section" class="component-section"></div>
```

## Best Practices

1. **Documentation**
   - Provide clear, concise descriptions
   - Document all attributes, events, and methods
   - Include common use cases and examples

2. **Demo Implementation**
   - Show practical usage scenarios
   - Include interactive elements
   - Demonstrate component features

3. **Customization**
   - Add relevant customization options
   - Provide immediate visual feedback
   - Keep code snippet in sync with changes

4. **Event Monitoring**
   - Log all relevant events
   - Show event details when applicable
   - Clear old events periodically

5. **Code Organization**
   - Follow consistent naming conventions
   - Separate concerns (HTML, JS, CSS)
   - Comment complex implementations

## Testing Your Component

Before submitting:
1. Test all documented features
2. Verify customization controls work
3. Check event logging functionality
4. Test responsive behavior
5. Validate code examples

## Component Checklist

- [ ] Component folder created with required files
- [ ] Documentation complete with all sections
- [ ] Live demo implemented
- [ ] Customization controls working
- [ ] Event monitoring functional
- [ ] Code examples up to date
- [ ] Added to navigation structure
- [ ] Testing completed
- [ ] Responsive design verified
