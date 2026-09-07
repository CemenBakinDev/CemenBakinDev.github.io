# cemenbakin.dev — portfolio

A single hand-written page. No framework, no build step, no tracking: what is
in this directory is exactly what gets served.

```
index.html    the page — both languages live in the markup
styles.css    tokens, layout, and the print stylesheet
main.js       language memory, theme memory, reading rail (the page works without it)
assets/       screenshots as webp, plus the favicon
```

## Run it locally

```sh
python3 -m http.server 8088     # then open http://127.0.0.1:8088
```

## Editing

**Copy.** Every translatable element ships twice, marked `lang="en"` and
`lang="nb"`; CSS shows one and hides the other. Edit both, or the language
toggle will show a gap. There is no string table to keep in sync.

**Colour.** Everything comes from the tokens at the top of `styles.css`. The
accent (`--gold`) means one thing: a link, a live status, or the section you
are in. Nothing decorative is ever gold — that rule is what keeps the page
from looking like a template.

**A new project.** Copy an `<article class="case">`, bump the `data-idx` on its
`.body`, give the article a new `id`, and add a matching `<li>` to `.rail`.

**Screenshots.** Real software only — nothing mocked up. Regenerate with
headless Chromium:

```sh
CHROME=~/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome
"$CHROME" --headless --disable-gpu --hide-scrollbars \
  --window-size=1440,2000 --force-device-scale-factor=2 \
  --screenshot=out.png "http://127.0.0.1:PORT/"
```

Then crop and convert with Pillow (`quality=86, method=6`). The Leadbot image
must come from that tool's `rapport --demo` output, which uses invented
businesses — never from `oversikt.html`, which holds real leads, and never
including the page footer, which carries the client's registered address.

## Print

`⌘P` / `Ctrl+P` produces a two-page CV: the summary line and the one hard fact
per project, without the images, the expanders or the long-form prose. That
layout is a self-contained block at the bottom of `styles.css` — A4 is narrower
than the mobile breakpoint, so it has to reassert the two-column document.

## Deploying

Static hosting, nothing to configure. For GitHub Pages: push to `main` and
point Pages at the repository root.
