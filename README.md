# Mari Kawan Creative website

Static site: plain HTML pages, one stylesheet, two scripts. Upload everything to your hosting root.

## Structure

- `index.html`, `about.html`, `services.html`, `case-studies.html`, `contact.html`
- `assets/style.css`: the whole design system (tokens, type scale, components, dark theme)
- `assets/main.js`: language and dark mode, mobile menu, scroll reveal, case study slider, stacked process cards, count-up numbers, hero slider
- `assets/i18n.js`: Indonesian and Spanish translations

## Common edits

**Fonts and sizes.** The type scale follows the PHI typography standard with Inter: H1 36-42px (32px mobile), hero subtitle 19px (16px), column heading 16px, overline 13px (11px), body 15px (13.5px), UI text 14px, meta 12-13px. All values are variables in `assets/style.css`, section 1.

**Colors and dark mode.** Brand colors are variables in `assets/style.css`, section 1. The dark theme is section 13 (same variable names, dark values). Light is the default and the site does not follow the visitor's device setting. The header button toggles dark mode and the choice is saved in the browser. Footer color is `--c-navy`.

**Languages.** English is written in the HTML. The EN / ID / ES switch replaces text using `assets/i18n.js`, which maps the exact English text to its translation. If you change an English sentence in an HTML file, edit the same sentence (the key) in `i18n.js`, otherwise that sentence stays in English for ID and ES. Search engines read the English version.

**Logo.** Put your file in `assets/` and replace `<span class="brand__mark">MKC</span>` in the header and footer with `<img src="assets/logo.svg" alt="" class="brand__logo">`. Header height is `--nav-h`.

**Hero slider.** In `index.html`, find the comment `Hero slider`. Each `<article class="slide">` is one slide. When you add or remove a slide, add or remove a matching `dot-btn` button. Timing is `DELAY` in `main.js`. It fills the screen height and all slides share one tone.

**Case study slider.** In `case-studies.html`, each `<article class="cs-slide">` is one case (no separate detail pages). It fills the screen height and loops forever (main.js adds copies of the slides, so keep the markup to one article per case). Replace the CSS mockup inside `.cs-media` with `<img class="cs-fill" src="assets/name.webp" alt="...">` or `<video class="cs-fill" src="assets/name.mp4" autoplay muted loop playsinline></video>`. Text under the slider comes from the `data-*` attributes on the article. Links like `case-studies.html#tubanan` open that slide. The "View details" button opens a pop-up gallery: each article contains a hidden `<div class="cs-gallery">` with the gallery items (`.gal-item`, each with a `data-caption`). Replace the CSS mockups there with `<img class="cs-fill">` or `<video class="cs-fill" autoplay muted loop playsinline>` and add or remove items as needed. The facts in the pop-up come from the `data-type`, `data-status`, `data-host` and `data-url` attributes.

**Pricing.** The "$100" and the Rupiah amount are in `index.html` and `services.html` (search for `price-card`) and in the FAQ. Change them everywhere, including `i18n.js`.

**FAQ.** Each `<details class="faq__item">` is one question. Review the answers that mention price, timing, domain, hosting and ownership.

**Social links.** Search for `marikawanid` and update the URLs if a handle changes.

**Contact form.** In `contact.html`, replace `YOUR_FORM_ID` with your Formspree form ID, or point `action` at your own backend. Also update the email, phone, address and WhatsApp number in the footer and contact page.

## Notes

- Header and footer are repeated in every page (no build step). When you change them, update each file, or ask for a regenerated set.
- The Tailwind CDN is convenient but heavy. For best performance, compile a static CSS file before a high-traffic launch.
