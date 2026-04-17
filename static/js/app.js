/* ── State ───────────────────────────────────────────────────────────────── */
let isAdmin = false;
let currentPage = 'home';
let chatHistory = [];

/* ── DOM helpers ─────────────────────────────────────────────────────────── */
const $ = (id) => document.getElementById(id);
const q = (sel) => document.querySelector(sel);
const hide = (el) => el && el.classList.add('hidden');
const show = (el) => el && el.classList.remove('hidden');

/* ── Toast ───────────────────────────────────────────────────────────────── */
function toast(msg, type = '') {
  const t = $('toast');
  t.textContent = msg;
  t.className = `toast ${type}`;
  show(t);
  setTimeout(() => hide(t), 3000);
}

/* ── API fetch helper ────────────────────────────────────────────────────── */
async function api(method, url, body = null) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

/* ── Session check ───────────────────────────────────────────────────────── */
async function checkSession() {
  const { admin } = await api('GET', '/api/session');
  setAdminState(admin);
}
function setAdminState(admin) {
  isAdmin = admin;
  if (admin) {
    hide($('adminToggle'));
    show($('adminBadge'));
  } else {
    show($('adminToggle'));
    hide($('adminBadge'));
  }
  refreshAdminControls();
}

function refreshAdminControls() {
  // Show/hide FABs
  const fabMap = {
    home: 'home-edit-btn',
    about: 'about-edit-btn',
    skills: 'skills-add-btn',
    projects: 'projects-add-btn',
    contact: 'contact-edit-btn',
  };
  Object.values(fabMap).forEach(id => {
    const el = $(id);
    if (el) { isAdmin ? show(el) : hide(el); }
  });
  // Show/hide card action buttons
  document.querySelectorAll('.card-actions').forEach(el => {
    isAdmin ? show(el) : hide(el);
  });
}

/* ── Navigation ──────────────────────────────────────────────────────────── */
function navigate(page) {
  if (currentPage === page) return;
  // hide current
  hide($(`page-${currentPage}`));
  // show new
  const el = $(`page-${page}`);
  if (!el) return;
  show(el);
  currentPage = page;
  // update nav links
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.classList.toggle('active', a.dataset.page === page);
  });
  // update nav brand
  checkSession(); // refresh admin state
  loadPage(page);
  // close mobile menu
  $('nav-links').classList.remove('open');
}

function loadPage(page) {
  switch (page) {
    case 'home': loadHome(); break;
    case 'about': loadAbout(); break;
    case 'skills': loadSkills(); break;
    case 'projects': loadProjects(); break;
    case 'contact': loadContact(); break;
  }
}

/* ── Home ────────────────────────────────────────────────────────────────── */
async function loadHome() {
  try {
    const d = await api('GET', '/api/home');
    $('home-name').textContent = d.name || 'Your Name';
    $('home-title').textContent = d.title || 'Full Stack Developer';
    $('home-tagline').textContent = d.tagline || 'Building things that matter.';
    $('home-collab').textContent = d.collab_text || 'Open to Collaboration';
    $('nav-brand').textContent = d.name || 'Portfolio';
  } catch {}
}

$('home-edit-btn')?.addEventListener('click', async () => {
  const d = await api('GET', '/api/home').catch(() => ({}));
  $('hm-name').value = d.name || '';
  $('hm-title').value = d.title || '';
  $('hm-tagline').value = d.tagline || '';
  $('hm-collab').value = d.collab_text || '';
  show($('homeModal'));
});
$('homeModalSave')?.addEventListener('click', async () => {
  try {
    await api('PUT', '/api/home', {
      name: $('hm-name').value,
      title: $('hm-title').value,
      tagline: $('hm-tagline').value,
      collab_text: $('hm-collab').value,
    });
    hide($('homeModal'));
    loadHome();
    toast('Home updated!', 'success');
  } catch (e) { toast(e.message, 'error'); }
});
$('homeModalCancel')?.addEventListener('click', () => hide($('homeModal')));

/* ── About ───────────────────────────────────────────────────────────────── */
async function loadAbout() {
  try {
    const d = await api('GET', '/api/about');
    if (d.image_url) {
      $('about-img').src = d.image_url;
      show($('about-img'));
    } else hide($('about-img'));
    $('about-img').className = `about-img shape-${d.image_shape || 'circle'}`;
    $('about-desc').textContent = d.description || 'No description yet.';
  } catch {}
}

