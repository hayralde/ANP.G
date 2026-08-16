const ANP_ADMIN_PASS = "admin123";

function ensureDeleteModal() {
  if (document.getElementById("anp-delete-backdrop")) return;
  var div = document.createElement("div");
  div.id = "anp-delete-backdrop";
  div.className = "anp-del-backdrop";
  div.innerHTML =
    '<div class="anp-del-modal">' +
      "<h3>Excluir atividade</h3>" +
      '<p id="anp-del-label"></p>' +
      '<label for="anp-del-pass">Senha do administrador</label>' +
      '<input type="password" id="anp-del-pass" placeholder="Senha admin" autocomplete="current-password" />' +
      '<p id="anp-del-error" class="anp-del-error"></p>' +
      '<div class="anp-del-actions">' +
        '<button type="button" id="anp-del-cancel" class="anp-del-btn cancel">Cancelar</button>' +
        '<button type="button" id="anp-del-confirm" class="anp-del-btn danger">Excluir</button>' +
      "</div>" +
    "</div>";
  document.body.appendChild(div);

  if (!document.getElementById("anp-del-styles")) {
    var s = document.createElement("style");
    s.id = "anp-del-styles";
    s.textContent =
      ".anp-del-backdrop{position:fixed;inset:0;background:rgba(2,6,23,.75);display:none;align-items:center;justify-content:center;z-index:2000;padding:1rem}" +
      ".anp-del-backdrop.open{display:flex}" +
      ".anp-del-modal{background:#1e293b;border:1px solid #334155;border-radius:14px;padding:1.25rem 1.4rem;max-width:400px;width:100%}" +
      ".anp-del-modal h3{margin:0 0 .75rem;font-size:1.1rem}" +
      ".anp-del-modal p{margin:0 0 .75rem;color:#94a3b8;font-size:.9rem;line-height:1.45}" +
      ".anp-del-modal label{display:block;font-size:.7rem;text-transform:uppercase;color:#64748b;margin-bottom:.3rem;font-weight:600}" +
      ".anp-del-modal input{width:100%;background:#0f172a;border:1px solid #334155;border-radius:8px;color:#f1f5f9;padding:.6rem .75rem;font-size:.9rem;margin-bottom:.5rem}" +
      ".anp-del-error{color:#ef4444!important;min-height:1.2rem;font-size:.85rem!important}" +
      ".anp-del-actions{display:flex;justify-content:flex-end;gap:.5rem;margin-top:.75rem}" +
      ".anp-del-btn{border:none;border-radius:8px;padding:.5rem 1rem;cursor:pointer;font-size:.9rem;font-weight:600}" +
      ".anp-del-btn.cancel{background:transparent;border:1px solid #475569;color:#cbd5e1}" +
      ".anp-del-btn.danger{background:#ef4444;color:#fff}" +
      ".btn-excluir{display:inline-flex;align-items:center;gap:.35rem;background:transparent;border:1px solid #475569;color:#94a3b8;border-radius:8px;padding:.35rem .65rem;font-size:.78rem;font-weight:600;cursor:pointer;font-family:inherit}" +
      ".btn-excluir:hover{background:#ef4444;border-color:#ef4444;color:#fff}";
    document.head.appendChild(s);
  }

  document.getElementById("anp-del-cancel").addEventListener("click", closeAnpDelete);
  document.getElementById("anp-delete-backdrop").addEventListener("click", function (e) {
    if (e.target === this) closeAnpDelete();
  });
}

var _anpDelId = null;
var _anpDelCb = null;

function openAnpDelete(id, label, onConfirm) {
  ensureDeleteModal();
  _anpDelId = id;
  _anpDelCb = onConfirm;
  document.getElementById("anp-del-label").textContent = label || ("Excluir atividade #" + id + "?");
  document.getElementById("anp-del-pass").value = "";
  document.getElementById("anp-del-error").textContent = "";
  document.getElementById("anp-delete-backdrop").classList.add("open");
  document.getElementById("anp-del-pass").focus();

  var conf = document.getElementById("anp-del-confirm");
  conf.onclick = async function () {
    var pass = document.getElementById("anp-del-pass").value;
    if (pass !== ANP_ADMIN_PASS) {
      document.getElementById("anp-del-error").textContent = "Senha de administrador incorreta.";
      return;
    }
    conf.disabled = true;
    try {
      if (_anpDelCb) await _anpDelCb(_anpDelId);
      closeAnpDelete();
    } catch (e) {
      document.getElementById("anp-del-error").textContent = e.message || "Erro ao excluir";
    } finally {
      conf.disabled = false;
    }
  };
}

function closeAnpDelete() {
  var el = document.getElementById("anp-delete-backdrop");
  if (el) el.classList.remove("open");
  _anpDelId = null;
  _anpDelCb = null;
}

async function anpDeleteActivity(id, activities) {
  var next = activities.filter(function (a) { return a.id !== id; });
  return await saveActivitiesToApi(next);
}
