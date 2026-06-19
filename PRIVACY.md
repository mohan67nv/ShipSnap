# ShipSnap Privacy Policy

**Effective Date:** June 19, 2026

ShipSnap ("the Extension") is a 100% client-side Chrome Extension designed to generate shareable image cards from GitHub Pull Requests. We respect your privacy and are committed to protecting it.

## 1. Data Collection
ShipSnap **does not** collect, store, transmit, or share any personal data, user analytics, telemetry, or tracking information.

## 2. Permissions & Data Usage
- **activeTab / Host Permissions (`https://github.com/*`):** Used strictly to read the Pull Request title and author name from the DOM of the active GitHub page you are viewing when you click the "Share PR" button.
- **GitHub API (`https://api.github.com/*`):** The Extension makes public, unauthenticated calls to the GitHub API directly from your browser to fetch line changes (additions/deletions) and repository language statistics. This data is never sent to any third-party servers.
- **Storage (`chrome.storage.local`):** Pull Request statistics are temporarily saved to your browser's local storage exclusively to pass data between the content script and the popup generator window. This data never leaves your browser and is overwritten on the next use.

## 3. Third-Party Services
ShipSnap does not use any third-party analytics or tracking services. It generates images entirely within your browser using a bundled, local version of `html-to-image`.

## 4. Contact
If you have any questions about this Privacy Policy, please open an issue on our GitHub repository: https://github.com/mohan67nv/ShipSnap/issues
