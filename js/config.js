/* =========================================================
   Aloha landing page: settings you are expected to edit
   ========================================================= */

/**
 * FORM_ENDPOINT
 * Where the apply form is POSTed (JSON body). Leave '' until the destination is decided.
 * Works with any endpoint that accepts a JSON POST, e.g. a Google Apps Script web app
 * (Sheet), Formspree, Make/Zapier webhook, or a Base44 function.
 * When '' -> the form falls back to WhatsApp (prefilled message) if WHATSAPP_NUMBER is set,
 * otherwise it shows a clear "not connected yet" message.
 */
window.FORM_ENDPOINT = ''; // TODO: set the form destination

/**
 * WHATSAPP_NUMBER
 * International format, digits only, no '+' and no leading 0 (used for the wa.me links).
 * WHATSAPP_DISPLAY = how the number is shown on the page.
 */
window.WHATSAPP_NUMBER = '972547402643';
window.WHATSAPP_DISPLAY = '+972 54-740-2643';

/**
 * GALLERY
 * To add a photo: export a .webp + .jpg into assets/img/ and add an item below.
 * To add a video: put an H.264 .mp4 + a poster image into assets/video/ and add { type: 'video', ... }.
 * width/height = the real pixel size of the file (prevents layout shift).
 * wide: true makes the tile span two columns on desktop.
 */
window.GALLERY = [
  {
    type: 'image',
    webp: 'assets/img/store-surfboard-1280.webp',
    jpg: 'assets/img/store-surfboard-1280.jpg',
    small: 'assets/img/store-surfboard-640.webp',
    width: 1280, height: 720,
    alt: 'חנות Aloha Art Collective, גלשן על התקרה ועבודות עץ ואפוקסי',
    wide: true
  },
  {
    type: 'image',
    webp: 'assets/img/store-mirror-ceiling-1080.webp',
    jpg: 'assets/img/store-mirror-ceiling-1080.jpg',
    small: 'assets/img/store-mirror-ceiling-640.webp',
    width: 1080, height: 1440,
    alt: 'פנים החנות עם תקרת מראה ותחנות רוח'
  },
  {
    type: 'image',
    webp: 'assets/img/sunset-beach-1070.webp',
    jpg: 'assets/img/sunset-beach-1070.jpg',
    small: 'assets/img/sunset-beach-640.webp',
    width: 1070, height: 1328,
    alt: 'שקיעה בחוף בהוואי'
  }
  // Example video item:
  // { type: 'video', src: 'assets/video/new-clip.mp4', poster: 'assets/video/new-clip.webp',
  //   width: 1080, height: 1920, alt: 'תיאור קצר' },
];
