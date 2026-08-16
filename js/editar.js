let activities = [];
let editingId = null;
let mode = "edit";
const ADMIN_PASS = "admin123";

document.addEventListener("DOMContentLoaded", async function () {
  fillSelects();
  activities = await loadActivities();
  setStatus("Clique em um card para editar, ou adicione uma nova tarefa");
  renderCards();

  document.getElementById("modal-close").addEventListener("click", closeModal);
  document.getElementById("btn-cancel").addEventListener("click", closeModal);
  document.getElementById("modal-backdrop").addEventListener("click", function (e) {
    if (e.target === this) closeModal();
  });
  document.getElementById("btn-add-item").addEventListener("click", function () { addItemRow(""); });
  document.getElementById("edit-form").addEventListener("submit", onSave);
  document.getElementById("btn-nova").addEventListener("click", openCreateModal);
  document.getElementById("btn-confirm-delete").addEventListener("click", confirmDelete);
  document.getElementById("btn-cancel-delete").addEventListener("click", closeDeleteModal);
  var dx = document.getElementById("btn-cancel-delete-x");
  if (dx) dx.addEventListener("click", closeDeleteModal);
  document.getElementById("delete-backdrop").addEventListener("click", function (e) {
    if (e.target === this) closeDeleteModal();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { closeModal(); closeDeleteModal(); }
  });
});

function fillSelects() {
  fillOptions("f-responsavel", RESPONSAVEIS);
  fillOptions("f-pendencia", PENDENCIAS);
  fillOptions("f-tipo", TIPOS_DEMANDA);
  fillOptions("f-status", STATUS_OPTIONS);
}

function fillOptions(id, list) {
  document.getElementById(id).innerHTML = list.map(function (v) {
    return '<option value="' + escapeHtml(v) + '">' + escapeHtml(v) + "</option>";
  }).join("");
}

function fillAreaSelect(current) {
  var areas = [];
  activities.forEach(function (a) {
    var key = a.categoria || a.tarefa;
    if (key && areas.indexOf(key) === -1) areas.push(key);
  });
  ["Indicadores", "Manutenção", "Criticidade", "Cadastro", "Tagueamento", "Calibração", "Procedimentos"].forEach(function (d) {
    if (areas.indexOf(d) === -1) areas.push(d);
  });
  if (current && areas.indexOf(current) === -1) areas.unshift(current);
  var el = document.getElementById("f-area");
  el.innerHTML = areas.map(function (v) {
    return '<option value="' + escapeHtml(v) + '">' + escapeHtml(v) + "</option>";
  }).join("");
  if (current) el.value = current;
}

function setStatus(msg, kind) {
  var el = document.getElementById("edit-status-bar");
  el.textContent = msg;
  el.className = kind || "";
}

function statusClass(s) {
  return ({ "A DEFINIR": "a-definir", "PARADO": "parado", "EM ANDAMENTO": "em-andamento", "CONCLUIDO": "concluido" })[s] || "a-definir";
}

function renderCards() {
  var grid = document.getElementById("edit-grid");
  if (!activities.length) {
    grid.innerHTML = '<p style="color:var(--text-muted)">Nenhuma atividade. Clique em Nova tarefa.</p>';
    return;
  }
  grid.innerHTML = activities.map(function (a) {
    return '<article class="edit-card" data-id="' + a.id + '">' +
      '<div class="edit-card-top"><div><h3>' + escapeHtml(a.tarefa) + '</h3><p>' + escapeHtml(a.subtarefa || '') + '</p></div>' +
      '<button type="button" class="btn-delete-card" data-id="' + a.id + '" title="Excluir">✕</button></div>' +
      '<div class="edit-card-meta"><span class="status-badge ' + statusClass(a.status) + '">' + escapeHtml(a.status) + '</span>' +
      '<span style="font-size:0.75rem;color:var(--text-muted)">' + escapeHtml(a.responsavel || '') + '</span>' +
      '<span style="font-size:0.75rem;color:var(--text-muted)">#' + a.id + '</span></div></article>';
  }).join("");

  grid.querySelectorAll(".edit-card").forEach(function (card) {
    card.addEventListener("click", function (e) {
      if (e.target.closest(".btn-delete-card")) return;
      openModal(parseInt(card.dataset.id, 10));
    });
  });
  grid.querySelectorAll(".btn-delete-card").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      openDeleteModal(parseInt(btn.dataset.id, 10));
    });
  });
}

function openCreateModal() {
  mode = "create";
  editingId = null;
  document.getElementById("modal-title").textContent = "Nova atividade";
  document.getElementById("btn-save-modal").textContent = "Criar atividade";
  fillAreaSelect("Manutenção");
  document.getElementById("f-id").value = "";
  document.getElementById("f-tarefa").value = "";
  document.getElementById("f-subtarefa").value = "";
  document.getElementById("f-responsavel").value = "A DEFINIR";
  document.getElementById("f-pendencia").value = "A DEFINIR";
  document.getElementById("f-tipo").value = "NOVO";
  document.getElementById("f-status").value = "A DEFINIR";
  document.getElementById("f-previsao").value = "";
  document.getElementById("f-obs").value = "";
  document.getElementById("itens-list").innerHTML = "";
  document.getElementById("modal-backdrop").classList.add("open");
  document.getElementById("f-tarefa").focus();
}