$('about-edit-btn')?.addEventListener('click', async () => {
  const d = await api('GET', '/api/about').catch(() => ({}));
  $('ab-img').value = d.image_url || '';
  $('ab-shape').value = d.image_shape || 'circle';
  $('ab-desc').value = d.description || '';
  show($('aboutModal'));
});
$('aboutModalSave')?.addEventListener('click', async () => {
  try {
    await api('PUT', '/api/about', {
      image_url: $('ab-img').value,
      image_shape: $('ab-shape').value,
      description: $('ab-desc').value,
    });
    hide($('aboutModal'));
    loadAbout();
    toast('About updated!', 'success');
  } catch (e) { toast(e.message, 'error'); }
});
$('aboutModalCancel')?.addEventListener('click', () => hide($('aboutModal')));

/* ── Skills ──────────────────────────────────────────────────────────────── */
async function loadSkills() {
  const grid = $('skills-grid');
  grid.innerHTML = '<div class="skeleton" style="height:200px"></div>'.repeat(3);
  try {
    const skills = await api('GET', '/api/skills');
    if (!skills.length) {
      grid.innerHTML = `<div class="empty-state"><h3>No skills yet</h3><p>Admin can add skills using the + button</p></div>`;
      return;
    }
    grid.innerHTML = skills.map(s => buildSkillCard(s)).join('');
    refreshAdminControls();
  } catch { grid.innerHTML = '<div class="empty-state"><p>Failed to load skills</p></div>'; }
}

function buildSkillCard(s) {
  return `
  <div class="skill-card" data-id="${s.id}">
    <div class="skill-card-img-wrap">
      ${s.image_url ? `<img class="skill-card-img" src="${s.image_url}" alt="${s.name}" loading="lazy" />` : `<div style="width:100%;height:100%;background:var(--bg3);display:flex;align-items:center;justify-content:center;color:var(--text3);font-size:22px">⚙</div>`}
    </div>
    <h3>${esc(s.name)}</h3>
    <p>${esc(s.description)}</p>
    ${s.certification ? `<div class="skill-cert">🏆 ${esc(s.certification)}</div>` : ''}
    <div class="card-actions ${isAdmin ? '' : 'hidden'}">
      <button class="btn-edit" onclick="editSkill(${s.id})">Edit</button>
      <button class="btn-danger" onclick="deleteSkill(${s.id})">Delete</button>
    </div>
  </div>`;
}

window.editSkill = async (id) => {
  const skills = await api('GET', '/api/skills').catch(() => []);
  const s = skills.find(x => x.id === id);
  if (!s) return;
  $('skillModalTitle').textContent = 'Edit Skill';
  $('sk-id').value = s.id;
  $('sk-name').value = s.name;
  $('sk-img').value = s.image_url || '';
  $('sk-desc').value = s.description;
  $('sk-cert').value = s.certification || '';
  show($('skillModal'));
};

window.deleteSkill = async (id) => {
  if (!confirm('Delete this skill?')) return;
  try {
    await api('DELETE', `/api/skills/${id}`);
    loadSkills();
    toast('Skill deleted', 'success');
  } catch (e) { toast(e.message, 'error'); }
};

$('skills-add-btn')?.addEventListener('click', () => {
  $('skillModalTitle').textContent = 'Add Skill';
  $('sk-id').value = '';
  ['sk-name','sk-img','sk-desc','sk-cert'].forEach(id => $(id).value = '');
  show($('skillModal'));
});
$('skillModalSave')?.addEventListener('click', async () => {
  const id = $('sk-id').value;
  const payload = {
    name: $('sk-name').value,
    image_url: $('sk-img').value,
    description: $('sk-desc').value,
    certification: $('sk-cert').value,
  };
  try {
    if (id) await api('PUT', `/api/skills/${id}`, payload);
    else await api('POST', '/api/skills', payload);
    hide($('skillModal'));
    loadSkills();
    toast('Skill saved!', 'success');
  } catch (e) { toast(e.message, 'error'); }
});
$('skillModalCancel')?.addEventListener('click', () => hide($('skillModal')));

/* ── Projects ────────────────────────────────────────────────────────────── */
async function loadProjects() {
  const grid = $('projects-grid');
  grid.innerHTML = '<div class="skeleton" style="height:300px"></div>'.repeat(3);
  try {
    const projects = await api('GET', '/api/projects');
    if (!projects.length) {
      grid.innerHTML = `<div class="empty-state"><h3>No projects yet</h3><p>Admin can add projects using the + button</p></div>`;
      return;
    }
    grid.innerHTML = projects.map(p => buildProjectCard(p)).join('');
    refreshAdminControls();
  } catch { grid.innerHTML = '<div class="empty-state"><p>Failed to load projects</p></div>'; }
}

