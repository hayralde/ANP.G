const ADMIN_USER = "admin";
const ADMIN_PASS = "admin123";
let activities = [];
let mode = "edit";

document.addEventListener("DOMContentLoaded", function () {
  fillSelects();
  if (sessionStorage.getItem("anp_admin2_session") === "1") showAdmin();
  document.getElementById("login-form").addEventListener("submit", onLogin);
  document.getElementById("btn-nova").addEventListener("click", openCreate);
  document.getElementById("modal-close").addEventListener("click", closeModal);
  document.getElementById("btn-cancel").addEventListener("click", closeModal);
  document.getElementById("btn-add-item").addEventListener("click", function () { addItemRow(""); });
  document.getElementById("edit-form").addEventListener("submit", onSave);
  document.getElementById("modal-backdrop").addEventListener("click", function (e) {
    if (e.target === this) closeModal();
  });
});

function onLogin(e) {
  e.preventDefault();
  var u = document.getElementById("username").value.trim();
  var p = document.getElementById("password").value;
  var err = document.getElementById("login-error");
  if (u === ADMIN_USER && p === ADMIN_PASS) {
    sessionStorage.setItem("anp_admin2_session", "1");
    err.textContent = "";
    showAdmin();
  } else {
    err.textContent = "Usuário ou senha incorretos.";
  }
}

async function showAdmin() {
  document.getElementById("login-section").style.display = "none";
  document.getElementById("admin-section").style.display = "block";
  activities = await loadActivities2();
  setStatus("Pronto");
  renderCards();
  openEditFromQuery();
}

function openEditFromQuery() {
  var params = new URLSearchParams(location.search);
  var editId = parseInt(params.get("edit"), 10);
  if (!editId) return;
  var a = activities.find(function (x) { return x.id === editId; });
  if (a) openEdit(editId);
  history.replaceState(null, "", location.pathname);
}

function fillSelects() {
  fill("f-responsavel", RESPONSAVEIS);
  fill("f-pendencia", PENDENCIAS);
  fill("f-tipo", TIPOS_DEMANDA);
  fill("f-status", STATUS_OPTIONS);
}
function fill(id, list) {
  document.getElementById(id).innerHTML = list.map(function (v) {
    return '<option value="' + esc(v) + '">' + esc(v) + "</option>";
  }).join("");
}
function setStatus(msg, kind) {
  var el = document.getElementById("status-bar");
  el.textContent = msg;
  el.className = kind || "";
}
function esc(s) {
  if (!s) return "";
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function stClass(s) {
  var m = { "A DEFINIR": "a-definir", "PARADO": "parado", "EM ANDAMENTO": "em-andamento", "ATRASADO": "atrasado", "CONCLUIDO": "concluido" };
  return m[s] || "a-definir";
}

function renderCards() {
  var grid = document.getElementById("edit-grid");
  var areas = {};
  activities.forEach(function (a) {
    var k = a.categoria || "Geral";
    if (!areas[k]) areas[k] = true;
  });
  document.getElementById("areas-list").innerHTML = Object.keys(areas).map(function (a) {
    return "<option value=\"" + esc(a) + "\">";
  }).join("");

  grid.innerHTML = activities.map(function (a) {
    return '<article class="edit-card" data-id="' + a.id + '">' +
      '<div class="edit-card-top"><div><h3>' + esc(a.tarefa) + "</h3><p>" + esc(a.subtarefa || "") + "</p></div>" +
      '<button type="button" class="btn-excluir-soft" data-id="' + a.id + '">Excluir</button></div>' +
      '<div style="display:flex;gap:.4rem;flex-wrap:wrap;align-items:center">' +
      '<span class="status-badge ' + stClass(a.status) + '">' + esc(a.status) + "</span>" +
      '<span style="font-size:.75rem;color:var(--text-muted)">' + esc(a.responsavel) + " · #" + a.id + "</span></div></article>";
  }).join("");

  grid.querySelectorAll(".edit-card").forEach(function (card) {
    card.addEventListener("click", function (e) {
      if (e.target.closest(".btn-excluir-soft")) return;
      openEdit(parseInt(card.dataset.id, 10));
    });
  });
  grid.querySelectorAll(".btn-excluir-soft").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var id = parseInt(btn.dataset.id, 10);
      var a = activities.find(function (x) { return x.id === id; });
      openAnpDelete(id, "Excluir #" + id + " — " + (a ? a.tarefa : "") + "?", async function (delId) {
        activities = activities.filter(function (x) { return x.id !== delId; });
        activities = await saveActivities2ToApi(activities);
        setStatus("Excluída #" + delId, "ok");
        renderCards();
      });
    });
  });
}

