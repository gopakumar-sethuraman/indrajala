const $ = (selector) => document.querySelector(selector);

async function loadLinks() {
  const timestamp = new Date().getTime();
  const response = await fetch(`./data/links.json?t=${timestamp}`, { cache: 'no-store' });
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

function isVideoLink(link) {
  const combined = `${link.url} ${link.note || ""}`;
  return /youtube\.com|dai\.ly/.test(combined);
}

function formatDate(dateString) {
  const [year, month, day] = dateString.slice(0, 10).split("-");
  const localDate = new Date(year, month - 1, day);
  return localDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function formatNoteElement(note = '') {
  const p = document.createElement("p");

  // Step 1: Parse Markdown-style links [text](url)
  let parsed = note.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_, text, url) => {
    return `<a href="${escapeHTML(url)}" target="_blank" rel="noopener">${escapeHTML(text)}</a>`;
  });

  // Step 2: Bold (**text**)
  parsed = parsed.replace(/\*\*([^*]+)\*\*/g, (_, text) => `<strong>${escapeHTML(text)}</strong>`);

  // Step 3: Italic (*text*)
  parsed = parsed.replace(/\*([^*]+)\*/g, (_, text) => `<em>${escapeHTML(text)}</em>`);

  // Step 4: Underline (__text__)
  parsed = parsed.replace(/__([^_]+)__/g, (_, text) => `<u>${escapeHTML(text)}</u>`);

  // Step 5: Blockquotes (> text)
  parsed = parsed.replace(/^> (.+)$/gm, (_, text) => {
  return `<blockquote>${escapeHTML(text)}</blockquote>`;});

  // Step 6: Auto-link raw URLs (skip if already inside <a>)
  parsed = parsed.replace(/(?<!href=")(https?:\/\/[^\s]+)/g, url =>
    `<a href="${escapeHTML(url)}" target="_blank" rel="noopener">${escapeHTML(url)}</a>`
  );

  // Step 6: Inject each line safely
  const lines = parsed.split(/\r?\n/);
  lines.forEach(line => {
    const span = document.createElement("span");
    span.innerHTML = line;
    p.appendChild(span);
    p.appendChild(document.createElement("br"));
  });

  return p;
}

function renderLinks(links) {
  const container = $('#links');
  container.innerHTML = "";

  links.forEach(link => {
    const isVideo = isVideoLink(link);
    const article = document.createElement("article");
    article.classList.add("link-card");
    if (isVideo) article.classList.add("video-card");
    if (isVideo && link.thumbnail) {
    const thumb = document.createElement("img");
    thumb.src = link.thumbnail;
    thumb.alt = `Thumbnail for ${link.title}`;
    thumb.className = "video-thumbnail";
    article.appendChild(thumb);
}

    const h2 = document.createElement("h2");
    const a = document.createElement("a");
    a.href = link.url;
    a.target = "_blank";
    a.rel = "noopener";

    if (isVideo) {
      const playIcon = document.createElement("span");
      playIcon.className = "play-icon";
      a.appendChild(playIcon);
    }

    a.appendChild(document.createTextNode(link.title));
    h2.appendChild(a);
    article.appendChild(h2);

    if (link.note) {
      const pNote = formatNoteElement(link.note);
      article.appendChild(pNote);
    }

    if (link.images && link.images.length > 0) {
      const imageContainer = document.createElement("div");
      imageContainer.className = link.images.length === 1 ? "single-image" : "image-grid";

      link.images.forEach(src => {
        const img = document.createElement("img");
        img.src = src;
        img.alt = link.title;
        imageContainer.appendChild(img);
      });

      article.appendChild(imageContainer);
    }

    if (link.addedAt) {
      const pDate = document.createElement("p");
      pDate.className = "card-date";
      pDate.textContent = `Added: ${formatDate(link.addedAt)}`;
      article.appendChild(pDate);
    }

    container.appendChild(article);
  });
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