function buildProjectCard(p) {
  const tags = (p.techstack || '').split(',').map(t => t.trim()).filter(Boolean);
  return `
  <div class="project-card" data-id="${p.id}">
    <div class="project-img-wrap">
      ${p.image_url ? `<img class="project-img" src="${p.image_url}" alt="${p.title}" loading="lazy" />` : `<div style="height:100%;background:var(--bg3);display:flex;align-items:center;justify-content:center;color:var(--text3)">No image</div>`}
    </div>
    <div class="project-body">
      <h3>${esc(p.title)}</h3>
      <p>${esc(p.description)}</p>
      <div class="tech-stack">${tags.map(t => `<span class="tech-tag">${esc(t)}</span>`).join('')}</div>
      <div class="project-links">
        ${p.live_link ? `<a href="${p.live_link}" target="_blank" class="project-link">🌐 Live</a>` : ''}
        ${p.github_link ? `<a href="${p.github_link}" target="_blank" class="project-link">⑂ GitHub</a>` : ''}
        ${p.video_link ? `<a href="${p.video_link}" target="_blank" class="project-link">▶ Demo</a>` : ''}
      </div>
      <div class="card-actions ${isAdmin ? '' : 'hidden'}" style="margin-top:16px">
        <button class="btn-edit" onclick="editProject(${p.id})">Edit</button>
        <button class="btn-danger" onclick="deleteProject(${p.id})">Delete</button>
      </div>
    </div>
  </div>`;
}

window.editProject = async (id) => {
  const projects = await api('GET', '/api/projects').catch(() => []);
  const p = projects.find(x => x.id === id);
  if (!p) return;
  $('projectModalTitle').textContent = 'Edit Project';
  $('pr-id').value = p.id;
  $('pr-title').value = p.title;
  $('pr-img').value = p.image_url || '';
  $('pr-desc').value = p.description;
  $('pr-tech').value = p.techstack || '';
  $('pr-live').value = p.live_link || '';
  $('pr-github').value = p.github_link || '';
  $('pr-video').value = p.video_link || '';
  show($('projectModal'));
};

window.deleteProject = async (id) => {
  if (!confirm('Delete this project?')) return;
  try {
    await api('DELETE', `/api/projects/${id}`);
    loadProjects();
    toast('Project deleted', 'success');
  } catch (e) { toast(e.message, 'error'); }
};

$('projects-add-btn')?.addEventListener('click', () => {
  $('projectModalTitle').textContent = 'Add Project';
  $('pr-id').value = '';
  ['pr-title','pr-img','pr-desc','pr-tech','pr-live','pr-github','pr-video'].forEach(id => $(id).value = '');
  show($('projectModal'));
});
$('projectModalSave')?.addEventListener('click', async () => {
  const id = $('pr-id').value;
  const payload = {
    title: $('pr-title').value,
    image_url: $('pr-img').value,
    description: $('pr-desc').value,
    techstack: $('pr-tech').value,
    live_link: $('pr-live').value,
    github_link: $('pr-github').value,
    video_link: $('pr-video').value,
  };
  try {
    if (id) await api('PUT', `/api/projects/${id}`, payload);
    else await api('POST', '/api/projects', payload);
    hide($('projectModal'));
    loadProjects();
    toast('Project saved!', 'success');
  } catch (e) { toast(e.message, 'error'); }
});
$('projectModalCancel')?.addEventListener('click', () => hide($('projectModal')));

/* ── Contact ─────────────────────────────────────────────────────────────── */
async function loadContact() {
  try {
    const d = await api('GET', '/api/contact');
    const fields = ['email','phone','location','linkedin','github','twitter','website'];
    const icons = { email:'✉', phone:'☎', location:'📍', linkedin:'in', github:'⑂', twitter:'𝕏', website:'🌐' };
    const labels = { email:'Email', phone:'Phone', location:'Location', linkedin:'LinkedIn', github:'GitHub', twitter:'Twitter / X', website:'Website' };

    $('contact-links').innerHTML = fields
      .filter(f => d[f])
      .map(f => {
        const isLink = ['linkedin','github','twitter','website','email'].includes(f);
        const href = f === 'email' ? `mailto:${d[f]}` : d[f];
        return `
        <a href="${isLink ? href : '#'}" target="${f==='email'?'_self':'_blank'}" class="contact-link-item" style="text-decoration:none">
          <div class="contact-link-icon">${icons[f]}</div>
          <div class="contact-link-text">
            <div class="contact-link-label">${labels[f]}</div>
            <div class="contact-link-value">${esc(d[f])}</div>
          </div>
        </a>`;
      }).join('');

    $('contact-info').textContent = d.bio || 'Get in touch through any of these channels.';
  } catch {}
}