function openCreate() {
  mode = "create";
  document.getElementById("modal-title").textContent = "Nova atividade";
  document.getElementById("f-id").value = "";
  document.getElementById("f-area").value = "";
  document.getElementById("f-tarefa").value = "";
  document.getElementById("f-subtarefa").value = "";
  document.getElementById("f-responsavel").value = "A DEFINIR";
  document.getElementById("f-pendencia").value = "NENHUMA";
  document.getElementById("f-tipo").value = "NOVO";
  document.getElementById("f-status").value = "A DEFINIR";
  document.getElementById("f-previsao-inicio").value = "";
  document.getElementById("f-previsao-fim").value = "";
  document.getElementById("f-motivo").value = "";
  document.getElementById("f-obs").value = "";
  document.getElementById("itens-list").innerHTML = "";
  document.getElementById("modal-backdrop").classList.add("open");
}

function openEdit(id) {
  var a = activities.find(function (x) { return x.id === id; });
  if (!a) return;
  mode = "edit";
  document.getElementById("modal-title").textContent = "Editar atividade";
  document.getElementById("f-id").value = a.id;
  document.getElementById("f-area").value = a.categoria || "";
  document.getElementById("f-tarefa").value = a.tarefa || "";
  document.getElementById("f-subtarefa").value = a.subtarefa || "";
  document.getElementById("f-responsavel").value = a.responsavel || "A DEFINIR";
  document.getElementById("f-pendencia").value = a.pendencia || "A DEFINIR";
  document.getElementById("f-tipo").value = a.tipoDemanda || "NOVO";
  document.getElementById("f-status").value = a.status || "A DEFINIR";
  document.getElementById("f-previsao-inicio").value = toIso(a.previsaoInicio || "");
  document.getElementById("f-previsao-fim").value = toIso(a.previsaoFim || a.previsao || "");
  document.getElementById("f-motivo").value = a.motivo || "";
  document.getElementById("f-obs").value = a.obs || "";
  document.getElementById("itens-list").innerHTML = "";
  (a.detalhes || []).forEach(function (d) { addItemRow(d); });
  document.getElementById("modal-backdrop").classList.add("open");
}

function closeModal() {
  document.getElementById("modal-backdrop").classList.remove("open");
}

function addItemRow(v) {
  var row = document.createElement("div");
  row.className = "item-row";
  row.innerHTML = '<input type="text" class="item-input" value="' + esc(v || "") + '" />' +
    '<button type="button">&times;</button>';
  row.querySelector("button").onclick = function () { row.remove(); };
  document.getElementById("itens-list").appendChild(row);
}

function collectItens() {
  var out = [];
  document.querySelectorAll("#itens-list .item-input").forEach(function (i) {
    var v = i.value.trim();
    if (v) out.push(v);
  });
  return out;
}

function toIso(val) {
  if (!val) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  var p = String(val).split("/");
  if (p.length === 3) return p[2] + "-" + p[1].padStart(2, "0") + "-" + p[0].padStart(2, "0");
  return "";
}
function fromIso(iso) {
  if (!iso) return "";
  var p = iso.split("-");
  return p[2] + "/" + p[1] + "/" + p[0];
}
function nextId() {
  var m = 0;
  activities.forEach(function (a) { if (a.id > m) m = a.id; });
  return m + 1;
}
function formObj(id) {
  return {
    id: id,
    tarefa: document.getElementById("f-tarefa").value.trim(),
    subtarefa: document.getElementById("f-subtarefa").value.trim(),
    categoria: document.getElementById("f-area").value.trim(),
    responsavel: document.getElementById("f-responsavel").value,
    pendencia: document.getElementById("f-pendencia").value,
    tipoDemanda: document.getElementById("f-tipo").value,
    status: document.getElementById("f-status").value,
    previsaoInicio: fromIso(document.getElementById("f-previsao-inicio").value),
    previsaoFim: fromIso(document.getElementById("f-previsao-fim").value),
    previsao: fromIso(document.getElementById("f-previsao-fim").value),
    motivo: document.getElementById("f-motivo").value.trim(),
    obs: document.getElementById("f-obs").value.trim(),
    detalhes: collectItens()
  };
}

async function onSave(e) {
  e.preventDefault();
  var btn = document.getElementById("btn-save");
  btn.disabled = true;
  try {
    if (mode === "create") {
      activities.push(formObj(nextId()));
    } else {
      var id = parseInt(document.getElementById("f-id").value, 10);
      var i = activities.findIndex(function (a) { return a.id === id; });
      if (i >= 0) activities[i] = formObj(id);
    }
    activities = await saveActivities2ToApi(activities);
    setStatus("Salvo", "ok");
    renderCards();
    closeModal();
  } catch (err) {
    setStatus("Erro: " + err.message, "err");
  } finally {
    btn.disabled = false;
  }
}
