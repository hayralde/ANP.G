const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

app.use(cors());
app.use(express.json({ limit: "1mb" }));

function rowToActivity(r) {
  return {
    id: r.id,
    tarefa: r.tarefa,
    subtarefa: r.subtarefa,
    detalhes: r.detalhes || [],
    responsavel: r.responsavel,
    pendencia: r.pendencia,
    tipoDemanda: r.tipo_demanda,
    previsao: r.previsao || "",
    previsaoInicio: r.previsao_inicio || "",
    previsaoFim: r.previsao || "",
    obs: r.obs || "",
    status: r.status,
    categoria: r.categoria,
    motivo: r.motivo || "",
    atrasoIgnorado: !!r.atraso_ignorado
  };
}

const SEED2 = [
  { id: 1, tarefa: "INDICADORES", subtarefa: "CRIAR PAINEL", detalhes: [], responsavel: "A DEFINIR", pendencia: "NENHUMA", tipoDemanda: "NOVO", previsao: "", previsaoInicio: "", obs: "", status: "A DEFINIR", categoria: "Indicadores KPI" },
  { id: 2, tarefa: "PLANOS DE MANUTENÇÃO", subtarefa: "CRIAR PLANOS DE ELÉTRICA E INSTRUMENTAÇÃO", detalhes: ["MAPEAR TODAS AS ROTAS NECESSÁRIAS POR ÁREA", "ALOCAR EQUIPAMENTOS NAS ROTAS", "ADEQUAR ROTAS EXISTENTES E CRIAR ROTAS PENDENTES"], responsavel: "A DEFINIR", pendencia: "A DEFINIR", tipoDemanda: "ADEQUAÇÃO", previsao: "", previsaoInicio: "", obs: "", status: "A DEFINIR", categoria: "Plano de Manutenção" },
  { id: 3, tarefa: "PLANOS DE MANUTENÇÃO", subtarefa: "CRIAR PLANOS DE MECÂNICA | LUBRIFICAÇÃO | PREDITIVA", detalhes: ["MAPEAR TODAS AS ROTAS NECESSÁRIAS POR ÁREA", "ADEQUAR ROTAS EXISTENTES E CRIAR ROTAS PENDENTES", "ALOCAR EQUIPAMENTOS NAS ROTAS"], responsavel: "A DEFINIR", pendencia: "A DEFINIR", tipoDemanda: "ADEQUAÇÃO", previsao: "", previsaoInicio: "", obs: "", status: "A DEFINIR", categoria: "Plano de Manutenção" },
  { id: 4, tarefa: "MATRIZ DE CRITICIDADE", subtarefa: "REVISAR CRITICIDADE F1 E DEFINIR F2", detalhes: [], responsavel: "ROSE", pendencia: "A DEFINIR", tipoDemanda: "ADEQUAÇÃO", previsao: "", previsaoInicio: "", obs: "", status: "A DEFINIR", categoria: "Matriz de Criticidade" },
  { id: 5, tarefa: "CADASTRAR EQUIPAMENTOS F2", subtarefa: "CRIAR CADASTROS F2", detalhes: ["SINALIZAR EQUIPAMENTOS EX", "ANEXAR MANUAIS", "INSERIR OBJETO DE CUSTO NOS EQUIPAMENTOS"], responsavel: "GESTÃO|PROCESSO", pendencia: "A DEFINIR", tipoDemanda: "NOVO", previsao: "", previsaoInicio: "", obs: "", status: "A DEFINIR", categoria: "Cadastro de Equipamentos" },
  { id: 6, tarefa: "LISTAR EQUIPAMENTOS EX", subtarefa: "SINALIZAR EQUIPAMENTOS EX", detalhes: ["SOLICITAR LISTA DE ÁREA CLASSIFICADA"], responsavel: "JOSÉ", pendencia: "A DEFINIR", tipoDemanda: "ADEQUAÇÃO", previsao: "", previsaoInicio: "", obs: "", status: "A DEFINIR", categoria: "Cadastro de Equipamentos" },
  { id: 7, tarefa: "TAGUEAMENTO F1 E F2", subtarefa: "GERAR ETIQUETAS E CONFECCIONAR", detalhes: ["IR EM LOCO INSTALAR E VERIFICAR EQUIPAMENTOS SEM TAG"], responsavel: "A DEFINIR", pendencia: "A DEFINIR", tipoDemanda: "NOVO", previsao: "", previsaoInicio: "", obs: "", status: "A DEFINIR", categoria: "Tagueamento" },
  { id: 8, tarefa: "ANEXAR CERTIFICADOS", subtarefa: "IMPRIMIR CERTIFICADOS", detalhes: ["VINCULAR CERTIFICADOS AOS EQUIPAMENTOS E ANEXÁ-LOS AOS SISTEMAS"], responsavel: "BRUNA", pendencia: "A DEFINIR", tipoDemanda: "ADEQUAÇÃO", previsao: "", previsaoInicio: "", obs: "", status: "A DEFINIR", categoria: "Certificado de Calibração" },
  { id: 9, tarefa: "CRIAR POP'S", subtarefa: "CRIAR PROCEDIMENTOS DE MANUTENÇÃO ELÉTRICA E INSTRUMENTAÇÃO", detalhes: [], responsavel: "A DEFINIR", pendencia: "NENHUMA", tipoDemanda: "NOVO", previsao: "", previsaoInicio: "", obs: "", status: "A DEFINIR", categoria: "POP" },
  { id: 10, tarefa: "CRIAR POP'S", subtarefa: "CRIAR PROCEDIMENTOS DE MANUTENÇÃO MECÂNICA | LUBRIFICAÇÃO | PREDITIVA", detalhes: [], responsavel: "A DEFINIR", pendencia: "NENHUMA", tipoDemanda: "NOVO", previsao: "", previsaoInicio: "", obs: "", status: "A DEFINIR", categoria: "POP" }
];