$('contact-edit-btn')?.addEventListener('click', async () => {
  const d = await api('GET', '/api/contact').catch(() => ({}));
  ['email','phone','location','linkedin','github','twitter','website'].forEach(f => {
    const el = $(`ct-${f === 'twitter' ? 'twitter' : f}`);
    if (el) el.value = d[f] || '';
  });
  show($('contactModal'));
});
$('contactModalSave')?.addEventListener('click', async () => {
  try {
    await api('PUT', '/api/contact', {
      email: $('ct-email').value,
      phone: $('ct-phone').value,
      location: $('ct-location').value,
      linkedin: $('ct-linkedin').value,
      github: $('ct-github').value,
      twitter: $('ct-twitter').value,
      website: $('ct-website').value,
    });
    hide($('contactModal'));
    loadContact();
    toast('Contact updated!', 'success');
  } catch (e) { toast(e.message, 'error'); }
});
$('contactModalCancel')?.addEventListener('click', () => hide($('contactModal')));

/* ── Chat ────────────────────────────────────────────────────────────────── */
async function sendChat() {
  const input = $('chat-input');
  const msg = input.value.trim();
  if (!msg) return;
  input.value = '';

  appendBubble('user', msg);
  chatHistory.push({ role: 'user', content: msg });

  // typing indicator
  const typingId = 'typing-' + Date.now();
  const messages = $('chat-messages');
  const typingEl = document.createElement('div');
  typingEl.id = typingId;
  typingEl.className = 'chat-bubble bot';
  typingEl.innerHTML = `<div class="chat-bubble-icon">✦</div><div class="chat-typing"><span></span><span></span><span></span></div>`;
  messages.appendChild(typingEl);
  messages.scrollTop = messages.scrollHeight;

  try {
    const { reply } = await api('POST', '/api/chat', { message: msg, history: chatHistory });
    typingEl.remove();
    appendBubble('bot', reply);
    chatHistory.push({ role: 'assistant', content: reply });
  } catch (e) {
    typingEl.remove();
    appendBubble('bot', 'Sorry, something went wrong. Please try again.');
  }
}

function appendBubble(role, text) {
  const messages = $('chat-messages');
  const div = document.createElement('div');
  div.className = `chat-bubble ${role}`;
  div.innerHTML = `<div class="chat-bubble-icon">${role === 'bot' ? '✦' : '👤'}</div><div class="chat-bubble-text">${esc(text)}</div>`;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

$('chat-send')?.addEventListener('click', sendChat);
$('chat-input')?.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); } });

/* ── Login / Logout ──────────────────────────────────────────────────────── */
$('adminToggle')?.addEventListener('click', () => show($('loginModal')));
$('loginCancel')?.addEventListener('click', () => hide($('loginModal')));
$('loginSubmit')?.addEventListener('click', async () => {
  const pw = $('loginPassword').value;
  hide($('loginError'));
  try {
    await api('POST', '/api/login', { password: pw });
    hide($('loginModal'));
    $('loginPassword').value = '';
    setAdminState(true);
    refreshAdminControls();
    loadPage(currentPage);
    toast('Logged in as admin', 'success');
  } catch {
    show($('loginError'));
  }
});
$('loginPassword')?.addEventListener('keydown', e => { if (e.key === 'Enter') $('loginSubmit').click(); });
$('logoutBtn')?.addEventListener('click', async () => {
  await api('POST', '/api/logout');
  setAdminState(false);
  toast('Logged out');
});

/* ── Nav events ──────────────────────────────────────────────────────────── */
document.querySelectorAll('[data-page]').forEach(el => {
  el.addEventListener('click', (e) => {
    e.preventDefault();
    navigate(el.dataset.page);
  });
});
$('nav-brand')?.addEventListener('click', () => navigate('home'));
$('hamburger')?.addEventListener('click', () => $('nav-links').classList.toggle('open'));

/* ── Modal backdrop close ────────────────────────────────────────────────── */
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.add('hidden');
  });
});

/* ── Escape helper ───────────────────────────────────────────────────────── */
function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ── Init ────────────────────────────────────────────────────────────────── */
(async () => {
  await checkSession();
  navigate('home');
  // mark home link active
  q('[data-page="home"]')?.classList.add('active');
})();
