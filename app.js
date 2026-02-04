/* ===============================
   Config
================================ */
const USERNAME = "cornelpascal";
const GH = {
  profile: `https://api.github.com/users/${USERNAME}`,
  repos: `https://api.github.com/users/${USERNAME}/repos?per_page=100&sort=updated`,
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

/* ===============================
   Scroll progress
================================ */
function initProgress() {
  const bar = $("#progressBar");
  const onScroll = () => {
    const h = document.documentElement;
    const max = (h.scrollHeight - h.clientHeight) || 1;
    const pct = (h.scrollTop / max) * 100;
    bar.style.width = `${pct}%`;
  };
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

/* ===============================
   Scroll reveal (IntersectionObserver)
================================ */
function initReveal() {
  const els = $$(".reveal");
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      }
    },
    { threshold: 0.12, rootMargin: "0px 0px -10% 0px" }
  );
  els.forEach((el) => io.observe(el));
}

/* ===============================
   Mobile nav (simple)
================================ */
function initMobileNav() {
  const btn = $("#navBtn");
  const nav = document.querySelector(".nav");
  if (!btn || !nav) return;

  btn.addEventListener("click", () => {
    const open = btn.getAttribute("aria-expanded") === "true";
    btn.setAttribute("aria-expanded", String(!open));
    nav.style.display = open ? "none" : "flex";
    nav.style.flexDirection = "column";
    nav.style.gap = "6px";
    nav.style.position = "absolute";
    nav.style.top = "64px";
    nav.style.right = "16px";
    nav.style.padding = "10px";
    nav.style.borderRadius = "14px";
    nav.style.background = "rgba(7,8,21,.85)";
    nav.style.border = "1px solid rgba(255,255,255,.12)";
    nav.style.backdropFilter = "blur(14px)";
    nav.style.boxShadow = "0 20px 60px rgba(0,0,0,.45)";
  });

  // Close menu when clicking a nav link
  nav.addEventListener("click", (e) => {
    if (e.target.tagName === "A" && window.innerWidth <= 680) {
      btn.setAttribute("aria-expanded", "false");
      nav.style.display = "none";
    }
  });
}

