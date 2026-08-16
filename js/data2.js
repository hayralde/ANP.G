const API_BASE = "https://anp-g.onrender.com";

const RESPONSAVEIS = ["A DEFINIR", "BRUNA", "ROSE", "JOSÉ", "JOSE", "GESTÃO|PROCESSO", "GESTÃO/PROCESSO"];
const PENDENCIAS = ["NENHUMA", "A DEFINIR", "PROCESSO", "GESTÃO", "SISTEMA", "MATERIAL", "DOCUMENTAÇÃO"];
const TIPOS_DEMANDA = ["NOVO", "ADEQUAÇÃO"];
const STATUS_OPTIONS = ["A DEFINIR", "PARADO", "EM ANDAMENTO", "CONCLUIDO"];

const DEFAULT_ACTIVITIES_2 = [
  { id: 1, tarefa: "INDICADORES", subtarefa: "CRIAR PAINEL", detalhes: [], responsavel: "A DEFINIR", pendencia: "NENHUMA", tipoDemanda: "NOVO", previsaoInicio: "", previsaoFim: "", obs: "", status: "A DEFINIR", categoria: "Indicadores KPI" },
  { id: 2, tarefa: "PLANOS DE MANUTENÇÃO", subtarefa: "CRIAR PLANOS DE ELÉTRICA E INSTRUMENTAÇÃO", detalhes: ["MAPEAR TODAS AS ROTAS NECESSÁRIAS POR ÁREA", "ALOCAR EQUIPAMENTOS NAS ROTAS", "ADEQUAR ROTAS EXISTENTES E CRIAR ROTAS PENDENTES"], responsavel: "A DEFINIR", pendencia: "A DEFINIR", tipoDemanda: "ADEQUAÇÃO", previsaoInicio: "", previsaoFim: "", obs: "", status: "A DEFINIR", categoria: "Plano de Manutenção" },
  { id: 3, tarefa: "PLANOS DE MANUTENÇÃO", subtarefa: "CRIAR PLANOS DE MECÂNICA | LUBRIFICAÇÃO | PREDITIVA", detalhes: ["MAPEAR TODAS AS ROTAS NECESSÁRIAS POR ÁREA", "ADEQUAR ROTAS EXISTENTES E CRIAR ROTAS PENDENTES", "ALOCAR EQUIPAMENTOS NAS ROTAS"], responsavel: "A DEFINIR", pendencia: "A DEFINIR", tipoDemanda: "ADEQUAÇÃO", previsaoInicio: "", previsaoFim: "", obs: "", status: "A DEFINIR", categoria: "Plano de Manutenção" },
  { id: 4, tarefa: "MATRIZ DE CRITICIDADE", subtarefa: "REVISAR CRITICIDADE F1 E DEFINIR F2", detalhes: [], responsavel: "ROSE", pendencia: "A DEFINIR", tipoDemanda: "ADEQUAÇÃO", previsaoInicio: "", previsaoFim: "", obs: "", status: "A DEFINIR", categoria: "Matriz de Criticidade" },
  { id: 5, tarefa: "CADASTRAR EQUIPAMENTOS F2", subtarefa: "CRIAR CADASTROS F2", detalhes: ["SINALIZAR EQUIPAMENTOS EX", "ANEXAR MANUAIS", "INSERIR OBJETO DE CUSTO NOS EQUIPAMENTOS"], responsavel: "GESTÃO|PROCESSO", pendencia: "A DEFINIR", tipoDemanda: "NOVO", previsaoInicio: "", previsaoFim: "", obs: "", status: "A DEFINIR", categoria: "Cadastro de Equipamentos" },
  { id: 6, tarefa: "LISTAR EQUIPAMENTOS EX", subtarefa: "SINALIZAR EQUIPAMENTOS EX", detalhes: ["SOLICITAR LISTA DE ÁREA CLASSIFICADA"], responsavel: "JOSÉ", pendencia: "A DEFINIR", tipoDemanda: "ADEQUAÇÃO", previsaoInicio: "", previsaoFim: "", obs: "", status: "A DEFINIR", categoria: "Cadastro de Equipamentos" },
  { id: 7, tarefa: "TAGUEAMENTO F1 E F2", subtarefa: "GERAR ETIQUETAS E CONFECCIONAR", detalhes: ["IR EM LOCO INSTALAR E VERIFICAR EQUIPAMENTOS SEM TAG"], responsavel: "A DEFINIR", pendencia: "A DEFINIR", tipoDemanda: "NOVO", previsaoInicio: "", previsaoFim: "", obs: "", status: "A DEFINIR", categoria: "Tagueamento" },
  { id: 8, tarefa: "ANEXAR CERTIFICADOS", subtarefa: "IMPRIMIR CERTIFICADOS", detalhes: ["VINCULAR CERTIFICADOS AOS EQUIPAMENTOS E ANEXÁ-LOS AOS SISTEMAS"], responsavel: "BRUNA", pendencia: "A DEFINIR", tipoDemanda: "ADEQUAÇÃO", previsaoInicio: "", previsaoFim: "", obs: "", status: "A DEFINIR", categoria: "Certificado de Calibração" },
  { id: 9, tarefa: "CRIAR POP'S", subtarefa: "CRIAR PROCEDIMENTOS DE MANUTENÇÃO ELÉTRICA E INSTRUMENTAÇÃO", detalhes: [], responsavel: "A DEFINIR", pendencia: "NENHUMA", tipoDemanda: "NOVO", previsaoInicio: "", previsaoFim: "", obs: "", status: "A DEFINIR", categoria: "POP" },
  { id: 10, tarefa: "CRIAR POP'S", subtarefa: "CRIAR PROCEDIMENTOS DE MANUTENÇÃO MECÂNICA | LUBRIFICAÇÃO | PREDITIVA", detalhes: [], responsavel: "A DEFINIR", pendencia: "NENHUMA", tipoDemanda: "NOVO", previsaoInicio: "", previsaoFim: "", obs: "", status: "A DEFINIR", categoria: "POP" }
];

function normalizeActivity2(a) {
  if (!a) return a;
  var out = Object.assign({}, a);
  if (out.previsaoFim == null || out.previsaoFim === "") {
    out.previsaoFim = out.previsao || "";
  }
  if (out.previsaoInicio == null) out.previsaoInicio = "";
  if (!out.pendencia) out.pendencia = "NENHUMA";
  if (out.motivo == null) out.motivo = "";
  return out;
}

async function loadActivities2() {
  try {
    const res = await fetch(API_BASE + "/api/activities2", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length) {
        return data.map(normalizeActivity2);
      }
    }
  } catch (e) {
    console.warn("API2 offline:", e);
  }
  return JSON.parse(JSON.stringify(DEFAULT_ACTIVITIES_2));
}

async function saveActivities2ToApi(activities) {
  const payload = activities.map(function (a) {
    var n = normalizeActivity2(a);
    return {
      id: n.id,
      tarefa: n.tarefa,
      subtarefa: n.subtarefa,
      detalhes: n.detalhes || [],
      responsavel: n.responsavel,
      pendencia: n.pendencia,
      tipoDemanda: n.tipoDemanda,
      previsao: n.previsaoFim || n.previsao || "",
      previsaoInicio: n.previsaoInicio || "",
      previsaoFim: n.previsaoFim || n.previsao || "",
      obs: n.obs,
      status: n.status,
      categoria: n.categoria,
      motivo: n.motivo || ""
    };
  });
  const res = await fetch(API_BASE + "/api/activities2", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(function () { return {}; });
    throw new Error(err.error || ("Falha " + res.status));
  }
  const data = await res.json();
  return data.map(normalizeActivity2);
}
