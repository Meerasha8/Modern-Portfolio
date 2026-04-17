# Portfolio CMS

A modern, fully editable portfolio website with an AI chatbot (Grok-powered), admin CMS, and Supabase backend.

---

## Features

- **6 pages** — Home, About, Skills, Projects, Contact, AI Chat
- **Admin CMS** — Password-protected session; edit, add, delete all content in-browser
- **AI Chatbot** — Powered by xAI Grok; reads your portfolio data to answer visitor questions
- **Supabase** — PostgreSQL database for all content; images stored as URLs (no file uploads)
- **Responsive** — Mobile-first, works on all screen sizes
- **SPA** — Single-page navigation, no page reloads

---

## Tech Stack

| Layer     | Technology                    |
|-----------|-------------------------------|
| Frontend  | HTML5, CSS3, Vanilla JS (SPA) |
| Backend   | Python 3.12, Flask            |
| Database  | Supabase (PostgreSQL)         |
| AI        | xAI Grok API                  |
| Deploy    | Render / Railway (backend)    |
| Fonts     | Syne + DM Sans (Google Fonts) |

---

## Project Structure

```
portfolio/
├── app.py              ← Flask backend (all API routes)
├── requirements.txt    ← Python dependencies
├── Procfile            ← Gunicorn for production
├── runtime.txt         ← Python version pin
├── schema.sql          ← Supabase table definitions (run once)
├── .env.example        ← Environment variable template
├── .gitignore
├── templates/
│   └── index.html      ← SPA shell (all pages)
└── static/
    ├── css/
    │   └── style.css   ← All styles
    └── js/
        └── app.js      ← All frontend logic
```

---

## Setup Guide

### 1. Clone & install

```bash
git clone <your-repo-url>
cd portfolio
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Set up Supabase

1. Go to [supabase.com](https://supabase.com) → New Project
2. Open **SQL Editor** → paste the entire contents of `schema.sql` → Run
3. Go to **Project Settings → API**
   - Copy **Project URL** → `SUPABASE_URL`
   - Copy **anon public** key → `SUPABASE_KEY`

### 3. Get xAI Grok API key

1. Go to [console.x.ai](https://console.x.ai)
2. Create an API key → copy it → `XAI_API_KEY`

### 4. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env`:
```
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_KEY=eyJhbGci...
ADMIN_PASSWORD=your-very-secure-password
SECRET_KEY=random-string-at-least-32-chars
XAI_API_KEY=xai-...
```

### 5. Run locally

```bash
python app.py
```

Open [http://localhost:5000](http://localhost:5000)

---

## Deployment (Render — Free Tier)

Render hosts the Flask backend for free.

1. Push your code to a **GitHub** repository (`.env` must NOT be committed)
2. Go to [render.com](https://render.com) → New → **Web Service**
3. Connect your GitHub repo
4. Configure:
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn app:app --bind 0.0.0.0:$PORT --workers 2`
   - **Python version:** 3.12
5. Add **Environment Variables** in Render dashboard:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `ADMIN_PASSWORD`
   - `SECRET_KEY`
   - `XAI_API_KEY`
6. Deploy → your site is live at `https://your-app.onrender.com`

### Alternative: Railway

1. [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Add the same environment variables in the **Variables** tab
3. Railway auto-detects the Procfile

---

## Where Each Service Is Deployed

| Service        | Where                                 | What it does                        |
|----------------|---------------------------------------|-------------------------------------|
| **Flask app**  | Render or Railway                     | Serves frontend, handles all APIs   |
| **Database**   | Supabase                              | Stores all portfolio content        |
| **AI (Grok)**  | xAI API (external, paid)              | Powers the chatbot                  |
| **Images**     | Anywhere (you paste the URL)          | Displayed via `<img src="url">`     |
| **Fonts**      | Google Fonts CDN                      | Syne + DM Sans                      |

> **Images**: Store images anywhere public (Supabase Storage, Cloudinary, Imgur, GitHub, etc.) and paste the direct URL into the admin form. No file is uploaded to this app.

---

## Admin Usage

1. Click **Admin** button in the top nav
2. Enter your `ADMIN_PASSWORD`
3. A floating **✎ (edit)** or **+ (add)** button appears on each page
4. Click it to open the edit modal — make changes — click Save

### What you can edit

| Page     | Actions                                      |
|----------|----------------------------------------------|
| Home     | Name, title, tagline, collaboration text     |
| About    | Profile image URL, shape, description text   |
| Skills   | Add / edit / delete each skill card          |
| Projects | Add / edit / delete each project card        |
| Contact  | Email, phone, location, social links         |

---

## Image URL Guide

All images are referenced by URL. Recommended free hosts:

| Service          | Use case             | Free?  |
|------------------|----------------------|--------|
| Supabase Storage | Your own files       | Yes    |
| Cloudinary       | Any image            | Yes    |
| GitHub (raw)     | Images in your repo  | Yes    |
| Imgur            | Quick uploads        | Yes    |

**Image ratios to use:**
- **Profile photo (About page):** any (shape is configurable — circle, square, rectangle, rounded)
- **Skill icons:** 1:1 square (e.g. 64×64 or 128×128)
- **Project screenshots:** 16:9 (e.g. 1280×720)

---

## Environment Variables Reference

| Variable         | Required | Description                                 |
|------------------|----------|---------------------------------------------|
| `SUPABASE_URL`   | ✅       | Your Supabase project URL                   |
| `SUPABASE_KEY`   | ✅       | Supabase anon/public key                    |
| `ADMIN_PASSWORD` | ✅       | Password to unlock CMS editing              |
| `SECRET_KEY`     | ✅       | Flask session secret (random string)        |
| `XAI_API_KEY`    | ✅       | xAI Grok API key for chatbot                |

---

## Security Notes

- The `ADMIN_PASSWORD` is only checked server-side; never exposed to the client
- Flask sessions are signed with `SECRET_KEY`
- Supabase RLS allows public reads; writes go through Flask which guards with session check
- Never commit your `.env` file

---

## License

MIT — use it for your personal portfolio freely.
