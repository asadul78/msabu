# Certificate Verification Site

A free, no-code-hosting-bill way to let anyone scan a QR code on a
certificate and see a "yes, this is real" page with the event, the
participant, the session and a Valid/Invalid stamp.

- **Hosting:** GitHub Pages (free, static files)
- **Database + admin login:** Firebase — Firestore + Authentication (free "Spark" plan)
- **You manage everything from:** `admin.html` — add one certificate at a
  time, or upload a whole batch from a CSV exported from Excel/Sheets.

Nothing here needs Node, npm, or a build step. It's plain HTML/CSS/JS
files you upload to GitHub.

---

## What's in this ZIP

```
index.html          → public homepage with a "verify a certificate" search box
validate.html        → shows one certificate's result (used for direct links)
404.html              → makes /validation/SERIAL-NUMBER links work (see below)
admin.html            → your private admin panel
.nojekyll             → tells GitHub Pages not to run its own build step
sample-certificates.csv → example file, matches the required columns
css/style.css
js/firebase-config.js → ⚠️ THE ONLY FILE YOU MUST EDIT
js/firebase-init.js
js/validate.js
js/admin.js
```

---

## Part 1 — Create your Firebase project (free)

1. Go to **[console.firebase.google.com](https://console.firebase.google.com)** and sign in with a Google account.
2. Click **Add project**, give it a name (e.g. `cert-verify`), and finish the wizard (you can turn off Google Analytics — not needed).
3. In the left sidebar, click **Build → Firestore Database → Create database**.
   - Choose **Start in production mode**.
   - Pick any location close to you, then **Enable**.
4. In the left sidebar, click **Build → Authentication → Get started**.
   - Under **Sign-in method**, enable **Email/Password**.
   - Go to the **Users** tab → **Add user** → type in an email + password for
     *yourself*. This is your admin login — there is no public sign-up page,
     so this is the only account that can ever log into `admin.html`.
5. Click the **⚙️ gear icon → Project settings**, scroll to **Your apps**,
   click the **`</>`** (web) icon, give the app a nickname, and click
   **Register app**. Firebase will show you a code block that looks like:

   ```js
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "cert-verify-xxxx.firebaseapp.com",
     projectId: "cert-verify-xxxx",
     storageBucket: "cert-verify-xxxx.appspot.com",
     messagingSenderId: "...",
     appId: "..."
   };
   ```

   Keep this tab open — you'll paste this in Part 3.

### Lock down the database rules

Still in Firebase, go to **Firestore Database → Rules** and replace the
contents with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /certificates/{certId} {
      allow read: if true;                 // anyone can verify a certificate
      allow write: if request.auth != null; // only your logged-in admin can add/edit/delete
    }
  }
}
```

Click **Publish**. This means: the public verification page can *read*
records, but only you, signed into `admin.html`, can *write* them.

---

## Part 2 — Create your GitHub repository

1. Go to **[github.com/new](https://github.com/new)**.
2. Name the repository anything, e.g. `cert-verify`. Make it **Public**
   (GitHub Pages' free tier needs a public repo, unless you're on a paid
   GitHub plan). Click **Create repository**.
3. Unzip the file you downloaded from this chat, then upload every file
   and folder inside it into the repo:
   - On the repo's page, click **Add file → Upload files**, then drag in
     everything (keep the `css/` and `js/` folders — GitHub preserves
     folder structure when you drag a folder in).
   - Commit the upload.

---

## Part 3 — The one file you edit: `js/firebase-config.js`

1. On GitHub, open `js/firebase-config.js`, click the pencil (✏️) icon to edit.
2. Paste in the `firebaseConfig` values from Part 1, step 5.
3. Set `SITE_BASE_URL` to where this site will live. GitHub Pages URLs
   follow this pattern:
   ```
   https://<your-github-username>.github.io/<repository-name>
   ```
   For example, if your username is `nusrat-lipy` and the repo is
   `cert-verify`:
   ```js
   export const SITE_BASE_URL = "https://nusrat-lipy.github.io/cert-verify";
   ```
   No trailing slash.
4. Commit the change (**Commit changes** button).

---

## Part 4 — Turn on GitHub Pages

1. In your repo, go to **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **Deploy from a branch**.
3. Under **Branch**, choose **main** and folder **/ (root)**, then **Save**.
4. Wait 1–2 minutes, then refresh — GitHub will show you the live URL
   (it should match the `SITE_BASE_URL` you set in Part 3). Open it.

You now have a working site at:
- `.../index.html` — public homepage
- `.../admin.html` — your admin panel

---

## Part 5 — Add your certificates

Open `admin.html` on your live site and sign in with the email/password
you created in Firebase (Part 1, step 4).

**One at a time:** use the **Add certificate** tab. Fill in the fields and
save — a QR code appears immediately, ready to download as a PNG.

**In bulk, from a spreadsheet:** use the **Bulk upload (CSV)** tab.

- Click **Download CSV template** (or open the included
  `sample-certificates.csv`) to see the exact column names expected:
  `Event Name, Participant Name, Session, Serial Number, Student ID, Authenticity`
- Fill it in Excel/Google Sheets — one row per certificate. Column order
  doesn't matter, only the header names do. **Authenticity** should say
  `Valid` or `Invalid`.
- **Serial Number** is the important one: it becomes the code in the QR
  link, so keep every value unique — e.g. `MSA-2025-2XVPZ`.
- Export/save as **CSV**, then upload it in the admin panel. You'll see a
  preview before anything is saved, then click **Upload records**.

Once records exist, the **Manage records** tab lets you search, re-open
any certificate's QR code, download *all* QR codes at once as a `.zip`,
or delete a record.

---

## Part 6 — Putting the QR code onto the certificate itself

This site generates and stores the QR codes; pasting them onto your
certificate design is a separate, one-time step per batch:

1. In **Manage records**, click **Download all QR codes (.zip)** — you'll
   get one PNG per certificate, named by serial number
   (e.g. `MSA-2025-2XVPZ.png`).
2. In whatever you design certificates with (PowerPoint, Word, Canva,
   Photoshop), place the matching PNG onto each student's certificate,
   near the signature area, along with the printed serial number as text
   (so it's readable even if the QR is damaged).

If you're generating certificates in bulk and want the QR + name +
serial number inserted automatically into a template rather than one by
one, that's doable too (e.g. PowerPoint/Word mail-merge, or a small
script) — just ask, and it can be built as a follow-up.

---

## How the "pretty URL" trick works

GitHub Pages can't do server-side routing, so there's no real page at
`/validation/MSA-2025-2XVPZ`. Instead:

- `404.html` is the file GitHub Pages shows for *any* URL that doesn't
  exist — including `/validation/<anything>`.
- This project's `404.html` reads the last part of the URL (the serial
  number) with JavaScript, looks it up in Firestore, and renders the
  result — so it quietly behaves like a real page.

This means every QR code should point to:
```
https://<your-username>.github.io/<repo>/validation/<SERIAL NUMBER>
```
which the admin panel already builds for you automatically from
`SITE_BASE_URL`.

---

## Costs & limits

Everything here fits in the free tiers:
- **GitHub Pages:** free for public repositories.
- **Firebase Spark plan (free):** 50,000 document reads/day and 20,000
  writes/day on Firestore — far more than a course certificate list will
  ever use — plus free Authentication.

## Troubleshooting

- **"Missing or insufficient permissions" when saving in the admin panel:**
  you're not logged in, or the Firestore rules weren't published — recheck
  Part 1's rules step.
- **QR codes lead to a blank/"Not found" page:** double-check
  `SITE_BASE_URL` in `js/firebase-config.js` exactly matches your live
  GitHub Pages URL (including the repo name, no trailing slash), then
  re-generate QR codes after fixing it.
- **Sign-in fails on admin.html:** the email/password must match a user
  you created under Firebase → Authentication → Users, not a Google
  account.
- **Changes on GitHub don't show up:** GitHub Pages can take a minute or
  two to redeploy after a commit; hard-refresh your browser (Ctrl/Cmd +
  Shift + R).
