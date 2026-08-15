// ============================================
// ANP Monitor - Página de Administração
// ============================================

const ADMIN_USER = "admin";
const ADMIN_PASS = "admin123";
const SESSION_KEY = "anp_admin_session";
const TOKEN_KEY = "anp_gh_token";

let activities = [];

document.addEventListener("DOMContentLoaded", function () {
  if (isLoggedIn()) {
    showAdminPanel();
  } else {
    showLogin();
  }

  document.getElementById("login-form").addEventListener("submit", handleLogin);
  document.getElementById("btn-logout").addEventListener("click", handleLogout);
  document.getElementById("btn-save").addEventListener("click", saveAll);
  document.getElementById("btn-reset").addEventListener("click", handleReset);
  document.getElementById("btn-save-token").addEventListener("click", saveToken);
});

function isLoggedIn() {
  return sessionStorage.getItem(SESSION_KEY) === "true";
}

function getToken() {
  return sessionStorage.getItem(TOKEN_KEY) || "";
}

function showLogin() {
  document.getElementById("login-section").style.display = "flex";
  document.getElementById("admin-section").style.display = "none";
}

function showAdminPanel() {
  document.getElementById("login-section").style.display = "none";
  document.getElementById("admin-section").style.display = "block";

  var tokenInput = document.getElementById("gh-token");
  if (tokenInput) tokenInput.value = getToken();

  loadActivities().then(function (data) {
    activities = data;
    renderAdminTable();
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

function saveToken() {
  var token = document.getElementById("gh-token").value.trim();
  if (!token) {
    showToast("Cole o Personal Access Token do GitHub.", "error");
    return;
  }
  sessionStorage.setItem(TOKEN_KEY, token);
  showToast("Token salvo nesta sessão (não fica no código).", "success");
}

function renderAdminTable() {
  var tbody = document.getElementById("admin-tbody");
  tbody.innerHTML = activities.map(function (a, idx) {
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
    el.addEventListener("change", markDirty);
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

function markDirty() {
  var btn = document.getElementById("btn-save");
  if (btn) btn.textContent = "Salvar no GitHub *";
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

async function saveAll() {
  var token = getToken() || document.getElementById("gh-token").value.trim();
  if (!token) {
    showToast("Informe o Token do GitHub antes de salvar.", "error");
    document.getElementById("gh-token").focus();
    return;
  }
  sessionStorage.setItem(TOKEN_KEY, token);

  collectFromTable();
  var btn = document.getElementById("btn-save");
  var original = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Salvando...";

  try {
    await saveActivitiesToGitHub(activities, token);
    btn.textContent = "Salvar no GitHub";
    showToast("Salvo no GitHub! Em 1–2 min o dashboard atualiza para todos.", "success");
  } catch (e) {
    console.error(e);
    showToast("Erro ao salvar: " + e.message, "error");
    btn.textContent = original;
  } finally {
    btn.disabled = false;
  }
}

async function handleReset() {
  if (!confirm("Restaurar dados originais da planilha e salvar no GitHub?")) return;
  var token = getToken() || document.getElementById("gh-token").value.trim();
  if (!token) {
    showToast("Informe o Token do GitHub.", "error");
    return;
  }
  activities = resetActivities();
  renderAdminTable();
  try {
    await saveActivitiesToGitHub(activities, token);
    showToast("Dados restaurados e salvos no GitHub.", "success");
  } catch (e) {
    showToast("Restaurado na tela, mas falhou ao salvar no GitHub: " + e.message, "error");
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
  setTimeout(function () { toast.classList.remove("show"); }, 4000);
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
