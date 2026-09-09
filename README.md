# cemenbakin.no — portfolio

A single hand-written page. No framework, no build step, no tracking: what is
in this directory is exactly what gets served.

```
index.html        the opening, the two doors, the languages, the closing
nettsider.html    the client websites
programvare.html  the software
404.html          the missing page (root-absolute paths, see below)
styles.css        tokens, layout, and the print stylesheet
hero.js           the ridges in the opening field (index only, decoration)
main.js           language memory, theme memory, the bar, the project rows
assets/           screenshots as webp, plus the favicon
```

**Three pages, no build step.** The shell — head, top bar, footer — is repeated
in each file rather than templated. That is the cost of having no build step,
and it is a real one: a change to the bar has to be made three times. If you
add a fourth page, copy an existing one and change the `aria-current="page"` in
its nav.

**Bump `?v=` when you edit the CSS or the JS.** Pages serves everything with
`cache-control: max-age=600`, so a returning visitor can run an old `hero.js`
against new HTML for ten minutes after a deploy — which looks exactly like the
fix not working, and was reported as such. Every page links its assets as
`styles.css?v=N`, `hero.js?v=N`, `main.js?v=N`; raising N in all four HTML files
retires the old copy the moment the new HTML lands.

**Moving between them** uses cross-document view transitions where the browser
has them (`@view-transition { navigation: auto }` sits in each head) and a
`page-in` keyframe everywhere else. As with the panel reveal, it has no fill
mode: if the animation never runs, the content is simply there.

## Run it locally

```sh
python3 -m http.server 8088     # then open http://127.0.0.1:8088
```

## Editing

**Copy.** Every translatable element ships twice, marked `lang="en"` and
`lang="nb"`; CSS shows one and hides the other. Edit both, or the language
toggle will show a gap. There is no string table to keep in sync.

**Norwegian is the default, unconditionally.** Every file ships as
`<html lang="nb" data-lang="nb">`, so the page is Norwegian before a line of
script runs, and the `<title>` and meta descriptions are Norwegian to match the
declared language. `main.js` no longer sniffs `navigator.language` — it was the
only thing that could put a Norwegian client on an English page, and the
clients this site is for are Norwegian. Only a remembered choice from the EN/NO
switch moves it. If you add a page, set both attributes and press the NO button
(`aria-pressed="true"`), not EN.

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

**The first project is open on arrival.** A deep link (`#d-leadbot`) opens that
project; with no hash the first card in the row opens instead. Neither scrolls —
`open(card, false)` — so the reader still lands at the top of the section, but
with prose under the row rather than a strip of pictures and an empty page
beneath it. Reordering the cards therefore changes what greets a visitor: the
first `.pcard` in the track is the one that opens.

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

**The ridges are sized by the narrower dimension, not by the height.** Amplitude
and the vertical spread of the layers used to be fractions of `H` alone, and the
cycle count was fixed. A phone is a third of a laptop's width and just as tall,
so it drew the same number of ridges at the same height into a third of the
horizontal room: the peaks came out as stretched spikes running the length of
the screen. `unit()` is `min(H, W * 0.9)` and `cycles()` scales with width down
to a floor of 0.55, so a narrow screen gets fewer, broader, shorter ridges — a
horizon band rather than a comb. Both collapse to exactly the old values when
`W * 0.9 >= H`, which is every desktop shape, so the wide case is untouched.
`band(depth)` is the one description of the silhouette; the haze gradients and
the filled path both read from it, so they cannot drift apart.

Projects are not numbered: five of them are not a sequence, so the order
carries no meaning the reader needs.

**The studio's own site is one of the three cases.** `nettsider.html` shows two
client sites and soulscaler.no itself, and it comes first: the first `.pcard`
is both the leftmost one in a row that scrolls sideways and the one that opens
on arrival, so anything placed third is off the right edge until the reader
scrolls for it. Its numbers are counted off the live page (six services, two projects,
one repeated action), so re-count them if that page is rebuilt.

**Client credit, and the one personal role line.** The website cases still
credit `Studio: SoulScaler` per project and claim no individual role there,
because a studio credit is verifiable from soulscaler.no and a per-project one
is not. The role is stated once, about the person rather than about any single
case: `Software engineer at SoulScaler` / `Programvareingeniør i SoulScaler`, in
the hero (`.affil`), in the three introductions, and in the closing field on
every page. Every `SoulScaler` in a spec list links to soulscaler.no, so the
claim is one click from its check. Keep it that way — a role line is only worth
having if a client could read it back to you.

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

