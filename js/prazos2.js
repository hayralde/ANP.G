document.addEventListener("DOMContentLoaded", async function () {
  window._list2 = await loadActivities2();
  render(window._list2);
});

var COLORS = {
  "Indicadores KPI": "#3b82f6",
  "Plano de Manutenção": "#f97316",
  "Matriz de Criticidade": "#14b8a6",
  "Cadastro de Equipamentos": "#eab308",
  "Tagueamento": "#ec4899",
  "Certificado de Calibração": "#22c55e",
  "POP": "#8b5cf6"
};

function color(area) { return COLORS[area] || "#64748b"; }
function stClass(s) {
  if (s === "PARADO") return "st-parado";
  if (s === "EM ANDAMENTO") return "st-andamento";
  if (s === "CONCLUIDO") return "st-concluido";
  return "st-definir";
}
function esc(s) {
  if (!s) return "";
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function parseDateBR(val) {
  if (!val) return null;
  var s = String(val).trim();
  if (!s || s.toLowerCase() === "a definir" || s.indexOf("xx") !== -1) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    var p = s.split("-");
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }
  var parts = s.split("/");
  if (parts.length === 3) return new Date(+parts[2], +parts[1] - 1, +parts[0]);
  return null;
}
function isOverdue(a) {
  if ((a.status || "").toUpperCase().indexOf("CONCL") !== -1) return false;
  var fim = parseDateBR(a.previsaoFim || a.previsao);
  if (!fim) return false;
  var t = new Date();
  t = new Date(t.getFullYear(), t.getMonth(), t.getDate());
  return fim < t;
}
function formatRange(a) {
  var ini = a.previsaoInicio || "";
  var fim = a.previsaoFim || a.previsao || "";
  if (ini && fim) return ini + " → " + fim;
  if (fim) return "até " + fim;
  if (ini) return "desde " + ini;
  return "A definir";
}

function render(list) {
  window._list2 = list;
  var late = 0, withDate = 0;
  list.forEach(function (a) {
    if (a.previsaoFim || a.previsao || a.previsaoInicio) withDate++;
    if (isOverdue(a)) late++;
  });
  document.getElementById("prazos-summary").textContent =
    withDate + " com período · " + late + " atrasada(s) · " + (list.length - withDate) + " sem data";

  var tb = document.getElementById("prazos-body");
  if (!list.length) {
    tb.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#64748b;padding:2rem">Nenhuma atividade</td></tr>';
    return;
  }
  tb.innerHTML = list.map(function (a) {
    var area = a.categoria || a.tarefa || "Geral";
    var range = formatRange(a);
    var late = isOverdue(a);
    return "<tr" + (late ? ' style="background:rgba(244,63,94,.08)"' : "") + ">" +
      '<td><div class="area-cell"><span class="area-dot" style="background:' + color(area) + '"></span>' + esc(area) + "</div></td>" +
      '<td><span class="ativ-main">' + esc(a.tarefa) + "</span>" +
        (a.subtarefa ? ' <span class="ativ-sub">— ' + esc(a.subtarefa) + "</span>" : "") + "</td>" +
      "<td>" + esc(a.responsavel || "A DEFINIR") + "</td>" +
      "<td>" + (late ? '<span style="color:#fb7185;font-weight:700">' + esc(range) + " · ATRASADO</span>" : esc(range)) + "</td>" +
      '<td><span class="status-pill ' + stClass(a.status) + '">' + esc(a.status || "A DEFINIR") + "</span></td>" +
      '<td><button type="button" class="btn-excluir-soft" data-id="' + a.id + '">Excluir</button></td>' +
      "</tr>";
  }).join("");
}

document.addEventListener("click", function (e) {
  var btn = e.target.closest(".btn-excluir-soft");
  if (!btn || !btn.dataset.id) return;
  var id = parseInt(btn.dataset.id, 10);
  var list = window._list2 || [];
  var a = list.find(function (x) { return x.id === id; });
  openAnpDelete(id, "Excluir #" + id + " — " + (a ? a.tarefa : "") + "?", async function (delId) {
    var next = list.filter(function (x) { return x.id !== delId; });
    window._list2 = await saveActivities2ToApi(next);
    render(window._list2);
  });
});
