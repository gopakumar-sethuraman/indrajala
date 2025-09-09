const $ = (selector) => document.querySelector(selector);

async function loadLinks() {
  const response = await fetch('./data/links.json', { cache: 'no-store' });
  if (!response.ok) throw new Error('Failed to load links');
  const links = await response.json();
  links.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
  return links;
}

function escapeHTML(str = '') {
  return str.replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function autoLink(text = '') {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return escapeHTML(text).replace(urlRegex, url => `<a href="${url}" target="_blank" rel="noopener">${url}</a>`);
}

function formatNote(note = '') {
  return note
    .split(/\n{2,}/) // split on double line breaks
    .map(paragraph => `<p>${autoLink(paragraph.trim())}</p>`)
    .join('');
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function renderLinks(links) {
  const container = $('#links');
  container.innerHTML = links.map((link) => {
    const titleHTML = link.url
      ? `<h2><a href="${escapeHTML(link.url)}" target="_blank" rel="noopener">${escapeHTML(link.title)}</a></h2>`
      : `<h2>${escapeHTML(link.title)}</h2>`;

    const noteHTML = link.note ? formatNote(link.note) : '';

    let imageSection = '';
    if (link.images && link.images.length > 0) {
      if (link.images.length === 1) {
        imageSection = `
          <div class="single-image">
            <img src="${escapeHTML(link.images[0])}" alt="${escapeHTML(link.title)}">
          </div>
        `;
      } else {
        imageSection = `
          <div class="image-grid">
            ${link.images.map(src =>
              `<img src="${escapeHTML(src)}" alt="${escapeHTML(link.title)}">`
            ).join('')}
          </div>
        `;
      }
    }

    const dateHTML = link.addedAt
      ? `<div class="link-date">${formatDate(link.addedAt)}</div>`
      : '';

    return `
      <article class="link-card">
        ${titleHTML}
        ${noteHTML}
        ${imageSection}
        ${dateHTML}
      </article>
    `;
  }).join('');
}

(async function init() {
  try {
    const links = await loadLinks();
    renderLinks(links);
  } catch (err) {
    console.error(err);
    $('#links').innerHTML = `<p>⚠️ Could not load links. Check your data/links.json file.</p>`;
  }
})();