/* ===============================
   Particles canvas (lightweight)
================================ */
function initParticles() {
  const c = $("#particles");
  if (!c) return;
  const ctx = c.getContext("2d");
  let w = 0, h = 0;

  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const resize = () => {
    w = c.clientWidth; h = c.clientHeight;
    c.width = Math.floor(w * dpr);
    c.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const n = 70;
  const pts = Array.from({ length: n }, () => ({
    x: Math.random(), y: Math.random(),
    vx: (Math.random() - 0.5) * 0.12,
    vy: (Math.random() - 0.5) * 0.12,
    r: 1 + Math.random() * 2.2,
  }));

  const step = () => {
    ctx.clearRect(0, 0, w, h);

    // points
    for (const p of pts) {
      p.x += p.vx / w;
      p.y += p.vy / h;
      if (p.x < -0.05) p.x = 1.05;
      if (p.x > 1.05) p.x = -0.05;
      if (p.y < -0.05) p.y = 1.05;
      if (p.y > 1.05) p.y = -0.05;

      const x = p.x * w, y = p.y * h;
      ctx.beginPath();
      ctx.arc(x, y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.fill();
    }

    // lines (only near neighbors)
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const a = pts[i], b = pts[j];
        const dx = (a.x - b.x) * w;
        const dy = (a.y - b.y) * h;
        const d = Math.hypot(dx, dy);
        if (d < 140) {
          ctx.strokeStyle = `rgba(255,255,255,${(1 - d / 140) * 0.12})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x * w, a.y * h);
          ctx.lineTo(b.x * w, b.y * h);
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(step);
  };

  window.addEventListener("resize", resize, { passive: true });
  resize();
  step();
}

/* ===============================
   GitHub API
================================ */
function fmtDate(d) {
  const dt = new Date(d);
  return dt.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

function safeText(s) {
  return (s ?? "").toString().trim();
}

function repoCard(r) {
  const lang = r.language ? `<span class="pill">${r.language}</span>` : "";
  const stars = `<span class="pill">★ ${r.stargazers_count ?? 0}</span>`;
  const forks = `<span class="pill">⑂ ${r.forks_count ?? 0}</span>`;
  const updated = `<span class="pill">Updated ${fmtDate(r.updated_at)}</span>`;

  const desc = safeText(r.description) || "No description yet.";
  const homepage = safeText(r.homepage);

  const homeLink = homepage
    ? `<a class="link" target="_blank" rel="noreferrer" href="${homepage}">Live</a>`
    : "";

  return `
    <article class="repo reveal">
      <div class="repo__top">
        <div>
          <div class="repo__name">${r.name}</div>
          <div class="repo__desc">${desc}</div>
        </div>
        <a class="link" target="_blank" rel="noreferrer" href="${r.html_url}">Code</a>
      </div>
      <div class="repo__meta">
        ${lang}
        ${stars}
        ${forks}
        ${updated}
        ${homeLink}
      </div>
    </article>
  `;
}

function computeTopLanguages(repos) {
  const map = new Map();
  for (const r of repos) {
    if (!r.language) continue;
    map.set(r.language, (map.get(r.language) || 0) + 1);
  }
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
}

function fillLanguageFilter(langs) {
  const sel = $("#language");
  if (!sel) return;
  for (const [lang] of langs) {
    const opt = document.createElement("option");
    opt.value = lang;
    opt.textContent = lang;
    sel.appendChild(opt);
  }
}

function renderLangChips(langs) {
  const el = $("#langChips");
  if (!el) return;
  el.innerHTML = langs.map(([l, n]) => `<span class="chip">${l} · ${n}</span>`).join("");
}

function applyFilters(repos) {
  const q = ($("#search")?.value || "").toLowerCase().trim();
  const lang = $("#language")?.value || "";
  const sort = $("#sort")?.value || "updated";

  let out = repos.slice();

  if (q) {
    out = out.filter((r) => {
      const hay = `${r.name} ${r.description || ""} ${r.language || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }
  if (lang) out = out.filter((r) => r.language === lang);

  if (sort === "stars") {
    out.sort((a, b) => (b.stargazers_count ?? 0) - (a.stargazers_count ?? 0));
  } else if (sort === "name") {
    out.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    out.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  }

  return out;
}

async function loadGitHub() {
  const apiNote = $("#apiNote");

  const profileRes = await fetch(GH.profile, { headers: { "Accept": "application/vnd.github+json" } });
  if (profileRes.status === 403 && apiNote) apiNote.hidden = false;
  const profile = profileRes.ok ? await profileRes.json() : null;

  const reposRes = await fetch(GH.repos, { headers: { "Accept": "application/vnd.github+json" } });
  if (reposRes.status === 403 && apiNote) apiNote.hidden = false;
  const repos = reposRes.ok ? await reposRes.json() : [];

  // Profile UI
  if (profile) {
    $("#name").textContent = profile.name || profile.login || USERNAME;
    $("#meta").textContent = [
      profile.bio ? profile.bio : "Public projects and coursework",
      profile.location ? `• ${profile.location}` : "",
    ].filter(Boolean).join(" ");

    $("#repoCount").textContent = String(profile.public_repos ?? "—");
    $("#followerCount").textContent = String(profile.followers ?? "—");

    const latest = repos.length ? repos.map(r => r.updated_at).sort().slice(-1)[0] : profile.updated_at;
    $("#updatedAt").textContent = latest ? fmtDate(latest) : "—";

    // Avatar
    const av = $("#avatar");
    if (av && profile.avatar_url) {
      av.innerHTML = `<img src="${profile.avatar_url}" alt="GitHub avatar" loading="lazy" />`;
    }
  }

  // Language chips + filter
  const langs = computeTopLanguages(repos);
  fillLanguageFilter(langs);
  renderLangChips(langs);

  // Repo rendering
  const grid = $("#repoGrid");
  const render = () => {
    const filtered = applyFilters(repos);
    grid.innerHTML = filtered.map(repoCard).join("");

    // Re-run reveal on newly-inserted cards
    $$("#repoGrid .reveal").forEach((el) => el.classList.remove("is-in"));
    initReveal();
  };

  ["search", "language", "sort"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("input", render);
    el.addEventListener("change", render);
  });

  render();
}

/* ===============================
   Small “dynamic” touches
================================ */
function initHeroMotion() {
  const hero = document.querySelector(".hero");
  if (!hero) return;

  const onMove = (e) => {
    const rect = hero.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    // Parallax-ish by moving blobs slightly
    const a = document.querySelector(".bg__blob--a");
    const b = document.querySelector(".bg__blob--b");
    if (a) a.style.transform = `translate3d(${x * 30}px, ${y * 20}px, 0) scale(1.02)`;
    if (b) b.style.transform = `translate3d(${-x * 24}px, ${-y * 18}px, 0) scale(1.04)`;
  };

  hero.addEventListener("mousemove", onMove);
}

function initYear() {
  const el = $("#year");
  if (el) el.textContent = String(new Date().getFullYear());
}

/* ===============================
   Boot
================================ */
(async function boot() {
  initYear();
  initProgress();
  initReveal();
  initMobileNav();
  initParticles();
  initHeroMotion();

  try {
    await loadGitHub();
  } catch (err) {
    console.error(err);
    const note = $("#apiNote");
    if (note) {
      note.hidden = false;
      note.innerHTML = `<strong>Couldn’t load GitHub data.</strong> If you’re offline or rate-limited, try again later.`;
    }
  }
})();
