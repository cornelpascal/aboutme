const USER = "cornelpascal";
const API_PROFILE = `https://api.github.com/users/${USER}`;
const API_REPOS = `https://api.github.com/users/${USER}/repos?per_page=100&sort=updated`;

const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

function fmt(d){
  const dt = new Date(d);
  return dt.toLocaleDateString(undefined,{year:"numeric",month:"short",day:"2-digit"});
}

function progress(){
  const bar = $("#bar");
  const h = document.documentElement;
  const max = (h.scrollHeight - h.clientHeight) || 1;
  const pct = (h.scrollTop / max) * 100;
  bar.style.width = pct + "%";
}

function revealInit(){
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    });
  }, {threshold:0.12, rootMargin:"0px 0px -10% 0px"});

  $$(".reveal").forEach(el=>io.observe(el));
}

function repoCard(r){
  const desc = (r.description || "No description yet.").trim();
  const lang = r.language ? `<span class="p">${r.language}</span>` : "";
  return `
    <article class="repo reveal">
      <div class="t">
        <div>
          <div class="n">${r.name}</div>
          <div class="d">${desc}</div>
        </div>
        <a class="btn" style="padding:9px 10px;border-radius:12px" target="_blank" rel="noreferrer" href="${r.html_url}">Code</a>
      </div>
      <div class="m">
        ${lang}
        <span class="p">★ ${r.stargazers_count ?? 0}</span>
        <span class="p">Updated ${fmt(r.updated_at)}</span>
      </div>
    </article>
  `;
}

function topLangs(repos){
  const m = new Map();
  repos.forEach(r=>{
    if(!r.language) return;
    m.set(r.language, (m.get(r.language) || 0) + 1);
  });
  return [...m.entries()].sort((a,b)=>b[1]-a[1]).slice(0,12);
}

function applyFilters(repos){
  const q = ($("#q").value || "").toLowerCase().trim();
  const lang = $("#lang").value || "";
  const sort = $("#sort").value || "updated";

  let out = repos.slice();

  if(q){
    out = out.filter(r => (`${r.name} ${r.description||""} ${r.language||""}`).toLowerCase().includes(q));
  }
  if(lang){
    out = out.filter(r => r.language === lang);
  }

  if(sort === "stars"){
    out.sort((a,b)=>(b.stargazers_count||0)-(a.stargazers_count||0));
  } else if(sort === "name"){
    out.sort((a,b)=>a.name.localeCompare(b.name));
  } else {
    out.sort((a,b)=>new Date(b.updated_at)-new Date(a.updated_at));
  }
  return out;
}

async function load(){
  const note = $("#note");

  const [pRes, rRes] = await Promise.all([
    fetch(API_PROFILE, {headers:{Accept:"application/vnd.github+json"}}),
    fetch(API_REPOS, {headers:{Accept:"application/vnd.github+json"}}),
  ]);

  if(!pRes.ok || !rRes.ok){
    note.hidden = false;
    return;
  }

  const profile = await pRes.json();
  const repos = await rRes.json();

  $("#name").textContent = profile.name || profile.login || USER;
  $("#meta").textContent = [profile.bio, profile.location ? `• ${profile.location}` : ""].filter(Boolean).join(" ");
  $("#repoCount").textContent = profile.public_repos ?? "—";
  $("#followers").textContent = profile.followers ?? "—";
  $("#updated").textContent = repos?.[0]?.updated_at ? fmt(repos[0].updated_at) : "—";

  const langSel = $("#lang");
  topLangs(repos).forEach(([l])=>{
    const opt = document.createElement("option");
    opt.value = l;
    opt.textContent = l;
    langSel.appendChild(opt);
  });

  const grid = $("#grid");
  const render = () => {
    const filtered = applyFilters(repos);
    grid.innerHTML = filtered.map(repoCard).join("");
    revealInit(); // animate newly inserted cards
  };

  ["q","lang","sort"].forEach(id=>{
    const el = document.getElementById(id);
    el.addEventListener("input", render);
    el.addEventListener("change", render);
  });

  render();
}

document.addEventListener("scroll", progress, {passive:true});
progress();
revealInit();
$("#year").textContent = new Date().getFullYear();

load().catch(()=>{ $("#note").hidden = false; });
