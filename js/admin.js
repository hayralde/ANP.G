// ============================================
// ANP Monitor - Página de Administração
// ============================================

const ADMIN_USER = "admin";
const ADMIN_PASS = "admin123";
const SESSION_KEY = "anp_admin_session";

let activities = [];

document.addEventListener("DOMContentLoaded", () => {
  if (isLoggedIn()) {
    showAdminPanel();
  } else {
    showLogin();
  }

  document.getElementById("login-form")?.addEventListener("submit", handleLogin);
  document.getElementById("btn-logout")?.addEventListener("click", handleLogout);
  document.getElementById("btn-save")?.addEventListener("click", saveAll);
  document.getElementById("btn-reset")?.addEventListener("click", handleReset);
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
  activities = loadActivities();
  renderAdminTable();
}

function handleLogin(e) {
  e.preventDefault();
  const user = document.getElementById("username").value.trim();
  const pass = document.getElementById("password").value;
  const errorEl = document.getElementById("login-error");

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

function renderAdminTable() {
  const tbody = document.getElementById("admin-tbody");
  tbody.innerHTML = activities.map((a, idx) => `
    <tr data-id="${a.id}">
      <td><strong>#${a.id}</strong></td>
      <td>
        <div style="font-weight:600;font-size:0.85rem">${escapeHtml(a.tarefa)}</div>
        <div style="font-size:0.75rem;color:var(--text-secondary)">${escapeHtml(a.subtarefa)}</div>
      </td>
      <td>
        <select class="edit-status" data-idx="${idx}">
          ${STATUS_OPTIONS.map(s => `<option value="${s}" ${a.status === s ? "selected" : ""}>${s}</option>`).join("")}
        </select>
      </td>
      <td>
        <select class="edit-responsavel" data-idx="${idx}">
          ${RESPONSAVEIS.map(r => `<option value="${r}" ${a.responsavel === r ? "selected" : ""}>${r}</option>`).join("")}
        </select>
      </td>
      <td>
        <select class="edit-pendencia" data-idx="${idx}">
          ${PENDENCIAS.map(p => `<option value="${p}" ${a.pendencia === p ? "selected" : ""}>${p}</option>`).join("")}
        </select>
      </td>
      <td>
        <select class="edit-tipo" data-idx="${idx}">
          ${TIPOS_DEMANDA.map(t => `<option value="${t}" ${a.tipoDemanda === t ? "selected" : ""}>${t}</option>`).join("")}
        </select>
      </td>
      <td>
        <input type="date" class="edit-previsao" data-idx="${idx}" value="${formatDateForInput(a.previsao)}" />
      </td>
      <td>
        <input type="text" class="edit-obs" data-idx="${idx}" value="${escapeHtml(a.obs || "")}" placeholder="Observação..." style="min-width:140px" />
      </td>
    </tr>
  `).join("");

  tbody.querySelectorAll("select, input").forEach(el => {
    el.addEventListener("change", markDirty);
  });
}

function formatDateForInput(val) {
  if (!val || val.includes("XX")) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  const parts = val.split("/");
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2,"0")}-${parts[0].padStart(2,"0")}`;
  }
  return "";
}

function formatDateForDisplay(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function markDirty() {
  const btn = document.getElementById("btn-save");
  if (btn) {
    btn.textContent = "Salvar alterações *";
    btn.classList.add("btn-primary");
  }
}

function collectFromTable() {
  const rows = document.querySelectorAll("#admin-tbody tr");
  rows.forEach(row => {
    const id = parseInt(row.dataset.id, 10);
    const activity = activities.find(a => a.id === id);
    if (!activity) return;

    activity.status = row.querySelector(".edit-status").value;
    activity.responsavel = row.querySelector(".edit-responsavel").value;
    activity.pendencia = row.querySelector(".edit-pendencia").value;
    activity.tipoDemanda = row.querySelector(".edit-tipo").value;
    const dateVal = row.querySelector(".edit-previsao").value;
    activity.previsao = dateVal ? formatDateForDisplay(dateVal) : "";
    activity.obs = row.querySelector(".edit-obs").value.trim();
  });
}

function saveAll() {
  collectFromTable();
  saveActivities(activities);
  const btn = document.getElementById("btn-save");
  if (btn) {
    btn.textContent = "Salvar alterações";
  }
  showToast("Alterações salvas com sucesso! O dashboard refletirá as mudanças.", "success");
}

function handleReset() {
  if (!confirm("Tem certeza que deseja restaurar todos os dados para o estado original da planilha? As alterações locais serão perdidas.")) {
    return;
  }
  activities = resetActivities();
  renderAdminTable();
  showToast("Dados restaurados para o padrão da planilha.", "success");
}

function showToast(msg, type = "success") {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.className = `toast ${type} show`;
  setTimeout(() => toast.classList.remove("show"), 3500);
}

function escapeHtml(str) {
  if (!str) return "";
  const amp = ["&", "a", "m", "p", ";"].join("");
  const lt = ["&", "l", "t", ";"].join("");
  const gt = ["&", "g", "t", ";"].join("");
  const quot = ["&", "q", "u", "o", "t", ";"].join("");
  return String(str)
    .replace(/&/g, amp)
    .replace(/</g, lt)
    .replace(/>/g, gt)
    .replace(/"/g, quot);
}