function openModal(id) {
  var a = activities.find(function (x) { return x.id === id; });
  if (!a) return;
  mode = "edit";
  editingId = id;
  document.getElementById("modal-title").textContent = "Editar atividade";
  document.getElementById("btn-save-modal").textContent = "Salvar atividade";
  fillAreaSelect(a.categoria || a.tarefa);
  document.getElementById("f-id").value = a.id;
  document.getElementById("f-area").value = a.categoria || a.tarefa;
  document.getElementById("f-tarefa").value = a.tarefa || "";
  document.getElementById("f-subtarefa").value = a.subtarefa || "";
  document.getElementById("f-responsavel").value = a.responsavel || "A DEFINIR";
  document.getElementById("f-pendencia").value = a.pendencia || "A DEFINIR";
  document.getElementById("f-tipo").value = a.tipoDemanda || "NOVO";
  document.getElementById("f-status").value = a.status || "A DEFINIR";
  document.getElementById("f-previsao").value = toInputDate(a.previsao);
  document.getElementById("f-obs").value = a.obs || "";
  document.getElementById("itens-list").innerHTML = "";
  (a.detalhes || []).forEach(function (d) { addItemRow(d); });
  document.getElementById("modal-backdrop").classList.add("open");
  document.getElementById("f-tarefa").focus();
}

function closeModal() {
  document.getElementById("modal-backdrop").classList.remove("open");
  editingId = null;
}

function addItemRow(value) {
  var row = document.createElement("div");
  row.className = "item-row";
  row.innerHTML = '<input type="text" class="item-input" value="' + escapeHtml(value || "") + '" placeholder="Descreva o item..." />' +
    '<button type="button" title="Remover">&times;</button>';
  row.querySelector("button").addEventListener("click", function () { row.remove(); });
  document.getElementById("itens-list").appendChild(row);
}

function collectItens() {
  var out = [];
  document.querySelectorAll("#itens-list .item-input").forEach(function (inp) {
    var v = inp.value.trim();
    if (v) out.push(v);
  });
  return out;
}

function toInputDate(val) {
  if (!val) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  var p = String(val).split("/");
  if (p.length === 3) return p[2] + "-" + p[1].padStart(2, "0") + "-" + p[0].padStart(2, "0");
  return "";
}

function fromInputDate(iso) {
  if (!iso) return "";
  var p = iso.split("-");
  return p[2] + "/" + p[1] + "/" + p[0];
}

function nextId() {
  var max = 0;
  activities.forEach(function (a) { if (a.id > max) max = a.id; });
  return max + 1;
}

function formToActivity(id) {
  return {
    id: id,
    tarefa: document.getElementById("f-tarefa").value.trim(),
    subtarefa: document.getElementById("f-subtarefa").value.trim(),
    categoria: document.getElementById("f-area").value,
    responsavel: document.getElementById("f-responsavel").value,
    pendencia: document.getElementById("f-pendencia").value,
    tipoDemanda: document.getElementById("f-tipo").value,
    status: document.getElementById("f-status").value,
    previsao: fromInputDate(document.getElementById("f-previsao").value),
    obs: document.getElementById("f-obs").value.trim(),
    detalhes: collectItens()
  };
}

async function onSave(e) {
  e.preventDefault();
  var btn = document.getElementById("btn-save-modal");
  btn.disabled = true;
  var original = btn.textContent;
  btn.textContent = "Salvando...";
  setStatus("Salvando no banco...");
  try {
    if (mode === "create") {
      activities.push(formToActivity(nextId()));
    } else {
      var id = parseInt(document.getElementById("f-id").value, 10);
      var idx = activities.findIndex(function (a) { return a.id === id; });
      if (idx < 0) throw new Error("Atividade não encontrada");
      activities[idx] = formToActivity(id);
    }
    activities = await saveActivitiesToApi(activities);
    setStatus(mode === "create" ? "Nova atividade criada" : "Atividade salva", "ok");
    renderCards();
    closeModal();
  } catch (err) {
    console.error(err);
    setStatus("Erro: " + err.message, "err");
  } finally {
    btn.disabled = false;
    btn.textContent = original;
  }
}

var deleteTargetId = null;

function openDeleteModal(id) {
  var a = activities.find(function (x) { return x.id === id; });
  if (!a) return;
  deleteTargetId = id;
  document.getElementById("delete-label").textContent =
    "Excluir #" + id + " — " + (a.tarefa || "") + (a.subtarefa ? " / " + a.subtarefa : "") + "?";
  document.getElementById("delete-pass").value = "";
  document.getElementById("delete-error").textContent = "";
  document.getElementById("delete-backdrop").classList.add("open");
  document.getElementById("delete-pass").focus();
}

function closeDeleteModal() {
  document.getElementById("delete-backdrop").classList.remove("open");
  deleteTargetId = null;
}

async function confirmDelete() {
  var pass = document.getElementById("delete-pass").value;
  var err = document.getElementById("delete-error");
  if (pass !== ADMIN_PASS) {
    err.textContent = "Senha de administrador incorreta.";
    return;
  }
  if (deleteTargetId == null) return;
  var id = deleteTargetId;
  var btn = document.getElementById("btn-confirm-delete");
  btn.disabled = true;
  setStatus("Excluindo...");
  try {
    activities = activities.filter(function (a) { return a.id !== id; });
    activities = await saveActivitiesToApi(activities);
    setStatus("Atividade #" + id + " excluída", "ok");
    renderCards();
    closeDeleteModal();
  } catch (e) {
    console.error(e);
    err.textContent = "Erro ao excluir: " + e.message;
    activities = await loadActivities();
    renderCards();
  } finally {
    btn.disabled = false;
  }
}

function escapeHtml(str) {
  if (!str) return "";
  var amp = ["&", "a", "m", "p", ";"].join("");
  var lt = ["&", "l", "t", ";"].join("");
  var gt = ["&", "g", "t", ";"].join("");
  var quot = ["&", "q", "u", "o", "t", ";"].join("");
  return String(str).replace(/&/g, amp).replace(/</g, lt).replace(/>/g, gt).replace(/"/g, quot);
}
