// ============================================
// ANP Monitor - Lógica principal (Dashboard + Cards)
// ============================================

let activities = [];
let chartStatus = null;
let chartResponsavel = null;
let chartCategoria = null;

document.addEventListener("DOMContentLoaded", async () => {
  activities = await loadActivities();
  renderKPIs();
  renderCharts();
  renderCards();
  setupFilters();
});

function renderKPIs() {
  const total = activities.length;
  const concluido = activities.filter(a => a.status === "CONCLUIDO").length;
  const andamento = activities.filter(a => a.status === "EM ANDAMENTO").length;
  const parado = activities.filter(a => a.status === "PARADO").length;
  const definir = activities.filter(a => a.status === "A DEFINIR").length;
  const pct = total ? Math.round((concluido / total) * 100) : 0;

  document.getElementById("kpi-total").textContent = total;
  document.getElementById("kpi-concluido").textContent = concluido;
  document.getElementById("kpi-andamento").textContent = andamento;
  document.getElementById("kpi-parado").textContent = parado;
  document.getElementById("kpi-definir").textContent = definir;
  document.getElementById("kpi-pct").textContent = pct + "% concluído";
}

function getStatusClass(status) {
  const map = {
    "A DEFINIR": "a-definir",
    "PARADO": "parado",
    "EM ANDAMENTO": "em-andamento",
    "CONCLUIDO": "concluido"
  };
  return map[status] || "a-definir";
}

function renderCharts() {
  const statusCounts = {
    "A DEFINIR": 0,
    "PARADO": 0,
    "EM ANDAMENTO": 0,
    "CONCLUIDO": 0
  };
  activities.forEach(a => {
    if (statusCounts[a.status] !== undefined) statusCounts[a.status]++;
  });

  const ctxStatus = document.getElementById("chart-status");
  if (chartStatus) chartStatus.destroy();
  chartStatus = new Chart(ctxStatus, {
    type: "doughnut",
    data: {
      labels: Object.keys(statusCounts),
      datasets: [{
        data: Object.values(statusCounts),
        backgroundColor: ["#64748b", "#ef4444", "#f59e0b", "#22c55e"],
        borderWidth: 0,
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: { color: "#94a3b8", font: { size: 11 }, padding: 12 }
        }
      }
    }
  });

  const respCounts = {};
  activities.forEach(a => {
    respCounts[a.responsavel] = (respCounts[a.responsavel] || 0) + 1;
  });

  const ctxResp = document.getElementById("chart-responsavel");
  if (chartResponsavel) chartResponsavel.destroy();
  chartResponsavel = new Chart(ctxResp, {
    type: "bar",
    data: {
      labels: Object.keys(respCounts),
      datasets: [{
        label: "Atividades",
        data: Object.values(respCounts),
        backgroundColor: "#3b82f6",
        borderRadius: 6,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          ticks: { color: "#94a3b8", font: { size: 10 } },
          grid: { display: false }
        },
        y: {
          ticks: { color: "#94a3b8", stepSize: 1 },
          grid: { color: "rgba(51,65,85,0.5)" },
          beginAtZero: true
        }
      }
    }
  });

  const catCounts = {};
  activities.forEach(a => {
    catCounts[a.categoria] = (catCounts[a.categoria] || 0) + 1;
  });

  const ctxCat = document.getElementById("chart-categoria");
  if (chartCategoria) chartCategoria.destroy();
  chartCategoria = new Chart(ctxCat, {
    type: "bar",
    data: {
      labels: Object.keys(catCounts),
      datasets: [{
        label: "Atividades",
        data: Object.values(catCounts),
        backgroundColor: ["#3b82f6", "#a855f7", "#06b6d4", "#f59e0b", "#22c55e", "#ef4444", "#ec4899"],
        borderRadius: 6,
        borderSkipped: false
      }]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          ticks: { color: "#94a3b8", stepSize: 1 },
          grid: { color: "rgba(51,65,85,0.5)" },
          beginAtZero: true
        },
        y: {
          ticks: { color: "#94a3b8", font: { size: 10 } },
          grid: { display: false }
        }
      }
    }
  });
}

