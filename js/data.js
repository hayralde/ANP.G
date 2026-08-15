// Dados padrão extraídos da planilha PLANO DE AÇÃO ANP
// Status possíveis: PARADO | EM ANDAMENTO | CONCLUIDO | A DEFINIR

const DEFAULT_ACTIVITIES = [
  {
    id: 1,
    tarefa: "INDICADORES KPI",
    subtarefa: "CRIAR PAINEL",
    detalhes: [],
    responsavel: "A DEFINIR",
    pendencia: "A DEFINIR",
    tipoDemanda: "NOVO",
    previsao: "",
    obs: "",
    status: "A DEFINIR",
    categoria: "Indicadores"
  },
  {
    id: 2,
    tarefa: "PLANOS DE MANUTENÇÃO",
    subtarefa: "CRIAR PLANOS DE ELÉTRICA E INSTRUMENTAÇÃO",
    detalhes: [
      "Mapear todas as rotas necessárias por área",
      "Alocar equipamentos nas rotas",
      "Adequar rotas existentes e criar rotas pendentes"
    ],
    responsavel: "A DEFINIR",
    pendencia: "A DEFINIR",
    tipoDemanda: "ADEQUAÇÃO",
    previsao: "",
    obs: "",
    status: "A DEFINIR",
    categoria: "Manutenção"
  },
  {
    id: 3,
    tarefa: "PLANOS DE MANUTENÇÃO",
    subtarefa: "CRIAR PLANOS DE MECÂNICA | LUBRIFICAÇÃO | PREDITIVA",
    detalhes: [
      "Mapear todas as rotas necessárias por área",
      "Adequar rotas existentes e criar rotas pendentes",
      "Alocar equipamentos nas rotas"
    ],
    responsavel: "A DEFINIR",
    pendencia: "A DEFINIR",
    tipoDemanda: "ADEQUAÇÃO",
    previsao: "",
    obs: "",
    status: "A DEFINIR",
    categoria: "Manutenção"
  },
  {
    id: 4,
    tarefa: "MATRIZ DE CRITICIDADE",
    subtarefa: "REVISAR CRITICIDADE F1 E DEFINIR F2",
    detalhes: [],
    responsavel: "ROSE",
    pendencia: "A DEFINIR",
    tipoDemanda: "ADEQUAÇÃO",
    previsao: "",
    obs: "",
    status: "A DEFINIR",
    categoria: "Criticidade"
  },
  {
    id: 5,
    tarefa: "CADASTRAR EQUIPAMENTOS F2",
    subtarefa: "CRIAR CADASTROS F2",
    detalhes: [
      "Sinalizar equipamentos EX",
      "Anexar manuais",
      "Inserir objeto de custo nos equipamentos"
    ],
    responsavel: "GESTÃO|PROCESSO",
    pendencia: "A DEFINIR",
    tipoDemanda: "NOVO",
    previsao: "",
    obs: "",
    status: "A DEFINIR",
    categoria: "Cadastro"
  },
  {
    id: 6,
    tarefa: "LISTAR EQUIPAMENTOS EX",
    subtarefa: "SINALIZAR EQUIPAMENTOS EX",
    detalhes: [
      "Solicitar lista de área classificada"
    ],
    responsavel: "JOSÉ",
    pendencia: "A DEFINIR",
    tipoDemanda: "ADEQUAÇÃO",
    previsao: "",
    obs: "",
    status: "A DEFINIR",
    categoria: "Cadastro"
  },
  {
    id: 7,
    tarefa: "TAGUEAMENTO F1 E F2",
    subtarefa: "GERAR ETIQUETAS E CONFECCIONAR",
    detalhes: [
      "Ir em loco instalar e verificar equipamentos sem TAG"
    ],
    responsavel: "A DEFINIR",
    pendencia: "A DEFINIR",
    tipoDemanda: "NOVO",
    previsao: "",
    obs: "",
    status: "A DEFINIR",
    categoria: "Tagueamento"
  },
  {
    id: 8,
    tarefa: "ANEXAR CERTIFICADOS",
    subtarefa: "IMPRIMIR CERTIFICADOS",
    detalhes: [
      "Vincular certificados aos equipamentos e anexá-los aos sistemas"
    ],
    responsavel: "BRUNA",
    pendencia: "A DEFINIR",
    tipoDemanda: "ADEQUAÇÃO",
    previsao: "",
    obs: "",
    status: "A DEFINIR",
    categoria: "Calibração"
  },
  {
    id: 9,
    tarefa: "CRIAR POP'S",
    subtarefa: "CRIAR PROCEDIMENTOS DE MANUTENÇÃO ELÉTRICA E INSTRUMENTAÇÃO",
    detalhes: [],
    responsavel: "A DEFINIR",
    pendencia: "A DEFINIR",
    tipoDemanda: "NOVO",
    previsao: "",
    obs: "",
    status: "A DEFINIR",
    categoria: "Procedimentos"
  },
  {
    id: 10,
    tarefa: "CRIAR POP'S",
    subtarefa: "CRIAR PROCEDIMENTOS DE MANUTENÇÃO MECÂNICA | LUBRIFICAÇÃO | PREDITIVA",
    detalhes: [],
    responsavel: "A DEFINIR",
    pendencia: "A DEFINIR",
    tipoDemanda: "NOVO",
    previsao: "",
    obs: "",
    status: "A DEFINIR",
    categoria: "Procedimentos"
  }
];

const STATUS_OPTIONS = ["A DEFINIR", "PARADO", "EM ANDAMENTO", "CONCLUIDO"];
const RESPONSAVEIS = ["BRUNA", "ROSE", "JOSÉ", "GESTÃO|PROCESSO", "A DEFINIR"];
const TIPOS_DEMANDA = ["ADEQUAÇÃO", "NOVO"];
const PENDENCIAS = ["PROCESSO", "GESTÃO", "SISTEMA", "MATERIAL", "DOCUMENTAÇÃO", "A DEFINIR"];

// Carrega dados do localStorage ou usa o padrão
function loadActivities() {
  try {
    const saved = localStorage.getItem("anp_activities");
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn("Erro ao carregar dados salvos:", e);
  }
  return JSON.parse(JSON.stringify(DEFAULT_ACTIVITIES));
}

function saveActivities(activities) {
  localStorage.setItem("anp_activities", JSON.stringify(activities));
}

function resetActivities() {
  localStorage.removeItem("anp_activities");
  return JSON.parse(JSON.stringify(DEFAULT_ACTIVITIES));
}
