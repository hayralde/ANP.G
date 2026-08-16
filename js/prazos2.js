document.addEventListener("DOMContentLoaded", async function () {
  window._list2 = await loadActivities2();
  render(window._list2);
});
var COLORS = {"Indicadores KPI":"#3b82f6","Plano de Manutenção":"#f97316","Matriz de Criticidade":"#14b8a6","Cadastro de Equipamentos":"#eab308","Tagueamento":"#ec4899","Certificado de Calibração":"#22c55e","POP":"#8b5cf6"};
function color(area){return COLORS[area]||"#64748b";}
function stClass(s){if(s==="PARADO")return"st-parado";if(s==="EM ANDAMENTO")return"st-andamento";if(s==="CONCLUIDO")return"st-concluido";return"st-definir";}
function esc(s){if(!s)return"";return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
function hasPrazo(p){if(!p)return false;var s=String(p).trim().toLowerCase();return s&&s!=="a definir"&&s.indexOf("xx")===-1;}
function render(list){
  window._list2=list;var n=0;list.forEach(function(a){if(hasPrazo(a.previsao))n++;});
  document.getElementById("prazos-summary").textContent=n+" com prazo definido · "+(list.length-n)+" a definir";
  var tb=document.getElementById("prazos-body");
  if(!list.length){tb.innerHTML='<tr><td colspan="6" style="text-align:center;color:#64748b;padding:2rem">Nenhuma atividade</td></tr>';return;}
  tb.innerHTML=list.map(function(a){
    var area=a.categoria||a.tarefa||"Geral";var prev=hasPrazo(a.previsao)?a.previsao:"A definir";
    return "<tr><td><div class=\"area-cell\"><span class=\"area-dot\" style=\"background:"+color(area)+"\"></span>"+esc(area)+"</div></td>"+
      "<td><span class=\"ativ-main\">"+esc(a.tarefa)+"</span>"+(a.subtarefa?' <span class=\"ativ-sub\">— '+esc(a.subtarefa)+"</span>":"")+"</td>"+
      "<td>"+esc(a.responsavel||"A DEFINIR")+"</td><td>"+esc(prev)+"</td>"+
      "<td><span class=\"status-pill "+stClass(a.status)+"\">"+esc(a.status||"A DEFINIR")+"</span></td>"+
      "<td><button type=\"button\" class=\"btn-excluir-soft\" data-id=\""+a.id+"\">Excluir</button></td></tr>";
  }).join("");
}
document.addEventListener("click",function(e){
  var btn=e.target.closest(".btn-excluir-soft");if(!btn||!btn.dataset.id)return;
  var id=parseInt(btn.dataset.id,10);var list=window._list2||[];var a=list.find(function(x){return x.id===id;});
  openAnpDelete(id,"Excluir #"+id+" — "+(a?a.tarefa:"")+"?",async function(delId){
    var next=list.filter(function(x){return x.id!==delId;});
    window._list2=await saveActivities2ToApi(next);render(window._list2);
  });
});
