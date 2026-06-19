/**
 * Author: Mohana Nyamanahalli Venkatesha
 * Description: Generator page JS for ShipSnap. Handles live card preview updates,
 * theme switching, custom caption, PNG download, and social share text generation.
 */

const LANG_COLORS = {
  JavaScript:'#f1e05a', TypeScript:'#3178c6', Python:'#3572A5', Rust:'#dea584',
  Go:'#00ADD8', Java:'#b07219', Kotlin:'#A97BFF', Swift:'#F05138', 'C++':'#f34b7d',
  C:'#555555', 'C#':'#178600', Ruby:'#701516', PHP:'#4F5D95', HTML:'#e34c26',
  CSS:'#563d7c', Shell:'#89e051', Dart:'#00B4AB', Vue:'#41b883', Svelte:'#ff3e00',
  Scala:'#c22d40', R:'#198CE7',
};

const THEMES = {
  feature: { badge: '🌟 Feature Ship', badgeLabel: 'Merged ✨' },
  bugfix:  { badge: '🐛 Bug Squash',   badgeLabel: 'Fixed 🐛' },
  perf:    { badge: '⚡ Perf Win',     badgeLabel: 'Optimized ⚡' },
  oss:     { badge: '🌐 Open Source',  badgeLabel: 'Contributed 🌐' },
};

const TWEET_TEMPLATES = {
  feature: (pr, caption) => [
    `🌟 Just shipped: ${pr.title}`,
    caption ? `\n"${caption}"` : '',
    `\n✅ ${pr.changedFiles} files · +${fmtNum(pr.additions)} / −${fmtNum(pr.deletions)}`,
    pr.languages?.length ? `\n🏷 ${pr.languages.join(' · ')}` : '',
    `\n📦 ${pr.repo}${pr.prNumber}`,
    `\n\nGenerated with ShipSnap 📸\n#buildinpublic #devlife #opensource`,
  ].join(''),

  bugfix: (pr, caption) => [
    `🐛 Squashed that bug! ${pr.title}`,
    caption ? `\n"${caption}"` : '',
    `\n🔧 ${pr.changedFiles} files changed · +${fmtNum(pr.additions)} / −${fmtNum(pr.deletions)}`,
    `\n📦 ${pr.repo}${pr.prNumber}`,
    `\n\nShared with ShipSnap 📸\n#bugfix #debugging #devlife`,
  ].join(''),

  perf: (pr, caption) => [
    `⚡ Performance win landed! ${pr.title}`,
    caption ? `\n"${caption}"` : '',
    `\n📊 ${pr.changedFiles} files · +${fmtNum(pr.additions)} / −${fmtNum(pr.deletions)}`,
    `\n📦 ${pr.repo}${pr.prNumber}`,
    `\n\nShared with ShipSnap 📸\n#performance #optimization #buildinpublic`,
  ].join(''),

  oss: (pr, caption) => [
    `🌐 My PR got merged into ${pr.repo}! 🎉`,
    `\n"${pr.title}"`,
    caption ? `\n${caption}` : '',
    `\n+${fmtNum(pr.additions)} / −${fmtNum(pr.deletions)} · ${pr.changedFiles} files`,
    `\n\nShared with ShipSnap 📸\n#opensource #hacktoberfest #buildinpublic`,
  ].join(''),
};

function fmtNum(n) {
  if (!n) return '0';
  return Number(n).toLocaleString();
}