**The home page is four beats and nothing else.** The opening field, two
doors, the three languages, and a closing field with the address on it. What
used to sit between them — an about grid, a three-part method essay, a column
of contact rows — was the same shape repeated six times down the page: mono
label, hairline, block. That repetition is both what makes a page read as
generated and what buries the one thing a visitor came to find. It is all in
git history if any of it is wanted back.

**The page ends where it began.** `.field` is the same ridge canvas as the
hero, flipped, with the address set larger than anything except the name.
`hero.js` therefore runs per canvas rather than once — the profiles are shared,
but the backing store and gradients belong to each field, and a field only
animates while it is on screen, so the two never both run.

**Testing caveat, learned four times over.** Headless Chromium with
`--virtual-time-budget` freezes CSS transitions, CSS animations and
`performance.now()` at their first frame. Measuring a colour behind a
`transition`, or an element mid-`animation`, reports the *start* value and
looks exactly like a cascade bug. Twice in this project that cost a wrong
diagnosis. When measuring anything animated, disable the transition on the
element first (or pass `--force-prefers-reduced-motion`) and measure again
before believing the number.

**The three languages are shown, not claimed.** `#tongues` prints the same
sentence in Norwegian, English and Russian, and it is the one block that
deliberately ignores the EN/NO switch — all three lines are always visible,
because their being there together *is* the evidence. Flags were considered and
rejected: a flag claims a country, not a language, and "fluent" written next to
your own name is exactly the unverifiable adjective the rest of this site
argues against. The old table that said "Norsk — FLUENT" three times is gone.

Each sentence is a button, and behind it is the same introduction written in
that language — which is where the about text went when the home page was cut.
The introductions are open in the markup and `main.js` closes them, so with the
script blocked all three are simply readable. The line reveal animates position
only, never opacity, and never from behind a clip the line starts outside of: a
stalled animation must not be able to hide the text.

**The About blocks.** `.blocks` is a grid whose `gap: 1px` over a `--line`
background *is* the hairline grid — there are no borders on the blocks
themselves. That means an empty cell shows up as a grey rectangle, so the block
count has to fill its rows: with two columns, `.block-wide` spans both, and the
current set (languages wide, two half blocks, availability wide) leaves no hole.
Add a fifth block and you have to re-check that.

## Print

**One caveat from the split:** `Ctrl+P` no longer prints a complete CV from one
page. Each page prints its own part — the home page gives the summary, the
about blocks, the method and the contact details; the two work pages print
their projects. Printing all three gives the same document as before, in three
passes. If a single-press CV matters more than the split, that is the thing to
undo.

`⌘P` / `Ctrl+P` produces a CV: each project's summary line, its
specification strip and its one hard fact, without the images, the expanders or
the long-form prose. That layout is a self-contained block at the bottom of
`styles.css`. It prints the *About* block as two columns and forces `.specs` to
a fixed four, because A4 is narrower than every layout breakpoint on the page
and the responsive grids would otherwise collapse to one column each.

## The missing page

`404.html` is what GitHub Pages serves for any address that does not exist, and
it is served *at that address* — `/gamle/side/` included. Every path in it is
therefore root-absolute (`/styles.css`, `/main.js`, `/assets/…`): a relative one
would resolve against the missed address and the page would arrive unstyled at
exactly the moment it needs to look deliberate. It uses no CSS of its own — the
opening field with the number where the name goes — so it cannot drift from the
rest of the site.

## Deploying

Static hosting, nothing to configure. This repository is
`CemenBakinDev/CemenBakinDev.github.io`: push to **`master`** (not `main`) and
Pages serves the repository root at **https://cemenbakin.no**. The domain is
registered outside Cloudflare (`ns1..3.dnsdomene.net`), with apex A records to
GitHub's four Pages addresses and `www` as a CNAME.

**If HTTPS is broken on the custom domain,** read `https_certificate` from
`gh api repos/CemenBakinDev/CemenBakinDev.github.io/pages` before waiting. An
absent object means provisioning was never requested and no amount of waiting
fixes it — remove the custom domain and re-add it (`cname: null`, then set it
again), which walks the state through `new` → `authorization_pending` →
`approved` in about a minute. A real state value means it is genuinely in
progress. Note that those API calls rewrite the repository's `CNAME` file, so
pull afterwards.