async function ensureTables() {
  await pool.query(`CREATE TABLE IF NOT EXISTS anp_activities (
    id INTEGER PRIMARY KEY, tarefa TEXT, subtarefa TEXT, detalhes JSONB DEFAULT '[]',
    responsavel TEXT, pendencia TEXT, tipo_demanda TEXT, previsao TEXT, obs TEXT, status TEXT, categoria TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW())`);
  await pool.query(`CREATE TABLE IF NOT EXISTS anp_activities_2 (
    id INTEGER PRIMARY KEY, tarefa TEXT, subtarefa TEXT, detalhes JSONB DEFAULT '[]',
    responsavel TEXT, pendencia TEXT, tipo_demanda TEXT, previsao TEXT, previsao_inicio TEXT DEFAULT '',
    obs TEXT, status TEXT, categoria TEXT, updated_at TIMESTAMPTZ DEFAULT NOW())`);
  try {
    await pool.query(`ALTER TABLE anp_activities_2 ADD COLUMN IF NOT EXISTS previsao_inicio TEXT DEFAULT ''`);
  } catch (e) {
    console.warn("alter previsao_inicio", e.message);
  }
  try {
    await pool.query(`ALTER TABLE anp_activities_2 ADD COLUMN IF NOT EXISTS motivo TEXT DEFAULT ''`);
  } catch (e) {
    console.warn("alter motivo", e.message);
  }
  try {
    await pool.query(`ALTER TABLE anp_activities_2 ADD COLUMN IF NOT EXISTS atraso_ignorado BOOLEAN DEFAULT FALSE`);
  } catch (e) {
    console.warn("alter atraso_ignorado", e.message);
  }
  const { rows } = await pool.query("SELECT COUNT(*)::int AS n FROM anp_activities_2");
  if (rows[0].n === 0) {
    for (const a of SEED2) {
      await pool.query(
        `INSERT INTO anp_activities_2 (id,tarefa,subtarefa,detalhes,responsavel,pendencia,tipo_demanda,previsao,previsao_inicio,obs,status,categoria,motivo,atraso_ignorado)
         VALUES ($1,$2,$3,$4::jsonb,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) ON CONFLICT (id) DO NOTHING`,
        [a.id, a.tarefa, a.subtarefa, JSON.stringify(a.detalhes), a.responsavel, a.pendencia, a.tipoDemanda, a.previsao || "", a.previsaoInicio || "", a.obs, a.status, a.categoria, a.motivo || "", false]
      );
    }
    console.log("Seeded anp_activities_2");
  }
}