document.addEventListener('DOMContentLoaded', async () => {
  let prData = null;
  let currentTheme = 'feature';

  // ── 1. Load PR data ─────────────────────────────────────────────
  try {
    const result = await chrome.storage.local.get('prData');
    prData = result.prData;
  } catch { /* Running outside extension context — use demo data */ }

  if (!prData) {
    // Demo / fallback data for testing
    prData = {
      title: 'Add dark mode and accessibility improvements',
      prNumber: '#42',
      repo: 'mohan67nv/awesome-project',
      authorName: 'mohan67nv',
      avatarUrl: 'https://github.com/mohan67nv.png?size=80',
      additions: 247,
      deletions: 12,
      changedFiles: 8,
      languages: ['TypeScript', 'CSS', 'HTML'],
    };
  }

  // ── 2. Populate static fields ────────────────────────────────────
  document.getElementById('card-title').textContent  = prData.title || 'Untitled PR';
  document.getElementById('card-repo').textContent   = prData.repo  || '';
  document.getElementById('card-pr-number').textContent = prData.prNumber || '';
  document.getElementById('card-author').textContent = prData.authorName || '';
  document.getElementById('header-pr-info').textContent =
    `${prData.repo} ${prData.prNumber}`;

  // Stats
  const files = prData.changedFiles || 0;
  const add   = prData.additions   || 0;
  const del   = prData.deletions   || 0;

  document.getElementById('stat-files-count').textContent = `${files} file${files !== 1 ? 's' : ''}`;
  document.getElementById('stat-additions').textContent   = fmtNum(add);
  document.getElementById('stat-deletions').textContent   = fmtNum(del);

  if (!files && !add && !del) {
    document.getElementById('stats-row').style.display = 'none';
  }

  // Language badges
  const langBadges = document.getElementById('lang-badges');
  if (prData.languages?.length) {
    prData.languages.forEach(lang => {
      const b = document.createElement('span');
      b.className = 'lang-badge';
      const col = LANG_COLORS[lang];
      if (col) {
        b.style.cssText = `background:${col}18;color:${col};border-color:${col}40`;
      }
      b.textContent = lang;
      langBadges.appendChild(b);
    });
  } else {
    langBadges.style.display = 'none';
  }

  // Avatar as base64
  const avatarEl = document.getElementById('card-avatar');
  if (prData.avatarUrl) {
    try {
      const resp = await fetch(prData.avatarUrl);
      const blob = await resp.blob();
      const reader = new FileReader();
      reader.onloadend = () => { avatarEl.src = reader.result; };
      reader.readAsDataURL(blob);
    } catch {
      avatarEl.src = prData.avatarUrl;
    }
  }

  // ── 3. Caption input — live update ───────────────────────────────
  const captionInput    = document.getElementById('caption-input');
  const captionLenEl   = document.getElementById('caption-len');
  const cardCaption    = document.getElementById('card-caption');
  const cardCaptionTxt = document.getElementById('card-caption-text');

  captionInput.addEventListener('input', () => {
    const val = captionInput.value.trim();
    captionLenEl.textContent = captionInput.value.length;
    if (val) {
      cardCaption.style.display = 'block';
      cardCaptionTxt.textContent = val;
    } else {
      cardCaption.style.display = 'none';
    }
  });

  // ── 4. Theme switching ───────────────────────────────────────────
  const captureArea = document.getElementById('capture-area');

  function applyTheme(theme) {
    currentTheme = theme;

    // Update data-theme attribute (triggers CSS variables)
    captureArea.setAttribute('data-theme', theme);

    // Update card badge text
    document.getElementById('card-theme-badge').textContent = THEMES[theme].badge;
    document.getElementById('badge-label').textContent       = THEMES[theme].badgeLabel;

    // Update theme button active state
    document.querySelectorAll('.theme-card').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === theme);
    });
  }

  document.querySelectorAll('.theme-card').forEach(btn => {
    btn.addEventListener('click', () => applyTheme(btn.dataset.theme));
  });

  // ── 5. Download PNG ──────────────────────────────────────────────
  const downloadBtn = document.getElementById('download-btn');
  downloadBtn.addEventListener('click', async () => {
    downloadBtn.textContent = '⏳ Rendering…';
    downloadBtn.disabled = true;

    await new Promise(r => setTimeout(r, 300)); // let fonts settle

    try {
      const dataUrl = await htmlToImage.toPng(captureArea, {
        quality: 1.0,
        pixelRatio: 3,
        backgroundColor: '#070d17',
        skipFonts: true, // Avoid CORS errors from cross-origin font stylesheets
      });

      const safeRepo = (prData.repo || 'pr').replace('/', '-');
      const safePR   = (prData.prNumber || '').replace('#', '');
      const a = document.createElement('a');
      a.download = `ShipSnap-${safeRepo}-${safePR}.png`;
      a.href = dataUrl;
      a.click();
    } catch (err) {
      console.error('ShipSnap: PNG generation failed', err);
      alert('ShipSnap: Failed to generate image. See console.');
    } finally {
      downloadBtn.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        Download PNG`;
      downloadBtn.disabled = false;
    }
  });

  // ── 6. Copy Post Text ────────────────────────────────────────────
  const copyBtn  = document.getElementById('copy-tweet-btn');
  const copyToast = document.getElementById('copy-toast');

  copyBtn.addEventListener('click', async () => {
    const caption = captionInput.value.trim();
    const tweetFn = TWEET_TEMPLATES[currentTheme] || TWEET_TEMPLATES.feature;
    const text = tweetFn(prData, caption);

    try {
      await navigator.clipboard.writeText(text);
      copyToast.classList.remove('hidden');
      setTimeout(() => copyToast.classList.add('hidden'), 2500);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      copyToast.classList.remove('hidden');
      setTimeout(() => copyToast.classList.add('hidden'), 2500);
    }
  });

  // ── 7. Share on X ────────────────────────────────────────────────
  document.getElementById('share-x-btn').addEventListener('click', () => {
    const caption = captionInput.value.trim();
    const tweetFn = TWEET_TEMPLATES[currentTheme] || TWEET_TEMPLATES.feature;
    const text = tweetFn(prData, caption);
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener');
  });

  // ── 8. Share on LinkedIn ─────────────────────────────────────────
  document.getElementById('share-li-btn').addEventListener('click', () => {
    const caption = captionInput.value.trim();
    const body = [
      `🌟 Just shipped: ${prData.title}`,
      caption ? `\n\n${caption}` : '',
      `\n\n📊 ${prData.changedFiles} files changed · +${fmtNum(prData.additions)} additions · −${fmtNum(prData.deletions)} deletions`,
      prData.languages?.length ? `\n🏷 Built with: ${prData.languages.join(', ')}` : '',
      `\n\n#buildinpublic #developer #softwareengineering #coding`,
    ].join('');

    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://github.com/' + prData.repo)}&summary=${encodeURIComponent(body)}`;
    window.open(url, '_blank', 'noopener');
  });
});
