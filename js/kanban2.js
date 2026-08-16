const STATUS_COLS = ["A DEFINIR", "PARADO", "EM ANDAMENTO", "CONCLUIDO"];
const BOARD_COLS = ["A DEFINIR", "PARADO", "EM ANDAMENTO", "ATRASADO", "CONCLUIDO"];
let activities = [];
let dragId = null;

document.addEventListener("DOMContentLoaded", async function () {
  activities = await loadActivities2();
  fillFilters();
  render();
  bindFilters();
  bindBoardDnD();
});

function setStatusMsg(msg, kind) {
  var el = document.getElementById("kb-status");
  if (!el) return;
  el.textContent = msg || "";
  el.className = "kb-status" + (kind ? " " + kind : "");
}

function esc(s) {
  if (!s) return "";
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function unique(list, keyFn) {
  var seen = {};
  var out = [];
  list.forEach(function (a) {
    var k = keyFn(a);
    if (!k || seen[k]) return;
    seen[k] = true;
    out.push(k);
  });
  return out.sort();
}

function fillFilters() {
  fillSelect("f-pendencia", unique(activities, function (a) { return a.pendencia; }), "Todas");
  fillSelect("f-responsavel", unique(activities, function (a) { return a.responsavel; }), "Todos");
  fillSelect("f-area", unique(activities, function (a) { return a.categoria; }), "Todas");
}

function fillSelect(id, values, allLabel) {
  var sel = document.getElementById(id);
  if (!sel) return;
  var cur = sel.value;
  sel.innerHTML = '<option value="">' + allLabel + "</option>" +
    values.map(function (v) {
      return '<option value="' + esc(v) + '">' + esc(v) + "</option>";
    }).join("");
  if (cur) sel.value = cur;
}

function filtered() {
  var pend = document.getElementById("f-pendencia").value;
  var resp = document.getElementById("f-responsavel").value;
  var area = document.getElementById("f-area").value;
  var q = (document.getElementById("f-search").value || "").trim().toLowerCase();
  return activities.filter(function (a) {
    if (pend && a.pendencia !== pend) return false;
    if (resp && a.responsavel !== resp) return false;
    if (area && a.categoria !== area) return false;
    if (q) {
      var t = ((a.tarefa || "") + " " + (a.subtarefa || "") + " " + (a.obs || "")).toLowerCase();
      if (t.indexOf(q) === -1) return false;
    }
    return true;
  });
}

function normalizeStatus(s) {
  if (!s) return "A DEFINIR";
  var u = String(s).trim().toUpperCase();
  if (STATUS_COLS.indexOf(u) !== -1) return u;
  if (u.indexOf("ANDAMENTO") !== -1) return "EM ANDAMENTO";
  if (u.indexOf("CONCL") !== -1) return "CONCLUIDO";
  if (u.indexOf("PARAD") !== -1) return "PARADO";
  return "A DEFINIR";
}

function parseDateBR(val) {
  if (!val) return null;
  var s = String(val).trim();
  if (!s || s.toLowerCase() === "a definir" || s.indexOf("xx") !== -1) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    var p = s.split("-");
    return new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
  }
  var parts = s.split("/");
  if (parts.length === 3) {
    return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
  }
  return null;
}