app.get("/", (_req, res) => res.json({ ok: true, service: "ANP Monitor API", version: "1.2" }));
app.get("/health", async (_req, res) => {
  try { await pool.query("SELECT 1"); res.json({ ok: true, db: true }); }
  catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.get("/api/activities", async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM anp_activities ORDER BY id ASC");
    res.json(rows.map(rowToActivity));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put("/api/activities", async (req, res) => {
  const list = req.body;
  if (!Array.isArray(list)) return res.status(400).json({ error: "Body deve ser array" });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const ids = list.map((a) => a.id).filter(Boolean);
    if (ids.length) await client.query("DELETE FROM anp_activities WHERE id <> ALL($1::int[])", [ids]);
    else await client.query("DELETE FROM anp_activities");
    for (const a of list) {
      await client.query(
        `INSERT INTO anp_activities (id,tarefa,subtarefa,detalhes,responsavel,pendencia,tipo_demanda,previsao,obs,status,categoria,updated_at)
         VALUES ($1,$2,$3,$4::jsonb,$5,$6,$7,$8,$9,$10,$11,NOW())
         ON CONFLICT (id) DO UPDATE SET tarefa=EXCLUDED.tarefa,subtarefa=EXCLUDED.subtarefa,detalhes=EXCLUDED.detalhes,
           responsavel=EXCLUDED.responsavel,pendencia=EXCLUDED.pendencia,tipo_demanda=EXCLUDED.tipo_demanda,
           previsao=EXCLUDED.previsao,obs=EXCLUDED.obs,status=EXCLUDED.status,categoria=EXCLUDED.categoria,updated_at=NOW()`,
        [a.id, a.tarefa, a.subtarefa||"", JSON.stringify(a.detalhes||[]), a.responsavel||"", a.pendencia||"", a.tipoDemanda||"", a.previsao||"", a.obs||"", a.status||"A DEFINIR", a.categoria||""]
      );
    }
    await client.query("COMMIT");
    const { rows } = await client.query("SELECT * FROM anp_activities ORDER BY id ASC");
    res.json(rows.map(rowToActivity));
  } catch (e) { await client.query("ROLLBACK"); res.status(500).json({ error: e.message }); }
  finally { client.release(); }
});

app.get("/api/activities2", async (_req, res) => {
  try {
    await ensureTables();
    const { rows } = await pool.query("SELECT * FROM anp_activities_2 ORDER BY id ASC");
    res.json(rows.map(rowToActivity));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put("/api/activities2", async (req, res) => {
  const list = req.body;
  if (!Array.isArray(list)) return res.status(400).json({ error: "Body deve ser array" });
  const client = await pool.connect();
  try {
    await ensureTables();
    await client.query("BEGIN");
    const ids = list.map((a) => a.id).filter(Boolean);
    if (ids.length) await client.query("DELETE FROM anp_activities_2 WHERE id <> ALL($1::int[])", [ids]);
    else await client.query("DELETE FROM anp_activities_2");
    for (const a of list) {
      const fim = a.previsaoFim || a.previsao || "";
      const ini = a.previsaoInicio || "";
      await client.query(
        `INSERT INTO anp_activities_2 (id,tarefa,subtarefa,detalhes,responsavel,pendencia,tipo_demanda,previsao,previsao_inicio,obs,status,categoria,motivo,atraso_ignorado,updated_at)
         VALUES ($1,$2,$3,$4::jsonb,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,NOW())
         ON CONFLICT (id) DO UPDATE SET tarefa=EXCLUDED.tarefa,subtarefa=EXCLUDED.subtarefa,detalhes=EXCLUDED.detalhes,
           responsavel=EXCLUDED.responsavel,pendencia=EXCLUDED.pendencia,tipo_demanda=EXCLUDED.tipo_demanda,
           previsao=EXCLUDED.previsao,previsao_inicio=EXCLUDED.previsao_inicio,obs=EXCLUDED.obs,status=EXCLUDED.status,categoria=EXCLUDED.categoria,motivo=EXCLUDED.motivo,atraso_ignorado=EXCLUDED.atraso_ignorado,updated_at=NOW()`,
        [a.id, a.tarefa, a.subtarefa||"", JSON.stringify(a.detalhes||[]), a.responsavel||"", a.pendencia||"", a.tipoDemanda||"", fim, ini, a.obs||"", a.status||"A DEFINIR", a.categoria||"", a.motivo||"", !!a.atrasoIgnorado]
      );
    }
    await client.query("COMMIT");
    const { rows } = await client.query("SELECT * FROM anp_activities_2 ORDER BY id ASC");
    res.json(rows.map(rowToActivity));
  } catch (e) { await client.query("ROLLBACK"); res.status(500).json({ error: e.message }); }
  finally { client.release(); }
});

ensureTables().catch((e) => console.error("ensureTables", e));
app.listen(PORT, () => console.log("ANP API listening on " + PORT));
