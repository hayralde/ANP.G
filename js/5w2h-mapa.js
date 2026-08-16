let activities = [];

document.addEventListener("DOMContentLoaded", async function () {
  activities = await loadActivities();
  renderAll();
});

function whyText(a) {
  if (a.tipoDemanda === "NOVO") return "Implantar novo requisito ANP";
  if (a.tipoDemanda === "ADEQUAÇÃO") return "Adequar às exigências ANP";
  return a.obs || "Conformidade ANP";
}
function whereText(a) {
  if (a.categoria) return a.categoria;
  var t = ((a.tarefa || "") + " " + (a.subtarefa || "")).toUpperCase();
  if (t.indexOf("F1") !== -1 || t.indexOf("F2") !== -1) return "Áreas F1/F2";
  return "Escopo ANP";
}
function howText(a) {
  if (a.detalhes && a.detalhes.length) return a.detalhes.slice(0, 2).join("; ");
  return a.subtarefa || a.tarefa || "—";
}
function howMuchText(a) {
  var n = (a.detalhes && a.detalhes.length) ? a.detalhes.length : 1;
  return n + " etapa(s) · " + (a.status || "A DEFINIR");
}
function escapeHtml(str) {
  if (!str) return "";
  var amp = ["&","a","m","p",";"].join("");
  var lt = ["&","l","t",";"].join("");
  var gt = ["&","g","t",";"].join("");
  var quot = ["&","q","u","o","t",";"].join("");
  return String(str).replace(/&/g, amp).replace(/</g, lt).replace(/>/g, gt).replace(/"/g, quot);
}

function renderAll() {
  var grid = document.getElementById("mapa-grid");
  if (!activities.length) {
    grid.innerHTML = '<p style="color:var(--text-muted)">Nenhuma atividade</p>';
    return;
  }
  grid.innerHTML = activities.map(function (a) {
    return (
      '<article class="mini-card" data-id="' + a.id + '">' +
        '<div class="mini-card-top">' +
          "<div><h3>" + escapeHtml(a.tarefa || "") + "</h3>" +
          "<p>" + escapeHtml(a.subtarefa || "") + "</p></div>" +
          '<div class="mini-center">#' + a.id + "</div>" +
        "</div>" +
        '<div class="mini-cells">' +
          '<div class="mini-cell mc-what"><strong>O quê</strong><span>' + escapeHtml((a.tarefa || "") + (a.subtarefa ? " — " + a.subtarefa : "")) + "</span></div>" +
          '<div class="mini-cell mc-where"><strong>Onde</strong><span>' + escapeHtml(whereText(a)) + "</span></div>" +
          '<div class="mini-cell mc-why"><strong>Por que</strong><span>' + escapeHtml(whyText(a)) + "</span></div>" +
          '<div class="mini-cell mc-when"><strong>Quando</strong><span>' + escapeHtml(a.previsao || "Não definida") + "</span></div>" +
          '<div class="mini-cell mc-who"><strong>Quem</strong><span>' + escapeHtml(a.responsavel || "A DEFINIR") + "</span></div>" +
          '<div class="mini-cell mc-how"><strong>Como</strong><span>' + escapeHtml(howText(a)) + "</span></div>" +
          '<div class="mini-cell mc-howmuch"><strong>Quanto</strong><span>' + escapeHtml(howMuchText(a)) + "</span></div>" +
        "</div>" +
        '<div class="mini-actions">' +
          '<button type="button" class="btn-excluir-soft" data-id="' + a.id + '">Excluir</button>' +
        "</div>" +
      "</article>"
    );
  }).join("");
}

document.addEventListener("click", function (e) {
  var btn = e.target.closest(".btn-excluir-soft");
  if (!btn || !btn.dataset.id) return;
  var id = parseInt(btn.dataset.id, 10);
  var a = activities.find(function (x) { return x.id === id; });
  openAnpDelete(id, "Excluir #" + id + " — " + (a ? a.tarefa : "") + "?", async function (delId) {
    activities = await anpDeleteActivity(delId, activities);
    renderAll();
  });
});
