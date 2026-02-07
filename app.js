const WORKER_ENDPOINT = "https://veo-proxy.marcbnf.workers.dev/";

const re = /https:\/\/c\.veocdn\.com\/[a-z0-9-]+\/standard\/machine\/[a-z0-9]+\/?/i;

const out = document.querySelector("#out");
const input = document.querySelector("#veoLink");

document.querySelector("#go").addEventListener("click", async () => {
  out.className = "out";
  out.textContent = "Chargement...";

  const veoLink = input.value.trim();
  if (!veoLink) {
    out.className = "out err";
    out.textContent = "Renseigne un lien Veo.";
    return;
  }

  incrementDailyCount();

  try {
    const url = new URL(WORKER_ENDPOINT);
    url.searchParams.set("url", veoLink);

    const html = await fetch(url.toString(), { method: "GET" }).then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.text();
    });

    const m = html.match(re);
    if (!m?.[0]) throw new Error("Aucune URL veocdn détectée.");

    const mp4 = (m[0].endsWith("/") ? m[0] : (m[0] + "/")) + "video.mp4";

    out.innerHTML = `
      <video src="${mp4}" controls playsinline style="width: 100%; border-radius: 8px; margin-bottom: 1rem;"></video>
      <button id="download">Ouvrir le lien</button>
    `;

    document.querySelector("#download").addEventListener("click", () => {
      const a = document.createElement("a");
      a.href = mp4;
      a.download = "video.mp4";
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
  } catch (e) {
    out.className = "out err";
    out.textContent = `Erreur: ${e.message || e}`;
  }
});

// Gestion du thème (Jour / Nuit)
const toggle = document.getElementById("theme-toggle");
const html = document.documentElement;
const savedTheme = localStorage.getItem("theme");
const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

if (savedTheme === "dark" || (!savedTheme && systemDark)) {
  html.setAttribute("data-theme", "dark");
  toggle.textContent = "☀️";
}

toggle.addEventListener("click", () => {
  const isDark = html.getAttribute("data-theme") === "dark";
  html.setAttribute("data-theme", isDark ? "light" : "dark");
  localStorage.setItem("theme", isDark ? "light" : "dark");
  toggle.textContent = isDark ? "🌙" : "☀️";
});

// Compteur de requêtes quotidien
const counterEl = document.createElement("div");
counterEl.style.textAlign = "center";
counterEl.style.marginTop = "0.5rem";
counterEl.style.marginBottom = "0.5rem";
counterEl.style.fontSize = "0.85rem";
counterEl.style.opacity = "0.7";
if (out.parentNode) out.parentNode.insertBefore(counterEl, out);

function getDailyStats() {
  const today = new Date().toLocaleDateString();
  const stats = JSON.parse(localStorage.getItem("veo_stats") || "{}");
  if (stats.date !== today) return { date: today, count: 0 };
  return stats;
}

function updateCounterUI() {
  const stats = getDailyStats();
  counterEl.textContent = `Requêtes aujourd'hui : ${stats.count}`;
}

function incrementDailyCount() {
  const stats = getDailyStats();
  stats.count++;
  localStorage.setItem("veo_stats", JSON.stringify(stats));
  updateCounterUI();
}

updateCounterUI();
