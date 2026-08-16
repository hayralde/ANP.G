function ensureMotivoModal() {
  if (document.getElementById("anp-motivo-backdrop")) return;
  var div = document.createElement("div");
  div.id = "anp-motivo-backdrop";
  div.className = "anp-mot-backdrop";
  div.innerHTML =
    '<div class="anp-mot-modal">' +
      '<h3 id="anp-mot-title">Motivo do bloqueio</h3>' +
      '<p id="anp-mot-label"></p>' +
      '<label for="anp-mot-text">Motivo</label>' +
      '<textarea id="anp-mot-text" rows="3" placeholder="Descreva o motivo de estar parado..."></textarea>' +
      '<p id="anp-mot-error" class="anp-mot-error"></p>' +
      '<div class="anp-mot-actions">' +
        '<button type="button" id="anp-mot-cancel" class="anp-mot-btn cancel">Cancelar</button>' +
        '<button type="button" id="anp-mot-confirm" class="anp-mot-btn primary">Salvar</button>' +
      "</div>" +
    "</div>";
  document.body.appendChild(div);

  if (!document.getElementById("anp-mot-styles")) {
    var s = document.createElement("style");
    s.id = "anp-mot-styles";
    s.textContent =
      ".anp-mot-backdrop{position:fixed;inset:0;background:rgba(2,6,23,.75);display:none;align-items:center;justify-content:center;z-index:2000;padding:1rem}" +
      ".anp-mot-backdrop.open{display:flex}" +
      ".anp-mot-modal{background:#1e293b;border:1px solid #334155;border-radius:14px;padding:1.25rem 1.4rem;max-width:420px;width:100%}" +
      ".anp-mot-modal h3{margin:0 0 .75rem;font-size:1.1rem;color:#f1f5f9}" +
      ".anp-mot-modal p{margin:0 0 .75rem;color:#94a3b8;font-size:.9rem;line-height:1.45}" +
      ".anp-mot-modal label{display:block;font-size:.7rem;text-transform:uppercase;color:#64748b;margin-bottom:.3rem;font-weight:600}" +
      ".anp-mot-modal textarea{width:100%;background:#0f172a;border:1px solid #334155;border-radius:8px;color:#f1f5f9;padding:.6rem .75rem;font-size:.9rem;margin-bottom:.5rem;font-family:inherit;resize:vertical}" +
      ".anp-mot-error{color:#ef4444!important;min-height:1.2rem;font-size:.85rem!important}" +
      ".anp-mot-actions{display:flex;justify-content:flex-end;gap:.5rem;margin-top:.75rem}" +
      ".anp-mot-btn{border:none;border-radius:8px;padding:.5rem 1rem;cursor:pointer;font-size:.9rem;font-weight:600}" +
      ".anp-mot-btn.cancel{background:transparent;border:1px solid #475569;color:#cbd5e1}" +
      ".anp-mot-btn.primary{background:#f59e0b;color:#0f172a}";
    document.head.appendChild(s);
  }

  document.getElementById("anp-mot-cancel").addEventListener("click", function () { closeAnpMotivo(true); });
  document.getElementById("anp-motivo-backdrop").addEventListener("click", function (e) {
    if (e.target === this) closeAnpMotivo(true);
  });
}

var _anpMotCb = null;
var _anpMotCancelCb = null;

function openAnpMotivo(opts) {
  opts = opts || {};
  ensureMotivoModal();
  document.getElementById("anp-mot-title").textContent = opts.title || "Motivo do bloqueio";
  document.getElementById("anp-mot-label").textContent = opts.label || "";
  document.getElementById("anp-mot-text").value = opts.value || "";
  document.getElementById("anp-mot-error").textContent = "";
  _anpMotCb = opts.onConfirm || null;
  _anpMotCancelCb = opts.onCancel || null;
  document.getElementById("anp-motivo-backdrop").classList.add("open");
  document.getElementById("anp-mot-text").focus();

  var conf = document.getElementById("anp-mot-confirm");
  conf.onclick = async function () {
    var val = document.getElementById("anp-mot-text").value.trim();
    if (opts.required && !val) {
      document.getElementById("anp-mot-error").textContent = "Informe o motivo.";
      return;
    }
    conf.disabled = true;
    try {
      if (_anpMotCb) await _anpMotCb(val);
      _anpMotCancelCb = null;
      closeAnpMotivo(false);
    } catch (e) {
      document.getElementById("anp-mot-error").textContent = e.message || "Erro ao salvar";
    } finally {
      conf.disabled = false;
    }
  };
}

function closeAnpMotivo(runCancel) {
  var el = document.getElementById("anp-motivo-backdrop");
  if (el) el.classList.remove("open");
  if (runCancel && _anpMotCancelCb) _anpMotCancelCb();
  _anpMotCb = null;
  _anpMotCancelCb = null;
}
