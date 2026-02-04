// app.js
const USER = "cornelpascal";
const API_PROFILE = `https://api.github.com/users/${USER}`;
const API_REPOS = `https://api.github.com/users/${USER}/repos?per_page=100&sort=updated`;

const $ = (s) => document.querySelector(s);

function fmt(d){
  const dt = new Date(d);
  return dt.toLocaleDateString(undefined,{year:"numeric",month:"short",day:"2-digit"});
}

/* Progress bar */
function initProgress(){
  const bar = $("#bar");
  const onScroll = () => {
    const h = document.documentElement;
    const max = (h.scrollHeight - h.clientHeight) || 1;
    bar.style.width = `${(h.scrollTop / max) * 100}%`;
  };
  document.addEventListener("scroll", onScroll, {passive:true});
  onScroll();
}

/* Reveal animation */
function initReveal(root=document){
  const els = Array.from(root.querySelectorAll(".reveal"));
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        e.target.classList.add("is-in");
        io.unobserve(e.target);
      }
    });
  }, {threshold:0.12, rootMargin:"0px 0px -10% 0px"});
  els.forEach(el=>io.observe(el));
}

/* Mobile nav */
function initMobileNav(){
  const btn = $("#navBtn");
  const nav = $("#nav");
  if(!btn || !nav) return;

  btn.addEventListener("click", ()=>{
    const open = btn.getAttribute("aria-expanded") === "true";
    btn.setAttribute("aria-expanded", String(!open));
    nav.style.display = open ? "none" : "flex";
    nav.style.flexDirection = "column";
    nav.style.position = "absolute";
    nav.style.right = "16px";
    nav.style.top = "64px";
    nav.style.padding = "10px";
    nav.style.borderRadius = "14px";
    nav.style.background = "rgba(5,6,11,.85)";
    nav.style.border = "1px solid rgba(255,255,255,.12)";
    nav.style.backdropFilter = "blur(14px)";
  });

  nav.addEventListener("click", (e)=>{
    if(e.target.tagName === "A" && window.innerWidth <= 680){
      btn.setAttribute("aria-expanded","false");
      nav.style.display = "none";
    }
  });
}

/* GitHub rendering */
function chipHTML(lang, n){
  return `<span class="pill">${lang} · ${n}</span>`;
}
function topLangs(repos){
  const m = new Map();
  repos.forEach(r=>{
    if(!r.language) return;
    m.set(r.language, (m.get(r.language)||0)+1);
  });
  return [...m.entries()].sort((a,b)=>b[1]-a[1]).slice(0,8);
}
function repoCard(r){
  const desc = (r.description || "No description yet.").trim();
  const lang = r.language ? `<span class="pill">${r.language}</span>` : "";
  return `
    <article class="repo reveal">
      <div class="repo__top">
        <div>
          <div class="repo__name">${r.name}</div>
          <div class="repo__desc">${desc}</div>
        </div>
        <a class="a" target="_blank" rel="noreferrer" href="${r.html_url}">code</a>
      </div>
      <div class="repo__meta">
        ${lang}
        <span class="pill">★ ${r.stargazers_count ?? 0}</span>
        <span class="pill">updated ${fmt(r.updated_at)}</span>
      </div>
    </article>
  `;
}
function applyFilters(repos){
  const q = ($("#q")?.value || "").toLowerCase().trim();
  const lang = $("#lang")?.value || "";
  const sort = $("#sort")?.value || "updated";

  let out = repos.slice();

  if(q){
    out = out.filter(r =>
      (`${r.name} ${r.description||""} ${r.language||""}`).toLowerCase().includes(q)
    );
  }
  if(lang) out = out.filter(r => r.language === lang);

  if(sort === "stars") out.sort((a,b)=>(b.stargazers_count||0)-(a.stargazers_count||0));
  else if(sort === "name") out.sort((a,b)=>a.name.localeCompare(b.name));
  else out.sort((a,b)=>new Date(b.updated_at)-new Date(a.updated_at));

  return out;
}

async function loadGitHub(){
  const note = $("#note");
  const [pRes, rRes] = await Promise.all([
    fetch(API_PROFILE, {headers:{Accept:"application/vnd.github+json"}}),
    fetch(API_REPOS, {headers:{Accept:"application/vnd.github+json"}}),
  ]);

  if(!pRes.ok || !rRes.ok){
    if(note) note.hidden = false;
    return;
  }

  const profile = await pRes.json();
  const repos = await rRes.json();

  $("#name").textContent = profile.name || profile.login || USER;
  $("#meta").textContent = [profile.bio, profile.location ? `• ${profile.location}` : ""].filter(Boolean).join(" ");
  $("#repoCount").textContent = profile.public_repos ?? "—";
  $("#followers").textContent = profile.followers ?? "—";
  $("#updated").textContent = repos?.[0]?.updated_at ? fmt(repos[0].updated_at) : "—";

  const chips = $("#langChips");
  const langs = topLangs(repos);
  if(chips) chips.innerHTML = langs.map(([l,n])=>chipHTML(l,n)).join("");

  const sel = $("#lang");
  if(sel){
    langs.forEach(([l])=>{
      const opt = document.createElement("option");
      opt.value = l;
      opt.textContent = l;
      sel.appendChild(opt);
    });
  }

  const grid = $("#grid");
  const render = () => {
    const filtered = applyFilters(repos);
    grid.innerHTML = filtered.map(repoCard).join("");
    initReveal(grid);
  };

  ["q","lang","sort"].forEach(id=>{
    const el = document.getElementById(id);
    if(!el) return;
    el.addEventListener("input", render);
    el.addEventListener("change", render);
  });

  render();
}

/* Boot */
(() => {
  $("#year").textContent = new Date().getFullYear();
  initProgress();
  initReveal();
  initMobileNav();

  loadGitHub().catch(()=> {
    const note = $("#note");
    if(note) note.hidden = false;
  });
})();
