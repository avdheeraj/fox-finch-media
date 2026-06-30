# Pulse & Pixel — Website + Admin Backend

This is your portfolio website with a small backend so you can upload videos
and edit team/testimonial/contact info yourself, without touching code.

## What's included
- `server.js` — the backend (Node.js + Express)
- `public/index.html` — your live website (pulls content from the backend)
- `public/admin.html` — the admin panel (login, upload videos, edit info)
- `data/content.json` — where all your site content is stored
- `uploads/` — where uploaded video files are stored

## Run it locally

1. Install Node.js (v18+) if you don't have it: https://nodejs.org
2. Open a terminal in this folder and run:
   ```
   npm install
   node server.js
   ```
3. Visit:
   - Website: http://localhost:3000
   - Admin panel: http://localhost:3000/admin.html

## Default admin login
- Username: `admin`
- Password: `admin123`

**Change this before sharing the site with anyone.** You can set your own
username/password using environment variables when starting the server:

```
ADMIN_USERNAME=youruser ADMIN_PASSWORD=yourpassword SESSION_SECRET=somelongrandomstring node server.js
```

On Windows (PowerShell):
```
$env:ADMIN_USERNAME="youruser"; $env:ADMIN_PASSWORD="yourpassword"; node server.js
```

## Using the admin panel
- Log in at `/admin.html`
- **Upload a video**: fill in title, category tag, duration label, and description, choose a video file (mp4/webm/mov/mkv, up to 500MB), and click Upload. It appears on the live site immediately.
- **Delete a video**: click Delete next to any video in the list.
- **Studio info / contact / team / testimonials**: edit the fields and click each section's Save button.

## Putting this online (so it's not just on your computer)
This is a real Node.js app, so it needs a host that runs Node — static
hosting (like GitHub Pages) won't work since this has a backend.

Easy options:
- **Render.com** or **Railway.app** — free/cheap tiers, connect a GitHub repo or upload this folder, set the environment variables above, and it deploys automatically.
- **A VPS** (e.g. DigitalOcean, Linode) — upload this folder, run `npm install && node server.js` (use a process manager like `pm2` to keep it running).

Whichever you choose, set `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and
`SESSION_SECRET` as environment variables on that platform — don't leave the
defaults in place once it's live.

## Notes
- Video files are stored on disk in `uploads/`. If you deploy somewhere with
  ephemeral storage (some free hosting tiers wipe disk on restart), consider
  moving to a cloud storage bucket (S3, Cloudflare R2, etc.) for production use — happy to help wire that up if needed.
- All content (studio info, team, services, testimonials, contact, video list) lives in `data/content.json` as a single file — easy to back up or edit by hand if needed.
