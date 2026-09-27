# Little Moments

A static, mobile-first gallery of 136 fox-and-cat stickers. No runtime dependencies, backend, build service, secrets, or API calls.

## Publish on GitHub Pages

1. Commit this folder to a GitHub repository and push it.
2. In **Settings → Pages**, select **Deploy from a branch**.
3. Select your branch and **/(root)**, then save.

The checked-in `index.html`, CSS, JavaScript, JSON, icons, and sticker files are the complete site. All URLs are relative, including the manifest start URL, so repository subpaths work. `.nojekyll` disables unnecessary Jekyll processing. The ZIP archives are preserved as source backups; the website uses `stickers/`.

## Preview locally

```sh
python3 -m http.server 8000
```

Open http://localhost:8000. Serve over HTTP; opening `index.html` directly as a `file:` URL can block the JSON request.

## Collection

| Pack | Source archive | Stickers | Format |
| --- | --- | ---: | --- |
| Autumn | `autumn_vk_batch_webp.zip` | 48 | Static WebP |
| Kohannya | `kohannya_batch_webp.zip` | 40 | Static WebP |
| Summer | `summer_vk_batch_webp.zip` | 48 | Static WebP |

Display names come from the archive names. There were no embedded Telegram emoji mappings, pack URLs, or titles. Each image was visually reviewed to assign a descriptive title, multiple relevant emojis where appropriate, and action/emotion keywords in `data/tags.json`. Ukrainian and Russian text visible in stickers informed the meanings. Original image bytes and all three ZIPs are unchanged. Total source image size is about 6.1 MB, with browser-native lazy loading for the gallery.

There are **no animated or video stickers** in these archives. No media conversion or animation player is needed. The preview includes a video rendering branch for future prepared video metadata; the generator deliberately rejects newly introduced animated/video files until their compatibility and poster frames are reviewed. It does not claim to convert TGS or arbitrary video uploads.

Static WebP is supported on iOS Safari 14 and later ([WebKit release notes](https://webkit.org/blog/11340/new-webkit-features-in-safari-14/)). The modal uses native HTML [`dialog`](https://webkit.org/blog/12445/new-webkit-features-in-safari-15-4/), so the complete interactive site targets **iOS Safari 15.4+** and current Chrome, Firefox, and desktop Safari. Safe-area padding, a 16px search input, dynamic viewport sizing, touch targets, and fixed-body scroll restoration support phones. Reduced-motion preferences disable transitions and future video autoplay. There is no service worker or offline-cache guarantee.

## Files and maintenance

- `index.html`: accessible page and preview dialog.
- `css/style.css`: responsive layout and styling.
- `js/app.js`: filtering, normalized emoji/text search, lazy images, and preview controls.
- `data/tags.json`: manually reviewed source metadata, keyed by pack and source filename.
- `data/stickers.json`: generated browser data.
- `scripts/generate_metadata.py`: automatic directory scan, dimension detection, and metadata completeness checks.
- `tests/gallery.cjs`: functional and responsive browser checks.

To add static WebPs, put them in the appropriate `stickers/<pack>/` folder and add reviewed title, emoji, and keyword entries to `data/tags.json`. Then regenerate:

```sh
python3 -m pip install Pillow
python3 scripts/generate_metadata.py
```

This preprocessing is optional for normal deployment. The generated JSON is already included. Generation fails if a sticker lacks tags or introduces media requiring compatibility review.

Search is case-insensitive, ignores emoji presentation selectors, matches keyword prefixes, and handles common variants such as hugging/hug, kisses/kiss, sleeping/sleep, and crying/cry. Space-separated terms are combined with AND. Pack selection always constrains search. The preview shows every assigned emoji, a readable title, keywords, and the pack. Escape, the close button, or tapping outside closes it; arrow keys and Previous/Next browse the filtered result set.

## Verification

Run the browser checks with Node 20+ and Playwright installed in your development environment:

```sh
node tests/gallery.cjs
```

Optionally set `PLAYWRIGHT_MODULE` to the installed package path and `CHROMIUM_PATH` to a browser executable. Tests serve the site beneath `/repository-name/`, exercise all packs, text variants, **every assigned emoji**, no-results/reset, preview navigation/close/focus restoration, and all 136 media URLs. Layout checks cover widths 360, 375, 390, 412, 430, 768, 1024, and 1440, plus 812×375 landscape. Screenshots are saved in the temporary directory.

Tested with desktop Chrome at those viewport sizes. Physical iPhone/Android hardware and Safari were not available for device testing; simulated screen widths do not verify the iOS software keyboard or notch behavior.
# stickers
# stickers
# stickers
# stickers
