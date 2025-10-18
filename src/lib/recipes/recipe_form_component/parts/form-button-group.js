/**
 * FormButtonGroup Component
 * -------------------------
 * Handles form action buttons for recipe forms including:
 * - Submit button with customizable text
 * - Clear button with customizable text
 * - Disabled state management
 *
 * This component is focused on form actions and button state management.
 */

import styles from '../recipe_form_component.css?inline';

class FormButtonGroup extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // Get button text from attributes with defaults
    this.clearButtonText = this.getAttribute('clear-text') || 'נקה';
    this.submitButtonText = this.getAttribute('submit-text') || 'שלח מתכון';
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      ${this.template()}
    `;
  }

  template() {
    return `
      <div class="recipe-form__group--buttons">
        <button type="button" id="clear-button" class="recipe-form__button recipe-form__button--clear">${this.clearButtonText}</button>
        <button type="button" id="submit-button" class="recipe-form__button recipe-form__button--submit">${this.submitButtonText}</button>
      </div>
    `;
  }

  setupEventListeners() {
    const clearButton = this.shadowRoot.getElementById('clear-button');
    const submitButton = this.shadowRoot.getElementById('submit-button');

    clearButton.addEventListener('click', (event) => {
      event.preventDefault();
      this.dispatchEvent(
        new CustomEvent('clear-clicked', {
          bubbles: true,
          composed: true,
        }),
      );
    });

    submitButton.addEventListener('click', (event) => {
      event.preventDefault();

      // Dispatch custom event for parent component to handle
      this.dispatchEvent(
        new CustomEvent('submit-clicked', {
          bubbles: true,
          composed: true,
        }),
      );
    });
  }

  /**
   * Sets disabled state for all buttons
   * @param {boolean} disabled - Whether to disable the buttons
   */
  setDisabled(disabled) {
    const buttons = this.shadowRoot.querySelectorAll('button');
    buttons.forEach((button) => {
      button.disabled = disabled;
    });
  }

  /**
   * Sets loading state for submit button
   * @param {boolean} isLoading - Whether form is in loading state
   * @param {string} loadingText - Text to show during loading
   */
  setLoadingState(isLoading, loadingText = 'שולח...') {
    const submitButton = this.shadowRoot.getElementById('submit-button');
    if (submitButton) {
      if (isLoading) {
        submitButton.disabled = true;
        submitButton.classList.add('loading');
        submitButton.textContent = loadingText;
      } else {
        submitButton.disabled = false;
        submitButton.classList.remove('loading');
        submitButton.textContent = this.submitButtonText;
      }
    }
  }

  /**
   * Updates button text
   * @param {Object} texts - Object with clearText and/or submitText properties
   */
  updateButtonTexts(texts = {}) {
    if (texts.clearText) {
      this.clearButtonText = texts.clearText;
      const clearButton = this.shadowRoot.getElementById('clear-button');
      if (clearButton) clearButton.textContent = texts.clearText;
    }

    if (texts.submitText) {
      this.submitButtonText = texts.submitText;
      const submitButton = this.shadowRoot.getElementById('submit-button');
      if (submitButton) submitButton.textContent = texts.submitText;
    }
  }
}

customElements.define('form-button-group', FormButtonGroup);
