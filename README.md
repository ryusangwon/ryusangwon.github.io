# Academic Homepage Template

This repository is a dependency-free academic homepage template adapted from [juho-lee.github.io](https://juho-lee.github.io/).

## Files

- `index.html`: page structure
- `styles.css`: homepage styles
- `app.js`: renders homepage sections from data files
- `data/about.js`: about section content
- `data/news.js`: news items
- `data/publications.js`: publication list
- `images/`, `assets/`, `fonts/`: static assets

## Local preview

Run a simple local server from this directory:

```bash
python3 -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

## Deploy on GitHub Pages

1. Push this repository to GitHub.
2. In repository settings, enable GitHub Pages from the default branch root.
3. Your site will be served automatically.
