/**
 * Fetches HTML content from a given path, parses it, extracts content from a specified element,
 * and injects it into a target element in the current document.
 *
 * @param {string} pageHtmlPath - The path to the HTML file to fetch (e.g., 'pages/categories.html').
 * @param {string} mainElementSelector - The CSS selector for the element whose content
 *                                     is to be extracted from the fetched HTML (e.g., 'main').
 * @param {string} targetElementId - The ID of the element in the current document where
 *                                   the content will be injected (e.g., 'app-content').
 * @returns {Promise<HTMLElement>} A Promise that resolves with the target DOM element if the content
 *                                is successfully loaded and injected, and rejects if an error occurs.
 */
export async function loadPageContent(pageHtmlPath, mainElementSelector, targetElementId) {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await fetch(pageHtmlPath);
      if (!response.ok) {
        reject(new Error(`Failed to fetch ${pageHtmlPath}: ${response.status} ${response.statusText}`));
        return;
      }
      const htmlText = await response.text();

      const parser = new DOMParser();
      const parsedDoc = parser.parseFromString(htmlText, 'text/html');

      const sourceContentElement = parsedDoc.querySelector(mainElementSelector);
      if (!sourceContentElement) {
        reject(new Error(`Element with selector "${mainElementSelector}" not found in ${pageHtmlPath}`));
        return;
      }

      const targetElement = document.getElementById(targetElementId);
      if (!targetElement) {
        reject(new Error(`Target element with ID "${targetElementId}" not found in the current document.`));
        return;
      }

      // Clear existing content and append new content
      // Using innerHTML for simplicity as per requirements,
      // but be mindful of potential script execution issues if the content is not trusted.
      targetElement.innerHTML = sourceContentElement.innerHTML;
      console.log(`Content from ${pageHtmlPath} (${mainElementSelector}) loaded into #${targetElementId}`);
      resolve(targetElement); // Resolve with the targetElement

    } catch (error) {
      console.error('Error in loadPageContent:', error);
      reject(error);
    }
  });
}
