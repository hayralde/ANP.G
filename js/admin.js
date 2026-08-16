// ============================================
// ANP Monitor - Administração (API Render)
// Auto-save ao alterar campos
// ============================================

const ADMIN_USER = "admin";
const ADMIN_PASS = "admin123";
const SESSION_KEY = "anp_admin_session";
const AUTOSAVE_MS = 800;

let activities = [];
let saveTimer = null;
let saving = false;
let pendingSave = false;

document.addEventListener("DOMContentLoaded", function () {
  if (isLoggedIn()) {
    showAdminPanel();
  } else {
    showLogin();
  }

  document.getElementById("login-form").addEventListener("submit", handleLogin);
  document.getElementById("btn-logout").addEventListener("click", handleLogout);

  var btnSave = document.getElementById("btn-save");
  if (btnSave) btnSave.addEventListener("click", function () { saveAll(true); });

  var btnReset = document.getElementById("btn-reset");
  if (btnReset) btnReset.addEventListener("click", handleReset);
});

function isLoggedIn() {
  return sessionStorage.getItem(SESSION_KEY) === "true";
}

function showLogin() {
  document.getElementById("login-section").style.display = "flex";
  document.getElementById("admin-section").style.display = "none";
}

function showAdminPanel() {
  document.getElementById("login-section").style.display = "none";
  document.getElementById("admin-section").style.display = "block";
  setSaveStatus("Carregando...");
  loadActivities().then(function (data) {
    activities = data;
    renderAdminTable();
    setSaveStatus("Pronto — alterações salvam automaticamente");
  });
}

function handleLogin(e) {
  e.preventDefault();
  var user = document.getElementById("username").value.trim();
  var pass = document.getElementById("password").value;
  var errorEl = document.getElementById("login-error");

  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    sessionStorage.setItem(SESSION_KEY, "true");
    errorEl.style.display = "none";
    showAdminPanel();
    showToast("Login realizado com sucesso!", "success");
  } else {
    errorEl.style.display = "block";
    errorEl.textContent = "Usuário ou senha incorretos.";
  }
}

function handleLogout() {
  sessionStorage.removeItem(SESSION_KEY);
  showLogin();
  document.getElementById("username").value = "";
  document.getElementById("password").value = "";
}

function setSaveStatus(text, kind) {
  var el = document.getElementById("save-status");
  if (!el) return;
  el.textContent = text;
  el.className = "save-status" + (kind ? " " + kind : "");
}

function renderAdminTable() {
  var tbody = document.getElementById("admin-tbody");
  tbody.innerHTML = activities.map(function (a) {
    return (
      '<tr data-id="' + a.id + '">' +
        "<td><strong>#" + a.id + "</strong></td>" +
        "<td>" +
          '<div style="font-weight:600;font-size:0.85rem">' + escapeHtml(a.tarefa) + "</div>" +
          '<div style="font-size:0.75rem;color:var(--text-secondary)">' + escapeHtml(a.subtarefa) + "</div>" +
        "</td>" +
        "<td><select class=\"edit-status\">" + optionsHtml(STATUS_OPTIONS, a.status) + "</select></td>" +
        "<td><select class=\"edit-responsavel\">" + optionsHtml(RESPONSAVEIS, a.responsavel) + "</select></td>" +
        "<td><select class=\"edit-pendencia\">" + optionsHtml(PENDENCIAS, a.pendencia) + "</select></td>" +
        "<td><select class=\"edit-tipo\">" + optionsHtml(TIPOS_DEMANDA, a.tipoDemanda) + "</select></td>" +
        '<td><input type="date" class="edit-previsao" value="' + formatDateForInput(a.previsao) + '" /></td>' +
        '<td><input type="text" class="edit-obs" value="' + escapeHtml(a.obs || "") + '" placeholder="Observação..." style="min-width:140px" /></td>' +
      "</tr>"
    );
  }).join("");

  tbody.querySelectorAll("select, input").forEach(function (el) {
    el.addEventListener("change", scheduleAutoSave);
    if (el.tagName === "INPUT" && el.type === "text") {
      el.addEventListener("input", scheduleAutoSave);
    }
  });
}

function optionsHtml(list, selected) {
  return list.map(function (v) {
    return '<option value="' + escapeHtml(v) + '"' + (v === selected ? " selected" : "") + ">" + escapeHtml(v) + "</option>";
  }).join("");
}

function formatDateForInput(val) {
  if (!val || String(val).indexOf("XX") !== -1) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  var parts = String(val).split("/");
  if (parts.length === 3) {
    return parts[2] + "-" + parts[1].padStart(2, "0") + "-" + parts[0].padStart(2, "0");
  }
  return "";
}

function formatDateForDisplay(iso) {
  if (!iso) return "";
  var p = iso.split("-");
  return p[2] + "/" + p[1] + "/" + p[0];
}

function scheduleAutoSave() {
  setSaveStatus("Alteração detectada — salvando em instantes...", "pending");
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(function () {
    saveAll(false);
  }, AUTOSAVE_MS);
}

function collectFromTable() {
  document.querySelectorAll("#admin-tbody tr").forEach(function (row) {
    var id = parseInt(row.dataset.id, 10);
    var activity = activities.find(function (a) { return a.id === id; });
    if (!activity) return;
    activity.status = row.querySelector(".edit-status").value;
    activity.responsavel = row.querySelector(".edit-responsavel").value;
    activity.pendencia = row.querySelector(".edit-pendencia").value;
    activity.tipoDemanda = row.querySelector(".edit-tipo").value;
    var dateVal = row.querySelector(".edit-previsao").value;
    activity.previsao = dateVal ? formatDateForDisplay(dateVal) : "";
    activity.obs = row.querySelector(".edit-obs").value.trim();
  });
}

async function saveAll(manual) {
  if (saving) {
    pendingSave = true;
    return;
  }
  collectFromTable();
  saving = true;
  setSaveStatus("Salvando no banco...", "pending");

  var btn = document.getElementById("btn-save");
  if (btn) btn.disabled = true;

  try {
    activities = await saveActivitiesToApi(activities);
    setSaveStatus("Salvo automaticamente ✓", "ok");
    if (manual) showToast("Salvo no banco de dados!", "success");
  } catch (e) {
    console.error(e);
    setSaveStatus("Erro ao salvar: " + e.message, "err");
    showToast("Erro ao salvar: " + e.message, "error");
  } finally {
    saving = false;
    if (btn) btn.disabled = false;
    if (pendingSave) {
      pendingSave = false;
      scheduleAutoSave();
    }
  }
}

async function handleReset() {
  if (!confirm("Restaurar dados originais da planilha e salvar no banco?")) return;
  activities = resetActivities();
  renderAdminTable();
  try {
    activities = await saveActivitiesToApi(activities);
    setSaveStatus("Originais restaurados e salvos ✓", "ok");
    showToast("Dados restaurados e salvos no banco.", "success");
  } catch (e) {
    showToast("Restaurado na tela, mas falhou ao salvar: " + e.message, "error");
  }
}

function showToast(msg, type) {
  type = type || "success";
  var toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.className = "toast " + type + " show";
  setTimeout(function () { toast.classList.remove("show"); }, 3500);
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
