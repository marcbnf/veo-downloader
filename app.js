const WORKER_ENDPOINT = "https://veo-proxy.marcbnf.workers.dev/";

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

  // 1. Extraction de l'ID vidéo (d'après le regex du code Python)
  const idMatch = veoLink.match(/app\.veo\.co\/matches\/([0-9A-Za-z-_]+)/);
  if (!idMatch) {
    out.className = "out err";
    out.textContent = "Lien Veo invalide.";
    return;
  }
  const videoId = idMatch[1];

  incrementDailyCount();

  try {
    // 2. Construction de l'URL de l'API Veo exposée dans le Python
    const apiUrl = `https://app.veo.co/api/app/matches/${videoId}/videos`;

    // 3. Appel de l'API via ton proxy pour contourner les CORS
    const proxyUrl = new URL(WORKER_ENDPOINT);
    proxyUrl.searchParams.set("url", apiUrl);

    const videoData = await fetch(proxyUrl.toString(), { method: "GET" }).then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json(); // On parse en JSON directement
    });

    if (!Array.isArray(videoData) || videoData.length === 0) {
      throw new Error("Aucune donnée vidéo trouvée.");
    }

    // 4. Logique de filtrage équivalente au script Python
    let bestUrl = null;
    let bestHeight = 0;

    for (const fmt of videoData) {
      const url = fmt.url;
      const mimeType = fmt.mime_type;
      const height = parseInt(fmt.height, 10) || 0;
      const renderType = fmt.render_type;

      // Le script Python ignore les configurations vidéo mp2t ou les urls vides
      if (!url || mimeType === 'video/mp2t') {
        continue;
      }

      // On évite 'panorama' car le script Python indique que ces URLs sont 
      // souvent mortes même quand elles sont renvoyées par l'API.
      // On cherche la meilleure résolution des vidéos classiques.
      if (renderType !== 'panorama' && height > bestHeight) {
        bestHeight = height;
        bestUrl = url;
      }
    }

    // Fallback de sécurité : si aucune vidéo non-panoramique n'est trouvée,
    // on prend la première URL mp4 valide disponible.
    if (!bestUrl) {
      const fallback = videoData.find(fmt => fmt.url && fmt.mime_type !== 'video/mp2t');
      if (fallback) bestUrl = fallback.url;
    }

    if (!bestUrl) throw new Error("Aucune URL vidéo MP4 exploitable trouvée.");

    out.innerHTML = `
      <video src="${bestUrl}" controls playsinline style="width: 100%; border-radius: 8px; margin-bottom: 1rem;"></video>
      <button id="download">Ouvrir le lien</button>
    `;

    document.querySelector("#download").addEventListener("click", () => {
      const a = document.createElement("a");
      a.href = bestUrl;
      a.download = "video.mp4"; // Ou ${videoId}.mp4
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
