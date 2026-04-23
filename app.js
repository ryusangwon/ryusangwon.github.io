const ABOUT = window.ABOUT || { paragraphs: [] };
const NEWS = window.NEWS || [];
const PUBLICATIONS = window.PUBLICATIONS || [];
const VENUE_ALIASES = window.VENUE_ALIASES || {};
const NEWS_VISIBLE_COUNT = 5;
const THEME_STORAGE_KEY = "theme";

const NAME_VARIANTS = new Set(["sangwon ryu", "ryu sangwon"]);

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderInlineMarkdown(text) {
  const raw = String(text || "");
  const regex = /\[([^\]]+)\]\(((?:https?:\/\/|mailto:)[^)\s]+)\)/g;
  let output = "";
  let lastIndex = 0;
  let match = regex.exec(raw);

  while (match) {
    output += escapeHtml(raw.slice(lastIndex, match.index));
    output += `<a href="${escapeHtml(match[2])}" target="_blank" rel="noreferrer">${escapeHtml(match[1])}</a>`;
    lastIndex = regex.lastIndex;
    match = regex.exec(raw);
  }

  output += escapeHtml(raw.slice(lastIndex));
  return output;
}

function getPlainAuthorName(author) {
  const raw = typeof author === "string" ? author : author?.name || "Unknown Author";
  return String(raw).replaceAll("\\", "").replaceAll("*", "").replaceAll("†", "").trim();
}

function isMyName(authorName) {
  const normalized = String(authorName || "")
    .toLowerCase()
    .replaceAll(/\s+/g, " ")
    .trim();
  return NAME_VARIANTS.has(normalized);
}

function formatAuthors(authors = []) {
  return authors
    .map((author) => {
      const plainName = getPlainAuthorName(author);
      const base = isMyName(plainName)
        ? `<span class="author-self">${escapeHtml(plainName)}</span>`
        : escapeHtml(plainName);

      if (typeof author === "string") {
        return base;
      }

      let markers = "";
      if (author.equalContribution) {
        markers += "<sup>*</sup>";
      }
      if (author.corresponding) {
        markers += "<sup>†</sup>";
      }
      return `${base}${markers}`;
    })
    .join(", ");
}

function formatVenue(venueKey, year, category) {
  const alias = VENUE_ALIASES[String(venueKey || "").toLowerCase()] || null;
  if (!alias) {
    return `${escapeHtml(venueKey || "Unknown venue")} ${escapeHtml(year)}`;
  }

  if (String(venueKey || "").toLowerCase() === "arxiv") {
    return escapeHtml(alias.short || alias.name || "arXiv");
  }

  const venueName =
    category === "workshop"
      ? String(alias.name || "").replace(/\s+Workshop$/i, "").trim()
      : alias.name;

  const hostAlias = alias.host ? VENUE_ALIASES[String(alias.host).toLowerCase()] || null : null;
  if (category === "workshop") {
    if (hostAlias) {
      return `${escapeHtml(hostAlias.short)} ${escapeHtml(year)} workshop on ${escapeHtml(venueName)}`;
    }
    return `${escapeHtml(year)} workshop on ${escapeHtml(venueName)}`;
  }

  if (category === "journal") {
    return `${escapeHtml(venueName)} ${escapeHtml(year)}`;
  }

  return escapeHtml([alias.short, String(year)].join(" "));
}

function formatLinks(links = []) {
  if (!Array.isArray(links) || links.length === 0) {
    return "";
  }

  return links
    .filter((item) => item?.label && item?.url)
    .map(
      (item) =>
        `<a href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">${escapeHtml(item.label)}</a>`
    )
    .join(' <span class="dot">·</span> ');
}

function getPaperUrl(pub) {
  if (!Array.isArray(pub?.links) || pub.links.length === 0) {
    return "";
  }
  return pub.links[0].url || "";
}

function renderAbout() {
  const container = document.getElementById("about-content");
  if (!container) {
    return;
  }

  const paragraphsHtml = (ABOUT.paragraphs || [])
    .map((paragraph) => `<p>${renderInlineMarkdown(paragraph)}</p>`)
    .join("");

  container.innerHTML = `<div class="about-block">${paragraphsHtml}</div>`;
}

function renderNews() {
  const container = document.getElementById("news-content");
  const toggle = document.getElementById("news-toggle");
  if (!container) {
    return;
  }

  const renderItems = (items) =>
    items
      .map(
        (item) =>
          `<li><span class="news-date">${escapeHtml(item.date)}</span><span class="news-text">${escapeHtml(item.text)}</span></li>`
      )
      .join("");

  if (!toggle || NEWS.length <= NEWS_VISIBLE_COUNT) {
    container.innerHTML = renderItems(NEWS);
    return;
  }

  let expanded = false;

  const updateNews = () => {
    const visibleItems = expanded ? NEWS : NEWS.slice(0, NEWS_VISIBLE_COUNT);
    container.innerHTML = renderItems(visibleItems);
    toggle.textContent = expanded ? "Show less" : "Show all news";
    toggle.setAttribute("aria-expanded", String(expanded));
  };

  toggle.hidden = false;
  toggle.addEventListener("click", () => {
    expanded = !expanded;
    updateNews();
  });

  updateNews();
}

function renderPublications() {
  const container = document.getElementById("publication-sections");
  const meta = document.getElementById("publication-meta");
  if (!container) {
    return;
  }

  if (meta) {
    meta.innerHTML = "<p><sup>*</sup>: Equal contribution, <sup>†</sup>: Co-corresponding authors</p>";
  }

  const items = PUBLICATIONS.map((pub) => {
    const links = formatLinks(pub.links);
    const note = pub.note ? `<span class="badge">${escapeHtml(pub.note)}</span>` : "";
    const statusPrefix =
      pub.status === "to_appear" ? '<span class="pub-status">To appear in</span> ' : "";

    return `
      <li class="publication-item">
        <div class="pub-title">${escapeHtml(pub.title)}</div>
        <div class="pub-authors">${formatAuthors(pub.authors)}</div>
        <div class="pub-venue">${statusPrefix}${formatVenue(pub.venue, pub.year, pub.category)}${note}</div>
        <div class="pub-links">${links}</div>
      </li>
    `;
  }).join("");

  container.innerHTML = `
    <ol class="publication-list" reversed start="${PUBLICATIONS.length}">
      ${items}
    </ol>
  `;
}

function setupThemeToggle() {
  const root = document.documentElement;
  const button = document.getElementById("theme-toggle");
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  if (!button) {
    return;
  }

  const applyTheme = (theme) => {
    root.dataset.theme = theme;
    button.textContent = theme === "dark" ? "☀" : "☾";
    button.setAttribute(
      "aria-label",
      theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
    );
    if (themeColorMeta) {
      themeColorMeta.setAttribute("content", theme === "dark" ? "#111315" : "#ffffff");
    }
  };

  const currentTheme = root.dataset.theme === "dark" ? "dark" : "light";
  applyTheme(currentTheme);

  button.addEventListener("click", () => {
    const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    applyTheme(nextTheme);
  });
}

function setupToTopButton() {
  const button = document.getElementById("to-top-button");
  if (!button) {
    return;
  }

  const updateVisibility = () => {
    button.classList.toggle("visible", window.scrollY > 240);
  };

  window.addEventListener("scroll", updateVisibility, { passive: true });
  button.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  updateVisibility();
}

renderAbout();
renderNews();
renderPublications();
setupThemeToggle();
setupToTopButton();
