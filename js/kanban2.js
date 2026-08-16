const STATUS_COLS = ["A DEFINIR", "PARADO", "EM ANDAMENTO", "ATRASADO", "CONCLUIDO"];
const BOARD_COLS = ["A DEFINIR", "PARADO", "EM ANDAMENTO", "ATRASADO", "CONCLUIDO"];
const BLOCKED_STATUSES = ["PARADO", "ATRASADO"];
let activities = [];
let dragId = null;

document.addEventListener("DOMContentLoaded", async function () {
  activities = await loadActivities2();
  fillFilters();
  render();
  bindFilters();
  bindBoardDnD();
  initKbEditModal();
  await autoFlagOverdue();
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
  if (u.indexOf("ATRAS") !== -1) return "ATRASADO";
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
  return normalizeStatus(a.status);
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
  var st = normalizeStatus(a.status);

  if (st === "CONCLUIDO") {
    return (
      '<article class="kb-card done" draggable="true" data-id="' + a.id + '">' +
        '<p class="kb-card-title">🏆 ' + esc(a.tarefa || "Sem título") + "</p>" +
        (a.subtarefa ? '<p class="kb-card-sub">' + esc(a.subtarefa) + "</p>" : "") +
        '<div class="kb-card-meta">' +
          '<span class="kb-chip">' + esc(a.responsavel || "A DEFINIR") + "</span>" +
        "</div>" +
        '<div class="kb-card-foot">' +
          '<span class="kb-card-id">#' + a.id + " · CONCLUÍDO</span>" +
          '<div class="kb-card-actions">' +
            '<button type="button" class="edit" data-id="' + a.id + '">Editar</button>' +
            '<button type="button" class="del" data-id="' + a.id + '">Excluir</button>' +
          "</div>" +
        "</div>" +
      "</article>"
    );
  }

  var pend = st !== "EM ANDAMENTO" && a.pendencia && a.pendencia !== "A DEFINIR" && a.pendencia !== "NENHUMA";
  var range = formatRange(a);
  var overdue = isOverdue(a);
  var showMotivo = BLOCKED_STATUSES.indexOf(st) !== -1;
  var showSubtasks = st === "EM ANDAMENTO" && a.detalhes && a.detalhes.length;
  return (
    '<article class="kb-card' + (overdue ? " overdue" : "") + '" draggable="true" data-id="' + a.id + '">' +
      '<p class="kb-card-title">' + esc(a.tarefa || "Sem título") + "</p>" +
      (a.subtarefa ? '<p class="kb-card-sub">' + esc(a.subtarefa) + "</p>" : "") +
      (showSubtasks ? '<ul class="kb-card-subtasks">' + a.detalhes.map(function (d) { return "<li>" + esc(d) + "</li>"; }).join("") + "</ul>" : "") +
      '<div class="kb-card-meta">' +
        (a.categoria ? '<span class="kb-chip area">' + esc(a.categoria) + "</span>" : "") +
        '<span class="kb-chip">' + esc(a.responsavel || "A DEFINIR") + "</span>" +
        (pend ? '<span class="kb-chip pend">Pend: ' + esc(a.pendencia) + "</span>" : "") +
        (range ? '<span class="kb-chip date' + (overdue ? " late" : "") + '">' + esc(range) + "</span>" : "") +
        (showMotivo ? '<span class="kb-chip motivo" data-motivo-id="' + a.id + '">🚩 Motivo: ' + esc(a.motivo || "clique para preencher") + "</span>" : "") +
      "</div>" +
      '<div class="kb-card-foot">' +
        '<span class="kb-card-id">#' + a.id + " · " + esc(st) + "</span>" +
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
      var eid = parseInt(ed.dataset.id, 10);
      var ea = activities.find(function (x) { return x.id === eid; });
      if (ea) openKbEdit(ea);
    }

    var mot = e.target.closest(".kb-chip.motivo");
    if (mot) {
      e.preventDefault();
      e.stopPropagation();
      var mid = parseInt(mot.dataset.motivoId, 10);
      var ma = activities.find(function (x) { return x.id === mid; });
      if (!ma) return;
      editMotivo(ma);
    }
  });
}