function todayStart() {
  var d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isOverdue(a) {
  if (normalizeStatus(a.status) === "CONCLUIDO") return false;
  var fim = parseDateBR(a.previsaoFim || a.previsao);
  if (!fim) return false;
  return fim < todayStart();
}

function boardColumn(a) {
  var st = normalizeStatus(a.status);
  if (st === "CONCLUIDO") return "CONCLUIDO";
  if (isOverdue(a)) return "ATRASADO";
  return st;
}

function formatRange(a) {
  var ini = a.previsaoInicio || "";
  var fim = a.previsaoFim || a.previsao || "";
  if (ini && fim) return ini + " → " + fim;
  if (fim) return "até " + fim;
  if (ini) return "desde " + ini;
  return "";
}

function render() {
  var list = filtered();
  var counts = { "A DEFINIR": 0, "PARADO": 0, "EM ANDAMENTO": 0, "ATRASADO": 0, "CONCLUIDO": 0 };
  list.forEach(function (a) {
    var col = boardColumn(a);
    counts[col] = (counts[col] || 0) + 1;
  });

  document.getElementById("kpi-definir").textContent = counts["A DEFINIR"];
  document.getElementById("kpi-parado").textContent = counts["PARADO"];
  document.getElementById("kpi-andamento").textContent = counts["EM ANDAMENTO"];
  document.getElementById("kpi-atrasado").textContent = counts["ATRASADO"];
  document.getElementById("kpi-concluido").textContent = counts["CONCLUIDO"];
  document.getElementById("kpi-total").textContent = list.length;

  BOARD_COLS.forEach(function (status) {
    var col = document.querySelector('.kb-col[data-status="' + status + '"]');
    if (!col) return;
    col.querySelector("[data-count]").textContent = counts[status] || 0;
    var body = col.querySelector("[data-drop]");
    var items = list.filter(function (a) { return boardColumn(a) === status; });
    if (!items.length) {
      body.innerHTML = '<div class="kb-empty">Nenhum card</div>';
      return;
    }
    body.innerHTML = items.map(cardHtml).join("");
  });

  bindCardDnD();
}

function cardHtml(a) {
  var pend = a.pendencia && a.pendencia !== "A DEFINIR" && a.pendencia !== "NENHUMA";
  var range = formatRange(a);
  var overdue = isOverdue(a);
  return (
    '<article class="kb-card' + (overdue ? " overdue" : "") + '" draggable="true" data-id="' + a.id + '">' +
      '<p class="kb-card-title">' + esc(a.tarefa || "Sem título") + "</p>" +
      (a.subtarefa ? '<p class="kb-card-sub">' + esc(a.subtarefa) + "</p>" : "") +
      '<div class="kb-card-meta">' +
        (a.categoria ? '<span class="kb-chip area">' + esc(a.categoria) + "</span>" : "") +
        '<span class="kb-chip">' + esc(a.responsavel || "A DEFINIR") + "</span>" +
        (pend ? '<span class="kb-chip pend">Pend: ' + esc(a.pendencia) + "</span>" : "") +
        (range ? '<span class="kb-chip date' + (overdue ? " late" : "") + '">' + esc(range) + "</span>" : "") +
      "</div>" +
      '<div class="kb-card-foot">' +
        '<span class="kb-card-id">#' + a.id + " · " + esc(normalizeStatus(a.status)) + "</span>" +
        '<div class="kb-card-actions">' +
          '<button type="button" class="edit" data-id="' + a.id + '">Editar</button>' +
          '<button type="button" class="del" data-id="' + a.id + '">Excluir</button>' +
        "</div>" +
      "</div>" +
    "</article>"
  );
}

function bindFilters() {
  ["f-pendencia", "f-responsavel", "f-area"].forEach(function (id) {
    document.getElementById(id).addEventListener("change", render);
  });
  document.getElementById("f-search").addEventListener("input", function () {
    clearTimeout(window._kbSearchT);
    window._kbSearchT = setTimeout(render, 200);
  });
  document.getElementById("btn-clear").addEventListener("click", function () {
    document.getElementById("f-pendencia").value = "";
    document.getElementById("f-responsavel").value = "";
    document.getElementById("f-area").value = "";
    document.getElementById("f-search").value = "";
    render();
  });

  document.addEventListener("click", function (e) {
    var del = e.target.closest(".kb-card-actions .del");
    if (del) {
      e.preventDefault();
      e.stopPropagation();
      var id = parseInt(del.dataset.id, 10);
      var a = activities.find(function (x) { return x.id === id; });
      openAnpDelete(id, "Excluir #" + id + " — " + (a ? a.tarefa : "") + "?", async function (delId) {
        activities = activities.filter(function (x) { return x.id !== delId; });
        try {
          activities = await saveActivities2ToApi(activities);
          setStatusMsg("Excluída #" + delId, "ok");
        } catch (err) {
          setStatusMsg("Erro ao excluir: " + err.message, "err");
        }
        fillFilters();
        render();
      });
      return;
    }
    var ed = e.target.closest(".kb-card-actions .edit");
    if (ed) {
      e.preventDefault();
      location.href = "admin2.html";
    }
  });
}

function bindCardDnD() {
  document.querySelectorAll(".kb-card").forEach(function (card) {
    card.addEventListener("dragstart", function (e) {
      dragId = parseInt(card.dataset.id, 10);
      card.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(dragId));
    });
    card.addEventListener("dragend", function () {
      card.classList.remove("dragging");
      dragId = null;
      document.querySelectorAll(".kb-col-body").forEach(function (b) {
        b.classList.remove("drag-over");
      });
    });
  });
}

function bindBoardDnD() {
  document.querySelectorAll("[data-drop]").forEach(function (body) {
    body.addEventListener("dragover", function (e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      body.classList.add("drag-over");
    });
    body.addEventListener("dragleave", function () {
      body.classList.remove("drag-over");
    });
    body.addEventListener("drop", async function (e) {
      e.preventDefault();
      body.classList.remove("drag-over");
      var id = dragId || parseInt(e.dataTransfer.getData("text/plain"), 10);
      if (!id) return;
      var col = body.closest(".kb-col");
      var target = col && col.dataset.status;
      if (!target) return;
      await moveCard(id, target);
    });
  });
}

async function moveCard(id, targetCol) {
  var i = activities.findIndex(function (a) { return a.id === id; });
  if (i < 0) return;

  var newStatus = targetCol;
  if (targetCol === "ATRASADO") {
    newStatus = "PARADO";
  }

  var prev = activities[i].status;
  activities[i].status = newStatus;
  render();
  setStatusMsg("Salvando…");
  try {
    activities = await saveActivities2ToApi(activities);
    setStatusMsg("Status: " + newStatus + (targetCol === "ATRASADO" ? " (Atrasado = prazo vencido)" : ""), "ok");
  } catch (err) {
    activities[i].status = prev;
    render();
    setStatusMsg("Erro ao salvar: " + err.message, "err");
  }
}
