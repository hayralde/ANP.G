const STATUS_COLS2 = ["A DEFINIR", "PARADO", "EM ANDAMENTO", "ATRASADO", "CONCLUIDO"];

let activities2 = [];
let chartStatus2 = null;
let chartResponsavel2 = null;
let chartCategoria2 = null;

document.addEventListener("DOMContentLoaded", async () => {
  activities2 = await loadActivities2();
  renderCharts2();
});

function boardStatus(a) {
  if (!a.status) return "A DEFINIR";
  const u = String(a.status).trim().toUpperCase();
  if (STATUS_COLS2.indexOf(u) !== -1) return u;
  if (u.indexOf("ANDAMENTO") !== -1) return "EM ANDAMENTO";
  if (u.indexOf("CONCL") !== -1) return "CONCLUIDO";
  if (u.indexOf("ATRAS") !== -1) return "ATRASADO";
  if (u.indexOf("PARAD") !== -1) return "PARADO";
  return "A DEFINIR";
}

function renderCharts2() {
  const statusCounts = { "A DEFINIR": 0, "PARADO": 0, "EM ANDAMENTO": 0, "ATRASADO": 0, "CONCLUIDO": 0 };
  activities2.forEach(a => { statusCounts[boardStatus(a)]++; });

  const ctxStatus = document.getElementById("chart-status2");
  if (chartStatus2) chartStatus2.destroy();
  chartStatus2 = new Chart(ctxStatus, {
    type: "doughnut",
    data: {
      labels: Object.keys(statusCounts),
      datasets: [{
        data: Object.values(statusCounts),
        backgroundColor: ["#64748b", "#ef4444", "#f59e0b", "#fb7185", "#22c55e"],
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
  activities2.forEach(a => {
    respCounts[a.responsavel || "A DEFINIR"] = (respCounts[a.responsavel || "A DEFINIR"] || 0) + 1;
  });

  const ctxResp = document.getElementById("chart-responsavel2");
  if (chartResponsavel2) chartResponsavel2.destroy();
  chartResponsavel2 = new Chart(ctxResp, {
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
  activities2.forEach(a => {
    const cat = a.categoria || "Sem categoria";
    catCounts[cat] = (catCounts[cat] || 0) + 1;
  });

  const ctxCat = document.getElementById("chart-categoria2");
  if (chartCategoria2) chartCategoria2.destroy();
  chartCategoria2 = new Chart(ctxCat, {
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
