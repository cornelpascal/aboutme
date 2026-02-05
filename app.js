const USER = "cornelpascal";
const API = `https://api.github.com/users/${USER}/repos?per_page=100&sort=updated`;
const grid = document.getElementById("grid");
const q = document.getElementById("q");

function card(repo){
  return `
    <article class="repo">
      <div>
        <h3>${repo.name}</h3>
        <p>${repo.description || "No description."}</p>
      </div>
      <div class="meta">
        ${repo.language ? `<span>${repo.language}</span>` : ""}
        <span>★ ${repo.stargazers_count}</span>
      </div>
      <a href="${repo.html_url}" target="_blank">CODE</a>
    </article>
  `;
}

fetch(API)
  .then(r=>r.json())
  .then(repos=>{
    const render = () => {
      const term = q.value.toLowerCase();
      grid.innerHTML = repos
        .filter(r => r.name.toLowerCase().includes(term))
        .map(card)
        .join("");
    };
    q.addEventListener("input", render);
    render();
  });
