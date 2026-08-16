let activities = [];
let editingId = null;

document.addEventListener("DOMContentLoaded", async function () {
  fillSelects();
  activities = await loadActivities();
  setStatus("Clique em um card para editar");
  renderCards();

  document.getElementById("modal-close").addEventListener("click", closeModal);
  document.getElementById("btn-cancel").addEventListener("click", closeModal);
  document.getElementById("modal-backdrop").addEventListener("click", function (e) {
    if (e.target === this) closeModal();
  });
  document.getElementById("btn-add-item").addEventListener("click", function () {
    addItemRow("");
  });
  document.getElementById("edit-form").addEventListener("submit", onSave);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeModal();
  });
});

function fillSelects() {
  fillOptions("f-responsavel", RESPONSAVEIS);
  fillOptions("f-pendencia", PENDENCIAS);
  fillOptions("f-tipo", TIPOS_DEMANDA);
  fillOptions("f-status", STATUS_OPTIONS);
}

function fillOptions(id, list) {
  var el = document.getElementById(id);
  el.innerHTML = list.map(function (v) {
    return '<option value="' + escapeHtml(v) + '">' + escapeHtml(v) + "</option>";
  }).join("");
}

function fillAreaSelect(current) {
  var areas = [];
  activities.forEach(function (a) {
    var key = a.categoria || a.tarefa;
    if (areas.indexOf(key) === -1) areas.push(key);
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
  var map = {
    "A DEFINIR": "a-definir",
    "PARADO": "parado",
    "EM ANDAMENTO": "em-andamento",
    "CONCLUIDO": "concluido"
  };
  return map[s] || "a-definir";
}

function renderCards() {
  var grid = document.getElementById("edit-grid");
  grid.innerHTML = activities.map(function (a) {
    return (
      '<article class="edit-card" data-id="' + a.id + '">' +
        "<h3>" + escapeHtml(a.tarefa) + "</h3>" +
        "<p>" + escapeHtml(a.subtarefa || "") + "</p>" +
        '<div class="edit-card-meta">' +
          '<span class="status-badge ' + statusClass(a.status) + '">' + escapeHtml(a.status) + "</span>" +
          '<span style="font-size:0.75rem;color:var(--text-muted)">' + escapeHtml(a.responsavel || "") + "</span>" +
          '<span style="font-size:0.75rem;color:var(--text-muted)">#' + a.id + "</span>" +
        "</div>" +
      "</article>"
    );
  }).join("");

  grid.querySelectorAll(".edit-card").forEach(function (card) {
    card.addEventListener("click", function () {
      openModal(parseInt(card.dataset.id, 10));
    });
  });
}

function openModal(id) {
  var a = activities.find(function (x) { return x.id === id; });
  if (!a) return;
  editingId = id;

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

  var list = document.getElementById("itens-list");
  list.innerHTML = "";
  var detalhes = a.detalhes || [];
  if (detalhes.length) {
    detalhes.forEach(function (d) { addItemRow(d); });
  }

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
  row.innerHTML =
    '<input type="text" class="item-input" value="' + escapeHtml(value || "") + '" placeholder="Descreva o item..." />' +
    '<button type="button" title="Remover">&times;</button>';
  row.querySelector("button").addEventListener("click", function () {
    row.remove();
  });
  document.getElementById("itens-list").appendChild(row);
}

function collectItens() {
  var inputs = document.querySelectorAll("#itens-list .item-input");
  var out = [];
  inputs.forEach(function (inp) {
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

async function onSave(e) {
  e.preventDefault();
  var id = parseInt(document.getElementById("f-id").value, 10);
  var idx = activities.findIndex(function (a) { return a.id === id; });
  if (idx < 0) return;

  activities[idx] = {
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

  var btn = document.getElementById("btn-save-modal");
  btn.disabled = true;
  btn.textContent = "Salvando...";
  setStatus("Salvando no banco...");

  try {
    activities = await saveActivitiesToApi(activities);
    setStatus("Atividade #" + id + " salva com sucesso", "ok");
    renderCards();
    closeModal();
  } catch (err) {
    console.error(err);
    setStatus("Erro: " + err.message, "err");
  } finally {
    btn.disabled = false;
    btn.textContent = "Salvar atividade";
  }
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
