# cemenbakin.dev — portfolio

A single hand-written page. No framework, no build step, no tracking: what is
in this directory is exactly what gets served.

```
index.html    the page — both languages live in the markup
styles.css    tokens, layout, and the print stylesheet
hero.js       the ridges and the haze in the opening field (decoration only)
main.js       language memory, theme memory, the bar, the websites track
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

**Colour.** The page has **no accent colour**, and that is the rule the whole
design hangs on: every colour a visitor sees belongs to the work being shown —
Eltervåg's red, LC Pulverlakk's gold, the screenshots. Emphasis is contrast, an
underline, or a dot. If you add a hue to the chrome, the client sites stop being
the loudest thing on the page.

Dark is the ground the page was designed on. `:root` is the dark palette; light
is re-declared under `[data-theme="light"]` and under a light OS. `--ink-3`
carries every mono label — if you change it, check it stays above 4.5:1 on
`--ground` in *both* themes; it was under before.

**Type.** Three faces with three jobs. Instrument Serif appears exactly four
times — the name, the project titles, and the two closing statements. Schibsted
Grotesk (a grotesque commissioned by the Norwegian media group) does everything
readable. IBM Plex Mono is labels and data only.

**Depth.** Exactly one thing on the page is lifted off the ground: `.frame`,
the stage a screenshot sits on. Nothing else gets a shadow, and nothing else is
a card — that is what keeps the evidence reading as the point.

**A new project.** Two pieces go together: an `<a class="pcard">` in the section's
`.track`, and a `<div class="detail" id="d-NAME">` in its `.details`. The card's
`data-detail` must match the panel's `id`. Nothing needs counting by hand — the
`data-total` in `.track-count` is a placeholder `main.js` overwrites on every
`sync()`. A website also needs a desktop shot and a phone shot — capture both
with the headless Chromium recipe below, at 1440×900 and 390×844.

**The two rows.** Each is a plain scroll container with `scroll-snap-type: x`,
not a hijacked wheel: scrolling down the page always scrolls down. Three rules
hold a row together — `margin-inline: calc(50% - 50vw)` pulls it to the window
edges (which is why `body` carries `overflow-x: hidden`); `--track-inset` is
applied as *both* `padding-inline` and `scroll-padding-inline` (drop the second
and the browser scrolls the inset away on load); and `#sites .pcard` overrides
the card width, because the client sites are the sales argument and their row
should visibly run off the edge.

**The counter counts screenfuls, not cards.** Counting cards read "1 / 5" on a
row that showed all five at once and had nothing to scroll to. `page()` measures
position against the distance that actually scrolls, because the last page is
usually a partial one — dividing by `clientWidth` left the counter reading 1
while sitting at the far end. A row with one screenful hides its controls
entirely (`.no-scroll`).

**Opening a project.** Without JavaScript every panel is simply open and the row
is an ordinary scrollable strip — so the enhancement *collapses* the write-ups,
it does not reveal them, and nothing is unreachable if the script never runs.
`main.js` stamps `data-enhanced` on the section, and CSS hides the panels from
there.

Do not try to animate the panel's height with the `grid-template-rows: 0fr → 1fr`
trick. It was tried and it resolves to zero here: the free space in an
auto-height grid is zero, and `overflow: hidden` takes the item's automatic
minimum down with it, so the panel opened to exactly its own padding — 33px, with
the content clipped and no error anywhere. The panel shows or it does not, and
the reveal animates `transform` only — never `opacity`, so an animation that
stalls at its first frame cannot leave a panel present, at full height, and
invisible.

**The opening field.** `hero.js` draws seven ridges — Bergen is the city between
the seven mountains — from seeded value noise, so the skyline is identical on
every visit. It picks its palette by measuring the ground's brightness (not by
matching a hex string, which broke silently when the token changed), so it
follows the theme
switch; it pauses when the hero scrolls out of view or the tab is hidden, and it
draws one still frame under `prefers-reduced-motion`. It is decoration: the
canvas is `aria-hidden` and the page is complete without it.

Projects are not numbered: five of them are not a sequence, so the order
carries no meaning the reader needs.

**Client credit.** The website cases credit `Studio: SoulScaler` and claim no
individual role, because the studio credit is verifiable from soulscaler.no and
an individual one is not. If you add a personal role line, make sure it is one
you would be comfortable having a client read back to you.

**A new section.** Give it an `id`, add an `<a href="#id" data-spy="id">` to
`.secnav`, and the bar picks it up. A section left out of the nav simply stays
under whichever marked section precedes it.

**Screenshots.** Real, running software only — nothing mocked up. Regenerate
with headless Chromium (note: it only paints what is visible at load, so to
photograph a section further down, serve a temporary `_*.html` copy with the
earlier sections set to `display:none`):

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

**Numbers instead of paragraphs.** Each project panel leads with a `.count`
sentence — one line where the numerals are set large in the serif and the words
stay at reading size. This is the page's own argument applied to itself: it
claims a result should be a number rather than an adjective.

It went through a stat row first — big numeral over a small uppercase label,
three across — and that was a mistake worth recording. A row of tiles like that
is one of the most generated components on the web, and it read worst exactly
where it mattered: Study Hub showed "0 DEPENDENCIES" beside "0 ACCOUNTS", two
zeroes side by side filling a template instead of saying anything. As a
sentence, "3 front-ends, 1 daemon, 0 dependencies, 0 accounts" is a claim.

Every figure must be checkable against the project's own output. Do not round
one up to look better, and do not invent one to balance the line. The
explanatory prose lives in the `<details>` under it.

**No "read more" on the cards.** The whole card is the link; an arrow and a
label inside it are furniture, and that pattern — screenshot, title, mono
subtitle, "Read more →" — is the stock generated card. The open state is
carried by the border.

**Motion must never be able to hide content.** Two rules, both learned by
shipping the bug: the panel's height is not interpolated (the
`grid-template-rows: 0fr → 1fr` trick resolves to zero here, opening the panel
to exactly its own padding), and the reveal animates `transform` only, never
`opacity`. An animation that stalls at its first frame would otherwise leave a
panel present, at full height, and invisible — with no error anywhere.

**Controls that need the script stay hidden until it runs.** `.track-nav` is
`display: none` by default and only shown under `[data-enhanced]`. Without
`main.js` the counter would read "1 / 1" (its markup placeholder) beside two
buttons that do nothing — worse than no controls, since the row still scrolls
by touch and trackpad. The same rule is why the panels are open by default:
the enhancement collapses, it never reveals.

**The About blocks.** `.blocks` is a grid whose `gap: 1px` over a `--line`
background *is* the hairline grid — there are no borders on the blocks
themselves. That means an empty cell shows up as a grey rectangle, so the block
count has to fill its rows: with two columns, `.block-wide` spans both, and the
current set (languages wide, two half blocks, availability wide) leaves no hole.
Add a fifth block and you have to re-check that.

## Print

`⌘P` / `Ctrl+P` produces a two-page CV: each project's summary line, its
specification strip and its one hard fact, without the images, the expanders or
the long-form prose. That layout is a self-contained block at the bottom of
`styles.css`. It prints the *About* block as two columns and forces `.specs` to
a fixed four, because A4 is narrower than every layout breakpoint on the page
and the responsive grids would otherwise collapse to one column each.

## Deploying

Static hosting, nothing to configure. For GitHub Pages: push to `main` and
point Pages at the repository root.
