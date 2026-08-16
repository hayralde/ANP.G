let activities = [];

document.addEventListener("DOMContentLoaded", async function () {
  activities = await loadActivities();
  setupFilters();
  render(activities);
});

function whyText(a) {
  var parts = [];
  if (a.tipoDemanda === "NOVO") parts.push("Implantar novo requisito no escopo ANP");
  else if (a.tipoDemanda === "ADEQUAÇÃO") parts.push("Adequar processo/sistema às exigências ANP");
  if (a.categoria) parts.push("Categoria: " + a.categoria);
  if (a.pendencia && a.pendencia !== "A DEFINIR") parts.push("Pendência: " + a.pendencia);
  return parts.length ? parts.join(". ") : "Conformidade do Plano de Ação ANP";
}

function whereText(a) {
  var t = ((a.tarefa || "") + " " + (a.subtarefa || "")).toUpperCase();
  var hints = [];
  if (t.indexOf("F1") !== -1) hints.push("Área F1");
  if (t.indexOf("F2") !== -1) hints.push("Área F2");
  if (t.indexOf("ELÉTRICA") !== -1 || t.indexOf("ELETRICA") !== -1 || t.indexOf("INSTRUMENT") !== -1)
    hints.push("Elétrica / Instrumentação");
  if (t.indexOf("MECÂNICA") !== -1 || t.indexOf("MECANICA") !== -1 || t.indexOf("LUBRI") !== -1 || t.indexOf("PREDITIVA") !== -1)
    hints.push("Mecânica / Lubrificação / Preditiva");
  if (t.indexOf("EX") !== -1) hints.push("Áreas classificadas (EX)");
  if (t.indexOf("TAG") !== -1) hints.push("Campo / TAGs");
  if (t.indexOf("CERTIFICADO") !== -1 || t.indexOf("CALIBRA") !== -1) hints.push("Calibração / documentação");
  if (t.indexOf("POP") !== -1) hints.push("Procedimentos (POPs)");
  if (t.indexOf("KPI") !== -1 || t.indexOf("INDICADOR") !== -1 || t.indexOf("PAINEL") !== -1)
    hints.push("Painel de indicadores");
  if (!hints.length) hints.push("Escopo geral ANP");
  return hints.join(" · ");
}

function howList(a) {
  if (a.detalhes && a.detalhes.length) return a.detalhes;
  return ["Executar: " + (a.subtarefa || a.tarefa)];
}

function howMuchText(a) {
  var n = (a.detalhes && a.detalhes.length) ? a.detalhes.length : 1;
  return n + (n === 1 ? " etapa" : " etapas") + " · Status: " + (a.status || "A DEFINIR");
}

function escapeHtml(str) {
  if (!str) return "";
  var amp = ["&", "a", "m", "p", ";"].join("");
  var lt = ["&", "l", "t", ";"].join("");
  var gt = ["&", "g", "t", ";"].join("");
  var quot = ["&", "q", "u", "o", "t", ";"].join("");
  return String(str)
    .replace(/&/g, amp)
    .replace(/</g, lt)
    .replace(/>/g, gt)
    .replace(/"/g, quot);
}

function statusClass(status) {
  var map = {
    "A DEFINIR": "a-definir",
    "PARADO": "parado",
    "EM ANDAMENTO": "em-andamento",
    "CONCLUIDO": "concluido"
  };
  return map[status] || "a-definir";
}

function render(list) {
  var tbody = document.getElementById("w2h-list-body");
  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:2rem;color:var(--text-muted)">Nenhuma atividade encontrada.</td></tr>';
    return;
  }

  tbody.innerHTML = list.map(function (a) {
    var how = howList(a);
    var howHtml = "<ul>" + how.map(function (h) {
      return "<li>" + escapeHtml(h) + "</li>";
    }).join("") + "</ul>";

    var what = escapeHtml(a.tarefa) +
      (a.subtarefa ? "<br><span style=\"color:var(--text-secondary);font-size:0.78rem\">" + escapeHtml(a.subtarefa) + "</span>" : "");

    return (
      "<tr>" +
        '<td class="col-id">#' + a.id + "</td>" +
        '<td><span class="status-badge ' + statusClass(a.status) + '">' + escapeHtml(a.status) + "</span></td>" +
        "<td>" + what + "</td>" +
        "<td>" + escapeHtml(whyText(a)) + "</td>" +
        "<td>" + escapeHtml(whereText(a)) + "</td>" +
        "<td>" + escapeHtml(a.previsao || "Não definida") + "</td>" +
        "<td>" + escapeHtml(a.responsavel || "A DEFINIR") +
          (a.pendencia && a.pendencia !== "A DEFINIR"
            ? "<br><span style=\"font-size:0.75rem;color:var(--text-muted)\">Pend.: " + escapeHtml(a.pendencia) + "</span>"
            : "") +
        "</td>" +
        "<td>" + howHtml + "</td>" +
        "<td>" + escapeHtml(howMuchText(a)) + "</td>" +
      "</tr>"
    );
  }).join("");
}

function setupFilters() {
  var statusSel = document.getElementById("filter-status");
  var respSel = document.getElementById("filter-responsavel");
  var searchInput = document.getElementById("filter-search");

  var responsaveis = [];
  activities.forEach(function (a) {
    if (responsaveis.indexOf(a.responsavel) === -1) responsaveis.push(a.responsavel);
  });
  responsaveis.sort();
  respSel.innerHTML = '<option value="">Todos</option>' +
    responsaveis.map(function (r) {
      return '<option value="' + escapeHtml(r) + '">' + escapeHtml(r) + "</option>";
    }).join("");

  function apply() {
    var st = statusSel.value;
    var rp = respSel.value;
    var q = searchInput.value.toLowerCase().trim();
    var filtered = activities.filter(function (a) {
      if (st && a.status !== st) return false;
      if (rp && a.responsavel !== rp) return false;
      if (q) {
        var text = (a.tarefa + " " + a.subtarefa + " " + a.responsavel + " " + a.categoria).toLowerCase();
        if (text.indexOf(q) === -1) return false;
      }
      return true;
    });
    render(filtered);
  }

  statusSel.addEventListener("change", apply);
  respSel.addEventListener("change", apply);
  searchInput.addEventListener("input", apply);
  document.getElementById("btn-clear").addEventListener("click", function () {
    statusSel.value = "";
    respSel.value = "";
    searchInput.value = "";
    render(activities);
  });
}
