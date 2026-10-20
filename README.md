# Charity Ewela Nakowa Orphanage Home Website

A responsive website project for presenting the organisation's story,
programmes, community impact, media, and ways to get involved.

## Features

-   Responsive layout for mobile and desktop
-   Dropdown navigation
-   Sections for the organisation's story, programmes, impact, media,
    and contact
-   Media gallery with filtering and lightbox interactions
-   Optional theme toggle
-   Basic email-based contact interaction
-   GitHub Pages deployment support

## Project files

-   `index.html` --- page content and structure; in the merged version,
    CSS is included in this file
-   `app.js` --- interactive behaviour
-   `assets/` --- approved logo, image, and video files
-   `MEDIA-FILES.md` --- media filename reference, if included

## Run locally

1.  Download or clone the repository.
2.  Keep `index.html` and `app.js` in the same directory.
3.  Add approved media to `assets/` using the exact filenames referenced
    by the HTML.
4.  Open `index.html` in a browser. A local static web server can be
    used for testing.

If using a separate `styles.css` version, keep it beside `index.html`
and ensure the HTML links to it correctly.

## Publish with GitHub Pages

1.  Upload the website files to the root of your GitHub repository.
2.  Open **Settings → Pages**.
3.  Under **Build and deployment**, choose **Deploy from a branch**.
4.  Select your publishing branch (commonly `main`) and the `/(root)`
    folder.
5.  Save, wait for deployment to complete, and open the URL shown in
    Pages settings.

The main entry file must be named `index.html`. GitHub Pages filenames
are case-sensitive, so paths and filenames must match exactly.

## Media checklist

-   Confirm all referenced files exist in `assets/`.
-   Use only photos, logos, and videos approved for public use.
-   Ensure appropriate permission before publishing media that
    identifies children.
-   Compress large videos to improve loading speed.
-   If media is missing, upload the correctly named file or update its
    path in the HTML.

## Privacy and security

This README intentionally excludes private contact details, financial
account information, credentials, and other sensitive information.

-   Never commit passwords, API keys, access tokens, private documents,
    or confidential records.
-   Review website text and media before publishing to ensure private
    details are not exposed.
-   Publish contact or donation information only when the organisation
    has explicitly approved it for public display.
-   Do not publish identifying information about children without
    appropriate permission.
-   Content in a public repository or public GitHub Pages website may be
    visible to anyone.

## Troubleshooting

**CSS is missing:** If using the merged HTML, confirm that the updated
`index.html` was uploaded. If using a separate stylesheet, confirm
`styles.css` is in the correct directory and the path in the HTML is
correct.

**Menu or buttons do not work:** Confirm `app.js` is uploaded beside
`index.html` and the script path is correct.

**Images or video are missing:** Check the `assets/` folder and verify
that every filename matches the HTML exactly.

**The site has not updated:** Check the Pages deployment status, wait
for deployment to finish, and refresh the browser. Clearing the browser
cache may also help.

## Maintenance

Keep the website accurate and current. After changes, test links, mobile
layout, interactive elements, and all public-facing details.

------------------------------------------------------------------------

This is a static website. Features requiring a database, secure payment
processing, server-side form handling, or other backend services need an
appropriate external service or backend.