function renderCards(filtered = null) {
  const list = filtered || activities;
  const container = document.getElementById("cards-container");

  if (!list.length) {
    container.innerHTML = `<div class="empty-state">Nenhuma atividade encontrada com os filtros aplicados.</div>`;
    return;
  }

  container.innerHTML = list.map(a => `
    <article class="activity-card" data-id="${a.id}">
      <div class="card-header">
        <div>
          <div class="card-title">${escapeHtml(a.tarefa)}</div>
          <div class="card-subtitle">${escapeHtml(a.subtarefa)}</div>
        </div>
        <span class="status-badge ${getStatusClass(a.status)}">${escapeHtml(a.status)}</span>
      </div>
      <div class="card-body">
        <div class="card-meta">
          <div class="meta-item">
            <span class="meta-label">Responsável</span>
            <span class="meta-value">${escapeHtml(a.responsavel)}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Tipo de Demanda</span>
            <span class="meta-value">${escapeHtml(a.tipoDemanda)}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Pendência de</span>
            <span class="meta-value">${escapeHtml(a.pendencia || "—")}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Previsão</span>
            <span class="meta-value">${escapeHtml(a.previsao || "Não definida")}</span>
          </div>
        </div>
        ${a.detalhes && a.detalhes.length ? `
          <ul class="detalhes-list">
            ${a.detalhes.map(d => `<li>${escapeHtml(d)}</li>`).join("")}
          </ul>
        ` : ""}
        ${a.obs ? `<p style="font-size:0.8rem;color:var(--text-muted);margin-top:0.5rem"><strong>Obs:</strong> ${escapeHtml(a.obs)}</p>` : ""}
      </div>
      <div class="card-footer">
        <span class="categoria-tag">${escapeHtml(a.categoria)}</span>
        <span style="font-size:0.75rem;color:var(--text-muted)">ID #${a.id}</span>
      </div>
    </article>
  `).join("");
}

function setupFilters() {
  const statusSel = document.getElementById("filter-status");
  const respSel = document.getElementById("filter-responsavel");
  const catSel = document.getElementById("filter-categoria");
  const searchInput = document.getElementById("filter-search");

  const responsaveis = [...new Set(activities.map(a => a.responsavel))].sort();
  const categorias = [...new Set(activities.map(a => a.categoria))].sort();

  respSel.innerHTML = `<option value="">Todos</option>` +
    responsaveis.map(r => `<option value="${escapeHtml(r)}">${escapeHtml(r)}</option>`).join("");

  catSel.innerHTML = `<option value="">Todas</option>` +
    categorias.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");

  const apply = () => {
    const st = statusSel.value;
    const rp = respSel.value;
    const ct = catSel.value;
    const q = searchInput.value.toLowerCase().trim();

    const filtered = activities.filter(a => {
      if (st && a.status !== st) return false;
      if (rp && a.responsavel !== rp) return false;
      if (ct && a.categoria !== ct) return false;
      if (q) {
        const text = `${a.tarefa} ${a.subtarefa} ${a.responsavel} ${a.categoria} ${(a.detalhes||[]).join(" ")}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
    renderCards(filtered);
  };

  statusSel.addEventListener("change", apply);
  respSel.addEventListener("change", apply);
  catSel.addEventListener("change", apply);
  searchInput.addEventListener("input", apply);

  document.getElementById("btn-clear-filters")?.addEventListener("click", () => {
    statusSel.value = "";
    respSel.value = "";
    catSel.value = "";
    searchInput.value = "";
    renderCards();
  });
}

function escapeHtml(str) {
  if (!str) return "";
  const amp = ["&", "a", "m", "p", ";"].join("");
  const lt = ["&", "l", "t", ";"].join("");
  const gt = ["&", "g", "t", ";"].join("");
  const quot = ["&", "q", "u", "o", "t", ";"].join("");
  return String(str)
    .replace(/&/g, amp)
    .replace(/</g, lt)
    .replace(/>/g, gt)
    .replace(/"/g, quot);
}

window.refreshDashboard = async function () {
  activities = await loadActivities();
  renderKPIs();
  renderCharts();
  renderCards();
  setupFilters();
};
