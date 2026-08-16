// ============================================
// ANP Monitor - Dados (API Render + PostgreSQL)
// ============================================

const STATUS_OPTIONS = ["A DEFINIR", "PARADO", "EM ANDAMENTO", "CONCLUIDO"];
const RESPONSAVEIS = ["BRUNA", "ROSE", "JOSÉ", "GESTÃO|PROCESSO", "A DEFINIR"];
const TIPOS_DEMANDA = ["ADEQUAÇÃO", "NOVO"];
const PENDENCIAS = ["PROCESSO", "GESTÃO", "SISTEMA", "MATERIAL", "DOCUMENTAÇÃO", "A DEFINIR"];

// URL da API no Render — atualize após o deploy do Web Service
const API_BASE = "https://anp-api.onrender.com";

const DEFAULT_ACTIVITIES = [
  { id: 1, tarefa: "INDICADORES KPI", subtarefa: "CRIAR PAINEL", detalhes: [], responsavel: "A DEFINIR", pendencia: "A DEFINIR", tipoDemanda: "NOVO", previsao: "", obs: "", status: "A DEFINIR", categoria: "Indicadores" },
  { id: 2, tarefa: "PLANOS DE MANUTENÇÃO", subtarefa: "CRIAR PLANOS DE ELÉTRICA E INSTRUMENTAÇÃO", detalhes: ["Mapear todas as rotas necessárias por área", "Alocar equipamentos nas rotas", "Adequar rotas existentes e criar rotas pendentes"], responsavel: "A DEFINIR", pendencia: "A DEFINIR", tipoDemanda: "ADEQUAÇÃO", previsao: "", obs: "", status: "A DEFINIR", categoria: "Manutenção" },
  { id: 3, tarefa: "PLANOS DE MANUTENÇÃO", subtarefa: "CRIAR PLANOS DE MECÂNICA | LUBRIFICAÇÃO | PREDITIVA", detalhes: ["Mapear todas as rotas necessárias por área", "Adequar rotas existentes e criar rotas pendentes", "Alocar equipamentos nas rotas"], responsavel: "A DEFINIR", pendencia: "A DEFINIR", tipoDemanda: "ADEQUAÇÃO", previsao: "", obs: "", status: "A DEFINIR", categoria: "Manutenção" },
  { id: 4, tarefa: "MATRIZ DE CRITICIDADE", subtarefa: "REVISAR CRITICIDADE F1 E DEFINIR F2", detalhes: [], responsavel: "ROSE", pendencia: "A DEFINIR", tipoDemanda: "ADEQUAÇÃO", previsao: "", obs: "", status: "A DEFINIR", categoria: "Criticidade" },
  { id: 5, tarefa: "CADASTRAR EQUIPAMENTOS F2", subtarefa: "CRIAR CADASTROS F2", detalhes: ["Sinalizar equipamentos EX", "Anexar manuais", "Inserir objeto de custo nos equipamentos"], responsavel: "GESTÃO|PROCESSO", pendencia: "A DEFINIR", tipoDemanda: "NOVO", previsao: "", obs: "", status: "A DEFINIR", categoria: "Cadastro" },
  { id: 6, tarefa: "LISTAR EQUIPAMENTOS EX", subtarefa: "SINALIZAR EQUIPAMENTOS EX", detalhes: ["Solicitar lista de área classificada"], responsavel: "JOSÉ", pendencia: "A DEFINIR", tipoDemanda: "ADEQUAÇÃO", previsao: "", obs: "", status: "A DEFINIR", categoria: "Cadastro" },
  { id: 7, tarefa: "TAGUEAMENTO F1 E F2", subtarefa: "GERAR ETIQUETAS E CONFECCIONAR", detalhes: ["Ir em loco instalar e verificar equipamentos sem TAG"], responsavel: "A DEFINIR", pendencia: "A DEFINIR", tipoDemanda: "NOVO", previsao: "", obs: "", status: "A DEFINIR", categoria: "Tagueamento" },
  { id: 8, tarefa: "ANEXAR CERTIFICADOS", subtarefa: "IMPRIMIR CERTIFICADOS", detalhes: ["Vincular certificados aos equipamentos e anexá-los aos sistemas"], responsavel: "BRUNA", pendencia: "A DEFINIR", tipoDemanda: "ADEQUAÇÃO", previsao: "", obs: "", status: "A DEFINIR", categoria: "Calibração" },
  { id: 9, tarefa: "CRIAR POP'S", subtarefa: "CRIAR PROCEDIMENTOS DE MANUTENÇÃO ELÉTRICA E INSTRUMENTAÇÃO", detalhes: [], responsavel: "A DEFINIR", pendencia: "A DEFINIR", tipoDemanda: "NOVO", previsao: "", obs: "", status: "A DEFINIR", categoria: "Procedimentos" },
  { id: 10, tarefa: "CRIAR POP'S", subtarefa: "CRIAR PROCEDIMENTOS DE MANUTENÇÃO MECÂNICA | LUBRIFICAÇÃO | PREDITIVA", detalhes: [], responsavel: "A DEFINIR", pendencia: "A DEFINIR", tipoDemanda: "NOVO", previsao: "", obs: "", status: "A DEFINIR", categoria: "Procedimentos" }
];

async function loadActivities() {
  try {
    const res = await fetch(API_BASE + "/api/activities", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length) return data;
    }
  } catch (e) {
    console.warn("API indisponível, usando fallback:", e);
  }
  return JSON.parse(JSON.stringify(DEFAULT_ACTIVITIES));
}

async function saveActivitiesToApi(activities) {
  const res = await fetch(API_BASE + "/api/activities", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(activities)
  });
  if (!res.ok) {
    const err = await res.json().catch(function () { return {}; });
    throw new Error(err.error || ("Falha ao salvar (" + res.status + ")"));
  }
  return await res.json();
}

function resetActivities() {
  return JSON.parse(JSON.stringify(DEFAULT_ACTIVITIES));
}
