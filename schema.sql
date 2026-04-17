-- ============================================================
-- Portfolio CMS — Supabase Schema
-- Run this in Supabase > SQL Editor
-- ============================================================

-- Home page content
CREATE TABLE IF NOT EXISTS home (
  id          SERIAL PRIMARY KEY,
  name        TEXT DEFAULT 'Your Name',
  title       TEXT DEFAULT 'Full Stack Developer',
  tagline     TEXT DEFAULT 'Building things that matter.',
  collab_text TEXT DEFAULT 'Open to Collaboration',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- About page content
CREATE TABLE IF NOT EXISTS about (
  id          SERIAL PRIMARY KEY,
  image_url   TEXT,
  image_shape TEXT DEFAULT 'circle', -- circle | square | rectangle | rounded
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Skills
CREATE TABLE IF NOT EXISTS skills (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  image_url     TEXT,
  description   TEXT,
  certification TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id           SERIAL PRIMARY KEY,
  title        TEXT NOT NULL,
  image_url    TEXT,
  description  TEXT,
  techstack    TEXT,   -- comma-separated e.g. "React, Node.js, PostgreSQL"
  live_link    TEXT,
  github_link  TEXT,
  video_link   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Contact details
CREATE TABLE IF NOT EXISTS contact (
  id        SERIAL PRIMARY KEY,
  bio       TEXT DEFAULT 'Get in touch through any of these channels.',
  email     TEXT,
  phone     TEXT,
  location  TEXT,
  linkedin  TEXT,
  github    TEXT,
  twitter   TEXT,
  website   TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Row Level Security ────────────────────────────────────────────────────────
-- All tables: allow public READ, but backend handles writes (anon key used for
-- all operations since auth is handled by Flask session + env password).
-- If you want extra Supabase-level protection, enable RLS with service_role key.

ALTER TABLE home    ENABLE ROW LEVEL SECURITY;
ALTER TABLE about   ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills  ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact ENABLE ROW LEVEL SECURITY;

-- Allow anon to SELECT (public read)
CREATE POLICY "Public read home"     ON home     FOR SELECT USING (true);
CREATE POLICY "Public read about"    ON about    FOR SELECT USING (true);
CREATE POLICY "Public read skills"   ON skills   FOR SELECT USING (true);
CREATE POLICY "Public read projects" ON projects FOR SELECT USING (true);
CREATE POLICY "Public read contact"  ON contact  FOR SELECT USING (true);

-- Allow anon to INSERT/UPDATE/DELETE (Flask session guards the routes)
CREATE POLICY "Anon write home"     ON home     FOR ALL USING (true);
CREATE POLICY "Anon write about"    ON about    FOR ALL USING (true);
CREATE POLICY "Anon write skills"   ON skills   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon write projects" ON projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon write contact"  ON contact  FOR ALL USING (true);