function editMotivo(a) {
  openAnpMotivo({
    title: "Motivo do bloqueio",
    label: "#" + a.id + " — " + (a.tarefa || ""),
    value: a.motivo || "",
    onConfirm: async function (val) {
      var i = activities.findIndex(function (x) { return x.id === a.id; });
      if (i < 0) return;
      var prev = activities[i].motivo;
      activities[i].motivo = val;
      try {
        activities = await saveActivities2ToApi(activities);
        setStatusMsg("Motivo atualizado #" + a.id, "ok");
        render();
      } catch (err) {
        activities[i].motivo = prev;
        setStatusMsg("Erro ao salvar motivo: " + err.message, "err");
        throw err;
      }
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
  var wasBlocked = BLOCKED_STATUSES.indexOf(normalizeStatus(activities[i].status)) !== -1;
  var willBeBlocked = BLOCKED_STATUSES.indexOf(newStatus) !== -1;
  var enteringBlocked = willBeBlocked && normalizeStatus(activities[i].status) !== newStatus;
  var leavingBlocked = wasBlocked && !willBeBlocked;

  if (enteringBlocked) {
    var a = activities[i];
    var label = newStatus === "ATRASADO"
      ? "está indo para Atrasado. Informe o motivo:"
      : "está indo para Parado. Informe o motivo:";
    openAnpMotivo({
      title: "Motivo do bloqueio",
      label: "#" + a.id + " — " + (a.tarefa || "") + " " + label,
      value: a.motivo || "",
      required: true,
      onConfirm: async function (val) {
        await applyMove(id, newStatus, targetCol, val, false);
      }
    });
    return;
  }

  await applyMove(id, newStatus, targetCol, activities[i].motivo || "", leavingBlocked ? true : activities[i].atrasoIgnorado);
}

async function applyMove(id, newStatus, targetCol, motivo, atrasoIgnorado) {
  var i = activities.findIndex(function (a) { return a.id === id; });
  if (i < 0) return;

  var prevStatus = activities[i].status;
  var prevMotivo = activities[i].motivo;
  var prevIgnorado = activities[i].atrasoIgnorado;
  activities[i].status = newStatus;
  activities[i].motivo = motivo || "";
  activities[i].atrasoIgnorado = !!atrasoIgnorado;
  render();
  setStatusMsg("Salvando…");
  try {
    activities = await saveActivities2ToApi(activities);
    setStatusMsg("Status: " + newStatus, "ok");
  } catch (err) {
    activities[i].status = prevStatus;
    activities[i].motivo = prevMotivo;
    activities[i].atrasoIgnorado = prevIgnorado;
    render();
    setStatusMsg("Erro ao salvar: " + err.message, "err");
    throw err;
  }
}

async function autoFlagOverdue() {
  var candidates = activities.filter(function (a) {
    var st = normalizeStatus(a.status);
    return st !== "CONCLUIDO" && st !== "ATRASADO" && isOverdue(a) && !a.atrasoIgnorado;
  });
  for (var idx = 0; idx < candidates.length; idx++) {
    await new Promise(function (resolve) {
      var a = candidates[idx];
      openAnpMotivo({
        title: "Atividade atrasada",
        label: "#" + a.id + " — " + (a.tarefa || "") + " passou do prazo e caiu em Atrasado. Informe o motivo:",
        value: a.motivo || "",
        onConfirm: async function (val) {
          await applyMove(a.id, "ATRASADO", "ATRASADO", val, false);
          resolve();
        },
        onCancel: function () {
          applyMove(a.id, "ATRASADO", "ATRASADO", a.motivo || "", false).then(resolve);
        }
      });
    });
  }
}

function fillKbSelect(id, list) {
  document.getElementById(id).innerHTML = list.map(function (v) {
    return '<option value="' + esc(v) + '">' + esc(v) + "</option>";
  }).join("");
}

function initKbEditModal() {
  fillKbSelect("kbe-responsavel", RESPONSAVEIS);
  fillKbSelect("kbe-pendencia", PENDENCIAS);
  fillKbSelect("kbe-tipo", TIPOS_DEMANDA);
  fillKbSelect("kbe-status", STATUS_OPTIONS);
  document.getElementById("kb-edit-close").addEventListener("click", closeKbEditModal);
  document.getElementById("kb-edit-cancel").addEventListener("click", closeKbEditModal);
  document.getElementById("kb-edit-backdrop").addEventListener("click", function (e) {
    if (e.target === this) closeKbEditModal();
  });
  document.getElementById("kbe-btn-add-item").addEventListener("click", function () { addKbItemRow(""); });
  document.getElementById("kb-edit-form").addEventListener("submit", onKbEditSave);
}

function kbToIso(val) {
  if (!val) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  var p = String(val).split("/");
  if (p.length === 3) return p[2] + "-" + p[1].padStart(2, "0") + "-" + p[0].padStart(2, "0");
  return "";
}
function kbFromIso(iso) {
  if (!iso) return "";
  var p = iso.split("-");
  return p[2] + "/" + p[1] + "/" + p[0];
}

function addKbItemRow(v) {
  var row = document.createElement("div");
  row.className = "item-row";
  row.innerHTML = '<input type="text" class="item-input" value="' + esc(v || "") + '" />' +
    '<button type="button">&times;</button>';
  row.querySelector("button").onclick = function () { row.remove(); };
  document.getElementById("kbe-itens-list").appendChild(row);
}

function collectKbItens() {
  var out = [];
  document.querySelectorAll("#kbe-itens-list .item-input").forEach(function (i) {
    var v = i.value.trim();
    if (v) out.push(v);
  });
  return out;
}

var _kbEditId = null;

function openKbEdit(a) {
  _kbEditId = a.id;
  document.getElementById("kb-edit-title").textContent = "Editar atividade #" + a.id;
  document.getElementById("kbe-id").value = a.id;
  document.getElementById("kbe-area").value = a.categoria || "";
  document.getElementById("kbe-tarefa").value = a.tarefa || "";
  document.getElementById("kbe-subtarefa").value = a.subtarefa || "";
  document.getElementById("kbe-responsavel").value = a.responsavel || "A DEFINIR";
  document.getElementById("kbe-pendencia").value = a.pendencia || "A DEFINIR";
  document.getElementById("kbe-tipo").value = a.tipoDemanda || "NOVO";
  document.getElementById("kbe-status").value = normalizeStatus(a.status);
  document.getElementById("kbe-previsao-inicio").value = kbToIso(a.previsaoInicio || "");
  document.getElementById("kbe-previsao-fim").value = kbToIso(a.previsaoFim || a.previsao || "");
  document.getElementById("kbe-motivo").value = a.motivo || "";
  document.getElementById("kbe-obs").value = a.obs || "";
  document.getElementById("kbe-itens-list").innerHTML = "";
  (a.detalhes || []).forEach(function (d) { addKbItemRow(d); });
  document.getElementById("kb-edit-backdrop").classList.add("open");
}

function closeKbEditModal() {
  document.getElementById("kb-edit-backdrop").classList.remove("open");
  _kbEditId = null;
}

async function onKbEditSave(e) {
  e.preventDefault();
  var btn = document.getElementById("kb-edit-save");
  btn.disabled = true;
  try {
    var id = parseInt(document.getElementById("kbe-id").value, 10);
    var i = activities.findIndex(function (a) { return a.id === id; });
    if (i < 0) return;

    var oldFim = activities[i].previsaoFim || activities[i].previsao || "";
    var newFim = kbFromIso(document.getElementById("kbe-previsao-fim").value);
    var newStatus = document.getElementById("kbe-status").value;

    var updated = Object.assign({}, activities[i], {
      tarefa: document.getElementById("kbe-tarefa").value.trim(),
      subtarefa: document.getElementById("kbe-subtarefa").value.trim(),
      categoria: document.getElementById("kbe-area").value.trim(),
      responsavel: document.getElementById("kbe-responsavel").value,
      pendencia: document.getElementById("kbe-pendencia").value,
      tipoDemanda: document.getElementById("kbe-tipo").value,
      status: newStatus,
      previsaoInicio: kbFromIso(document.getElementById("kbe-previsao-inicio").value),
      previsaoFim: newFim,
      previsao: newFim,
      motivo: document.getElementById("kbe-motivo").value.trim(),
      obs: document.getElementById("kbe-obs").value.trim(),
      detalhes: collectKbItens()
    });
    if (newFim !== oldFim) updated.atrasoIgnorado = false;

    var prev = activities[i];
    activities[i] = updated;
    try {
      activities = await saveActivities2ToApi(activities);
      setStatusMsg("Salvo #" + id, "ok");
      render();
      closeKbEditModal();
    } catch (err) {
      activities[i] = prev;
      setStatusMsg("Erro ao salvar: " + err.message, "err");
    }
  } finally {
    btn.disabled = false;
  }
}
