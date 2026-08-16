let activities = [];
let currentId = null;

document.addEventListener("DOMContentLoaded", async function () {
  activities = await loadActivities();
  var sel = document.getElementById("sel-ativ");
  sel.innerHTML = activities.map(function (a) {
    return '<option value="' + a.id + '">#' + a.id + " — " + escapeHtml(a.tarefa) +
      (a.subtarefa ? " / " + escapeHtml(a.subtarefa) : "") + "</option>";
  }).join("");
  if (activities.length) {
    currentId = activities[0].id;
    sel.value = currentId;
    show(currentId);
  }
  sel.addEventListener("change", function () {
    currentId = parseInt(sel.value, 10);
    show(currentId);
  });
  document.getElementById("btn-mapa-excluir").addEventListener("click", function () {
    if (currentId == null) return;
    var a = activities.find(function (x) { return x.id === currentId; });
    openAnpDelete(currentId, "Excluir #" + currentId + " — " + (a ? a.tarefa : "") + "?", async function (id) {
      activities = await anpDeleteActivity(id, activities);
      sel.innerHTML = activities.map(function (x) {
        return '<option value="' + x.id + '">#' + x.id + " — " + escapeHtml(x.tarefa) + "</option>";
      }).join("");
      if (activities.length) {
        currentId = activities[0].id;
        sel.value = currentId;
        show(currentId);
      } else {
        currentId = null;
        clearMap();
      }
    });
  });
});

function clearMap() {
  ["m-what","m-why","m-who","m-where","m-when","m-how","m-howmuch"].forEach(function (id) {
    document.getElementById(id).textContent = "—";
  });
  document.getElementById("m-center").textContent = "Nenhuma atividade";
}

function whyText(a) {
  if (a.tipoDemanda === "NOVO") return "Implantar novo requisito no escopo ANP";
  if (a.tipoDemanda === "ADEQUAÇÃO") return "Adequar processo/sistema às exigências ANP";
  return a.obs || "Conformidade do Plano de Ação ANP";
}

function whereText(a) {
  var t = ((a.tarefa || "") + " " + (a.subtarefa || "") + " " + (a.categoria || "")).toUpperCase();
  var h = [];
  if (t.indexOf("F1") !== -1) h.push("Área F1");
  if (t.indexOf("F2") !== -1) h.push("Área F2");
  if (t.indexOf("ELÉTR") !== -1 || t.indexOf("INSTRUMENT") !== -1) h.push("Elétrica / Instrumentação");
  if (t.indexOf("MECÂN") !== -1 || t.indexOf("LUBRI") !== -1) h.push("Mecânica / Lubrificação");
  if (a.categoria) h.push(a.categoria);
  return h.length ? h.join(" · ") : "Escopo geral ANP";
}

function howText(a) {
  if (a.detalhes && a.detalhes.length) return a.detalhes.join("; ");
  return "Executar: " + (a.subtarefa || a.tarefa || "—");
}

function howMuchText(a) {
  var n = (a.detalhes && a.detalhes.length) ? a.detalhes.length : 1;
  return n + (n === 1 ? " etapa" : " etapas") + " · Status: " + (a.status || "A DEFINIR");
}

function show(id) {
  var a = activities.find(function (x) { return x.id === id; });
  if (!a) return clearMap();
  document.getElementById("m-center").textContent = "#" + a.id;
  document.getElementById("m-what").textContent = (a.tarefa || "") + (a.subtarefa ? " — " + a.subtarefa : "");
  document.getElementById("m-why").textContent = whyText(a);
  document.getElementById("m-who").textContent = a.responsavel || "A DEFINIR";
  document.getElementById("m-where").textContent = whereText(a);
  document.getElementById("m-when").textContent = a.previsao || "Não definida";
  document.getElementById("m-how").textContent = howText(a);
  document.getElementById("m-howmuch").textContent = howMuchText(a);
}

function escapeHtml(str) {
  if (!str) return "";
  var amp = ["&","a","m","p",";"].join("");
  var lt = ["&","l","t",";"].join("");
  var gt = ["&","g","t",";"].join("");
  var quot = ["&","q","u","o","t",";"].join("");
  return String(str).replace(/&/g, amp).replace(/</g, lt).replace(/>/g, gt).replace(/"/g, quot);
}
