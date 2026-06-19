/**
 * Author: Mohana Nyamanahalli Venkatesha
 * Description: Content script for ShipSnap. Injects a "📸 Share PR" button into GitHub PR pages.
 * Extracts PR metadata, stats, and languages via the GitHub API, then sends data to the generator.
 */

function injectShareButton() {
  if (document.getElementById('shipsnap-share-btn')) return;

  const titleAreas = document.querySelectorAll('[data-component="TitleArea"]');
  const titleArea = titleAreas[0];
  if (!titleArea) return;

  const shareBtn = document.createElement('button');
  shareBtn.id = 'shipsnap-share-btn';
  shareBtn.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:inline;vertical-align:middle;margin-right:5px;">
      <rect width="16" height="16" rx="3" fill="white" fill-opacity="0.2"/>
      <path d="M8 2L10 6H14L11 9L12 13L8 10.5L4 13L5 9L2 6H6L8 2Z" fill="white"/>
    </svg>
    Share PR
  `;
  shareBtn.title = 'Generate a shareable card with ShipSnap';

  Object.assign(shareBtn.style, {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '5px 14px',
    marginLeft: '10px',
    fontSize: '14px',
    fontWeight: '600',
    lineHeight: '20px',
    cursor: 'pointer',
    borderRadius: '6px',
    border: '1px solid rgba(240,246,252,0.15)',
    background: 'linear-gradient(135deg, #8250df 0%, #a371f7 100%)',
    color: '#ffffff',
    verticalAlign: 'middle',
    whiteSpace: 'nowrap',
    boxShadow: '0 1px 3px rgba(130,80,223,0.4)',
    transition: 'all 0.15s ease',
    flexShrink: '0'
  });

  shareBtn.addEventListener('mouseover', () => {
    shareBtn.style.boxShadow = '0 2px 8px rgba(130,80,223,0.6)';
    shareBtn.style.transform = 'translateY(-1px)';
  });
  shareBtn.addEventListener('mouseout', () => {
    shareBtn.style.boxShadow = '0 1px 3px rgba(130,80,223,0.4)';
    shareBtn.style.transform = 'translateY(0)';
  });

  shareBtn.addEventListener('click', async () => {
    shareBtn.innerHTML = '⏳ Loading...';
    shareBtn.disabled = true;
    shareBtn.style.opacity = '0.7';

    const prData = await extractPRData();
    if (prData) {
      chrome.runtime.sendMessage({ action: 'OPEN_GENERATOR', data: prData });
    } else {
      alert('ShipSnap: Could not extract PR data. Please try again.');
    }

    shareBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:inline;vertical-align:middle;margin-right:5px;">
        <rect width="16" height="16" rx="3" fill="white" fill-opacity="0.2"/>
        <path d="M8 2L10 6H14L11 9L12 13L8 10.5L4 13L5 9L2 6H6L8 2Z" fill="white"/>
      </svg>
      Share PR
    `;
    shareBtn.disabled = false;
    shareBtn.style.opacity = '1';
  });

  titleArea.appendChild(shareBtn);
}

async function extractPRData() {
  try {
    const pathParts = window.location.pathname.split('/');
    const repoOwner = pathParts[1];
    const repoName = pathParts[2];
    const prNumberFromUrl = pathParts[4] || '';
    const repo = `${repoOwner}/${repoName}`;
    const prNumber = `#${prNumberFromUrl}`;

    // PR Title
    const titleSpan = document.querySelector('.markdown-title');
    const title = titleSpan ? titleSpan.textContent.trim() : document.title.split('·')[0].trim();

    // Author — fallback to repo owner
    let authorName = repoOwner;
    const authorLinks = document.querySelectorAll('[data-hpc] a[href^="/"][data-component="Link"]');
    if (authorLinks.length > 0) {
      authorName = authorLinks[0].textContent.trim();
    }

    const avatarUrl = `https://github.com/${authorName}.png?size=80`;

    // Fetch PR stats + language info via GitHub API (public repos, no auth needed)
    let additions = 0;
    let deletions = 0;
    let changedFiles = 0;
    let languages = [];

    try {
      // Fetch PR stats
      const prResp = await fetch(`https://api.github.com/repos/${repo}/pulls/${prNumberFromUrl}`);
      if (prResp.ok) {
        const prJson = await prResp.json();
        additions = prJson.additions || 0;
        deletions = prJson.deletions || 0;
        changedFiles = prJson.changed_files || 0;
        authorName = prJson.user?.login || authorName;
      }
    } catch (e) { /* API rate limit or private repo - use defaults */ }

    try {
      // Fetch repo languages
      const langResp = await fetch(`https://api.github.com/repos/${repo}/languages`);
      if (langResp.ok) {
        const langJson = await langResp.json();
        // Sort by usage, take top 4
        languages = Object.entries(langJson)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4)
          .map(([lang]) => lang);
      }
    } catch (e) { /* Fallback silently */ }

    return {
      title, prNumber, repo, authorName, avatarUrl,
      additions, deletions, changedFiles, languages
    };
  } catch (error) {
    console.error('ShipSnap: Error extracting PR data', error);
    return null;
  }
}

// Debounced observer for SPA navigation
let debounceTimer = null;
const observer = new MutationObserver(() => {
  if (!window.location.pathname.includes('/pull/')) return;
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(injectShareButton, 600);
});

observer.observe(document.body, { childList: true, subtree: true });
setTimeout(injectShareButton, 1000);
