// ============================================
// ANP Monitor - Dashboard 5W2H
// ============================================

let activities = [];

document.addEventListener("DOMContentLoaded", async function () {
  activities = await loadActivities();
  setupFilters();
  render(activities);
});

function whyText(a) {
  var parts = [];
  if (a.tipoDemanda === "NOVO") {
    parts.push("Implantar novo requisito / processo no escopo ANP");
  } else if (a.tipoDemanda === "ADEQUAÇÃO") {
    parts.push("Adequar processo ou sistema existente às exigências ANP");
  }
  if (a.categoria) parts.push("Categoria: " + a.categoria);
  if (a.pendencia && a.pendencia !== "A DEFINIR") {
    parts.push("Pendência relacionada a: " + a.pendencia);
  }
  return parts.length ? parts.join(". ") : "Garantir conformidade e operacionalização do Plano de Ação ANP";
}

function whereText(a) {
  var t = ((a.tarefa || "") + " " + (a.subtarefa || "")).toUpperCase();
  var hints = [];
  if (t.indexOf("F1") !== -1 || t.indexOf("F2") !== -1) {
    if (t.indexOf("F1") !== -1) hints.push("Unidade / área F1");
    if (t.indexOf("F2") !== -1) hints.push("Unidade / área F2");
  }
  if (t.indexOf("ELÉTRICA") !== -1 || t.indexOf("ELETRICA") !== -1 || t.indexOf("INSTRUMENT") !== -1) {
    hints.push("Manutenção elétrica e instrumentação");
  }
  if (t.indexOf("MECÂNICA") !== -1 || t.indexOf("MECANICA") !== -1 || t.indexOf("LUBRI") !== -1 || t.indexOf("PREDITIVA") !== -1) {
    hints.push("Manutenção mecânica, lubrificação e preditiva");
  }
  if (t.indexOf("EX") !== -1) hints.push("Áreas classificadas (equipamentos EX)");
  if (t.indexOf("TAG") !== -1) hints.push("Campo / instalação de TAGs");
  if (t.indexOf("CALIBRA") !== -1 || t.indexOf("CERTIFICADO") !== -1) hints.push("Sistemas de calibração e documentação");
  if (t.indexOf("POP") !== -1) hints.push("Procedimentos operacionais (documentação)");
  if (t.indexOf("KPI") !== -1 || t.indexOf("INDICADOR") !== -1 || t.indexOf("PAINEL") !== -1) {
    hints.push("Painel de indicadores / gestão");
  }
  if (!hints.length) hints.push("Escopo geral do Plano de Ação ANP");
  return hints.join(" · ");
}

function howText(a) {
  if (a.detalhes && a.detalhes.length) {
    return a.detalhes;
  }
  return ["Executar a subtarefa \"" + (a.subtarefa || a.tarefa) + "\" conforme planejamento"];
}

function howMuchText(a) {
  var n = (a.detalhes && a.detalhes.length) ? a.detalhes.length : 1;
  var statusLine = "Status atual: " + (a.status || "A DEFINIR");
  var effort = n === 1
    ? "1 etapa principal mapeada"
    : n + " etapas / ações mapeadas";
  return effort + ". " + statusLine + ".";
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
  var container = document.getElementById("w2h-container");
  if (!list.length) {
    container.innerHTML = '<div class="w2h-empty">Nenhuma atividade encontrada com os filtros aplicados.</div>';
    return;
  }

  container.innerHTML = list.map(function (a) {
    var how = howText(a);
    var howHtml = Array.isArray(how)
      ? "<ul>" + how.map(function (h) { return "<li>" + escapeHtml(h) + "</li>"; }).join("") + "</ul>"
      : escapeHtml(how);

    return (
      '<article class="w2h-card">' +
        '<div class="w2h-card-head">' +
          "<div>" +
            "<h2>" + escapeHtml(a.tarefa) + "</h2>" +
            "<p>" + escapeHtml(a.subtarefa) + " · " + escapeHtml(a.categoria || "") + "</p>" +
          "</div>" +
          '<span class="status-badge ' + statusClass(a.status) + '">' + escapeHtml(a.status) + "</span>" +
        "</div>" +
        '<div class="w2h-body">' +
          item("what", "What", "O quê", escapeHtml(a.tarefa) + (a.subtarefa ? " — " + escapeHtml(a.subtarefa) : "")) +
          item("why", "Why", "Por quê", escapeHtml(whyText(a))) +
          item("where", "Where", "Onde", escapeHtml(whereText(a))) +
          item("when", "When", "Quando", escapeHtml(a.previsao || "Previsão ainda não definida")) +
          item("who", "Who", "Quem", escapeHtml(a.responsavel || "A DEFINIR") + (a.pendencia && a.pendencia !== "A DEFINIR" ? "<br><span style=\"font-size:0.75rem;color:var(--text-muted)\">Pendência: " + escapeHtml(a.pendencia) + "</span>" : "")) +
          item("how", "How", "Como", howHtml) +
          item("howmuch", "How much", "Quanto", escapeHtml(howMuchText(a))) +
        "</div>" +
      "</article>"
    );
  }).join("");
}

function item(cls, letter, label, valueHtml) {
  return (
    '<div class="w2h-item">' +
      '<div class="w2h-letter ' + cls + '">' + letter.charAt(0) + "</div>" +
      '<div class="w2h-label">' + label + " (" + letter + ")</div>" +
      '<div class="w2h-value">' + valueHtml + "</div>" +
    "</div>"
  );
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
