document.addEventListener("DOMContentLoaded", async function () {
  window._prazosList = await loadActivities();
  render(window._prazosList);
});

var AREA_COLORS = {
  "Indicadores": "#3b82f6", "Indicadores KPI": "#3b82f6",
  "Manutenção": "#f97316", "Plano de Manutenção": "#f97316",
  "Criticidade": "#14b8a6", "Matriz de Criticidade": "#14b8a6",
  "Cadastro": "#eab308", "Cadastro de Equipamentos": "#eab308",
  "Tagueamento": "#ec4899", "Calibração": "#22c55e",
  "Certificado de Calibração": "#22c55e", "Procedimentos": "#8b5cf6", "POP": "#8b5cf6"
};

function areaColor(area) {
  if (!area) return "#64748b";
  if (AREA_COLORS[area]) return AREA_COLORS[area];
  var keys = Object.keys(AREA_COLORS);
  for (var i = 0; i < keys.length; i++) {
    if (area.toLowerCase().indexOf(keys[i].toLowerCase()) !== -1) return AREA_COLORS[keys[i]];
  }
  var h = 0;
  for (var j = 0; j < area.length; j++) h = area.charCodeAt(j) + ((h << 5) - h);
  return "hsl(" + (Math.abs(h) % 360) + " 70% 55%)";
}
function areaLabel(a) {
  var c = a.categoria || "";
  var t = (a.tarefa || "").toUpperCase();
  if (c) return c;
  if (t.indexOf("KPI") !== -1 || t.indexOf("INDICADOR") !== -1) return "Indicadores KPI";
  if (t.indexOf("MANUTEN") !== -1) return "Plano de Manutenção";
  if (t.indexOf("CRITIC") !== -1) return "Matriz de Criticidade";
  if (t.indexOf("CADASTR") !== -1 || t.indexOf("EQUIPAMENT") !== -1) return "Cadastro de Equipamentos";
  if (t.indexOf("TAG") !== -1) return "Tagueamento";
  if (t.indexOf("CERTIFIC") !== -1 || t.indexOf("CALIBRA") !== -1) return "Certificado de Calibração";
  if (t.indexOf("POP") !== -1) return "POP";
  return a.tarefa || "Geral";
}
function statusClass(s) {
  if (s === "PARADO") return "st-parado";
  if (s === "EM ANDAMENTO") return "st-andamento";
  if (s === "CONCLUIDO") return "st-concluido";
  return "st-definir";
}
function escapeHtml(str) {
  if (!str) return "";
  var amp = ["&","a","m","p",";"].join("");
  var lt = ["&","l","t",";"].join("");
  var gt = ["&","g","t",";"].join("");
  var quot = ["&","q","u","o","t",";"].join("");
  return String(str).replace(/&/g, amp).replace(/</g, lt).replace(/>/g, gt).replace(/"/g, quot);
}
function hasPrazo(p) {
  if (!p) return false;
  var s = String(p).trim().toLowerCase();
  return !(!s || s === "a definir" || s.indexOf("xx") !== -1);
}

function render(list) {
  window._prazosList = list;
  var comPrazo = 0;
  list.forEach(function (a) { if (hasPrazo(a.previsao)) comPrazo++; });
  document.getElementById("prazos-summary").textContent =
    comPrazo + " com prazo definido · " + (list.length - comPrazo) + " a definir";
  var tbody = document.getElementById("prazos-body");
  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#64748b;padding:2rem">Nenhuma atividade</td></tr>';
    return;
  }
  tbody.innerHTML = list.map(function (a) {
    var area = areaLabel(a);
    var previsao = hasPrazo(a.previsao) ? a.previsao : "A definir";
    return "<tr>" +
      '<td><div class="area-cell"><span class="area-dot" style="background:' + areaColor(area) + '"></span>' + escapeHtml(area) + "</div></td>" +
      "<td><span class=\"ativ-main\">" + escapeHtml(a.tarefa || "") + "</span>" +
        (a.subtarefa ? ' <span class=\"ativ-sub\">— ' + escapeHtml(a.subtarefa) + "</span>" : "") + "</td>" +
      "<td>" + escapeHtml(a.responsavel || "A DEFINIR") + "</td>" +
      "<td>" + escapeHtml(previsao) + "</td>" +
      '<td><span class="status-pill ' + statusClass(a.status) + '">' + escapeHtml(a.status || "A DEFINIR") + "</span></td>" +
      '<td><button type="button" class="btn-excluir-soft" data-id="' + a.id + '">Excluir</button></td>' +
      "</tr>";
  }).join("");
}

document.addEventListener("click", function (e) {
  var btn = e.target.closest(".btn-excluir-soft");
  if (!btn || !btn.dataset.id) return;
  var id = parseInt(btn.dataset.id, 10);
  var list = window._prazosList || [];
  var a = list.find(function (x) { return x.id === id; });
  openAnpDelete(id, "Excluir #" + id + " — " + (a ? a.tarefa : "") + "?", async function (delId) {
    window._prazosList = await anpDeleteActivity(delId, list);
    render(window._prazosList);
  });
});
