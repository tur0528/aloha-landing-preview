# Aloha Art Collective, recruitment landing page

Static site. No build step. Upload the folder as-is to any static host (Netlify, Vercel, GitHub Pages, cPanel...).
Local preview: `cd site && python3 -m http.server 8765` then open http://localhost:8765

## Before going live (js/config.js)
- `FORM_ENDPOINT` (TODO): URL that accepts a JSON POST with
  `{name, phone, age, us_passport: "yes"|"no", start_date: "YYYY-MM-DD", message, source, submitted_at}`.
  Empty -> the form falls back to a prefilled WhatsApp message (if WHATSAPP_NUMBER is set),
  otherwise it shows a red "not connected yet" message and sends nothing.
- `WHATSAPP_NUMBER` = `972547402643` (set; displayed as `WHATSAPP_DISPLAY` = `+972 54-740-2643`).
  All WhatsApp buttons open wa.me with a short prefilled message. With FORM_ENDPOINT empty, the form opens
  WhatsApp with all the applicant's details prefilled (the applicant still taps Send).
  If the number is ever cleared, the buttons show a "not set yet" toast and scroll to the form.
- `index.html`: set og:url / absolute og:image URL after the domain is known.
- Consent: `assets/video/kiosk-walk.mp4` shows a tourist couple's faces (~0:58-1:10) and mentions an American passport;
  `team-boat.mp4` shows real people. Confirm consent or trim.
- Media: `team-boat.mp4` picture is the original seaside/boat clip (848×478). That picture was recorded with no audio.
  The AAC on it is an original instrumental synthesized for this page (pentatonic pluck, soft pad, filtered noise), written to the clip length (~10.82s) so the HTML loop restarts picture and music together. It is not location audio, not the craft track, and not a commercial song. License: original work created for this site.
  `craft-resin.mp4` is the wood/epoxy workshop and keeps its own original AAC. Do not swap the two files.

## Adding photos / videos
Add an item to the `GALLERY` array in `js/config.js` (examples inside). Put files in `assets/img/` or `assets/video/`.
Images: export a .webp + .jpg (about 1280px wide). Videos: H.264 mp4 with `-movflags +faststart` + a poster image.

## Files
- index.html, css/style.css, js/config.js (settings), js/main.js (behaviour)
- assets/brand: logo, favicon. assets/img: photos + og-image.jpg. assets/video: compressed clips + posters.
Fonts: Google Fonts (Rubik).
