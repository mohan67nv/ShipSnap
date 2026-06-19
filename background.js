/**
 * Author: Mohana Nyamanahalli Venkatesha
 * Description: Service worker for ShipSnap. Listens for messages from the content script 
 * and opens the generator page with the scraped PR data.
 */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'OPEN_GENERATOR') {
    (async () => {
      try {
        // Store the PR data in local storage before opening the generator tab
        await chrome.storage.local.set({ prData: message.data });
        
        // Open the generator page in a new tab
        await chrome.tabs.create({ url: chrome.runtime.getURL('generator.html') });
        
        sendResponse({ status: 'success' });
      } catch (error) {
        console.error('Error opening generator:', error);
        sendResponse({ status: 'error', error: error.message });
      }
    })();
    return true; // Keep message channel open for async response
  }
});
