# yamijpg

A personal photography journal. No social media — just pictures, made with care.

## Live Site

Hosted via GitHub Pages at `https://YOUR-USERNAME.github.io/yamijpg`

## Features

- **Photo feed** — latest 3 posts with captions, EXIF data, likes, comments, and related photos
- **Gallery** — full grid view with tag filtering and lightbox
- **Dark / light mode** — persists across visits
- **Guestbook** — visitors can leave notes
- **Subscribe** — email or phone sign-up (notifies site owner via EmailJS)
- **Contact form** — sends messages directly to site owner via EmailJS
- **Admin dashboard** — password-protected panel to upload photos, manage posts, view subscribers and guestbook entries
  - Access: tap the footer brand logo 5 times on mobile, or enter `/admin` trigger via footer

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Vanilla HTML / CSS / JS — no framework |
| Email | EmailJS (contact form + subscriber notifications) |
| Storage | localStorage (photos, likes, comments, guestbook, subs) |
| Hosting | GitHub Pages |

## Project Structure

```
yamijpg/
├── index.html         Main page
├── css/
│   └── style.css      All styles (mobile-first)
├── js/
│   └── app.js         All logic (photos, admin, lightbox, forms)
└── images/
    └── img_p*.jpg     Default shipped photos
```

## Deployment (GitHub Pages)

1. Push this repo to GitHub
2. Go to repo **Settings → Pages**
3. Source: **Deploy from a branch → main → / (root)**
4. Save — your site will be live at `https://yamipng.github.io/yamijpg`

## Changing the Admin Password

The admin password is stored as a SHA-256 hash in `js/app.js` (variable `PASS_HASH`).  
To change it:

1. Generate a SHA-256 hash of your new password at [sha256.online](https://sha256.online) or in your browser console:
   ```js
   crypto.subtle.digest('SHA-256', new TextEncoder().encode('yournewpassword'))
     .then(b => console.log([...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')))
   ```
2. Replace the `PASS_HASH` value in `js/app.js` with your new hash
3. Commit and push

## Notes

- All user data (uploaded photos, likes, comments, subscribers, guestbook entries) is stored in the visitor's **localStorage** — nothing is sent to a server
- The site owner receives email notifications for new subscribers and contact messages via EmailJS
- Uploaded photos are compressed to max 1200px and stored as base64 in localStorage

---

&copy; yamijpg — all rights reserved
