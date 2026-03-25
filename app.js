const CATEGORY_LABELS = {
  conference: "C",
  journal: "J",
  workshop: "W",
  preprint: "P",
};

const ABOUT = window.ABOUT || { paragraphs: [] };
const NEWS = window.NEWS || [];
const PUBLICATIONS = window.PUBLICATIONS || [];
const VENUE_ALIASES = window.VENUE_ALIASES || {};

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

function formatVenue(venueKey, year) {
  const alias = VENUE_ALIASES[String(venueKey || "").toLowerCase()] || null;
  if (!alias) {
    return `${escapeHtml(venueKey || "Unknown venue")} ${escapeHtml(year)}`;
  }

  return `${escapeHtml(alias.name)} ${escapeHtml(year)} <span class="badge">${escapeHtml(alias.short)}</span>`;
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
  if (!container) {
    return;
  }

  container.innerHTML = NEWS.map(
    (item) =>
      `<li><span class="news-date">${escapeHtml(item.date)}</span><span class="news-text">${escapeHtml(item.text)}</span></li>`
  ).join("");
}

function renderPublications() {
  const container = document.getElementById("publication-sections");
  const meta = document.getElementById("publication-meta");
  if (!container) {
    return;
  }

  if (meta) {
    meta.innerHTML = `
      <p>Conferences (C) / Journals (J) / Workshops (W) / Preprints (P)</p>
      <p><sup>*</sup>: Equal contribution, <sup>†</sup>: Co-corresponding author</p>
    `;
  }

  const categoryTotals = PUBLICATIONS.reduce((acc, pub) => {
    acc[pub.category] = (acc[pub.category] || 0) + 1;
    return acc;
  }, {});

  const categorySeen = {};

  const items = PUBLICATIONS.map((pub) => {
    const links = formatLinks(pub.links);
    const note = pub.note ? `<span class="badge">${escapeHtml(pub.note)}</span>` : "";
    const statusPrefix = pub.status === "to_appear" ? '<span class="pub-status">To appear in</span> ' : "";
    const labelPrefix = CATEGORY_LABELS[pub.category] || "";
    categorySeen[pub.category] = (categorySeen[pub.category] || 0) + 1;
    const labelNumber = (categoryTotals[pub.category] || 0) - categorySeen[pub.category] + 1;
    const pubLabel = labelPrefix ? `[${labelPrefix}${labelNumber}] ` : "";

    return `
      <li class="publication-item">
        <div class="pub-title">${escapeHtml(pubLabel)}${escapeHtml(pub.title)}</div>
        <div class="pub-authors">${formatAuthors(pub.authors)}</div>
        <div class="pub-venue">${statusPrefix}${formatVenue(pub.venue, pub.year)}${note}</div>
        <div class="pub-links">${links}</div>
      </li>
    `;
  });

  container.innerHTML = `
    <ol class="publication-list publication-list-flat">
      ${items.join("")}
    </ol>
  `;
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
setupToTopButton();
