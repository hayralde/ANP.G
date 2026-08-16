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

app.get("/", (_req, res) => {
  res.json({ ok: true, service: "ANP Monitor API", version: "1.0" });
});

app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true, db: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

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
    obs: r.obs || "",
    status: r.status,
    categoria: r.categoria
  };
}

app.get("/api/activities", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM anp_activities ORDER BY id ASC"
    );
    res.json(rows.map(rowToActivity));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.put("/api/activities", async (req, res) => {
  const list = req.body;
  if (!Array.isArray(list)) {
    return res.status(400).json({ error: "Body deve ser um array de atividades" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const a of list) {
      await client.query(
        `INSERT INTO anp_activities
          (id, tarefa, subtarefa, detalhes, responsavel, pendencia, tipo_demanda, previsao, obs, status, categoria, updated_at)
         VALUES ($1,$2,$3,$4::jsonb,$5,$6,$7,$8,$9,$10,$11, NOW())
         ON CONFLICT (id) DO UPDATE SET
           tarefa = EXCLUDED.tarefa,
           subtarefa = EXCLUDED.subtarefa,
           detalhes = EXCLUDED.detalhes,
           responsavel = EXCLUDED.responsavel,
           pendencia = EXCLUDED.pendencia,
           tipo_demanda = EXCLUDED.tipo_demanda,
           previsao = EXCLUDED.previsao,
           obs = EXCLUDED.obs,
           status = EXCLUDED.status,
           categoria = EXCLUDED.categoria,
           updated_at = NOW()`,
        [
          a.id,
          a.tarefa,
          a.subtarefa || "",
          JSON.stringify(a.detalhes || []),
          a.responsavel || "",
          a.pendencia || "",
          a.tipoDemanda || "",
          a.previsao || "",
          a.obs || "",
          a.status || "A DEFINIR",
          a.categoria || ""
        ]
      );
    }
    await client.query("COMMIT");
    const { rows } = await client.query(
      "SELECT * FROM anp_activities ORDER BY id ASC"
    );
    res.json(rows.map(rowToActivity));
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(e);
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

app.patch("/api/activities/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const a = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE anp_activities SET
         status = COALESCE($2, status),
         responsavel = COALESCE($3, responsavel),
         pendencia = COALESCE($4, pendencia),
         tipo_demanda = COALESCE($5, tipo_demanda),
         previsao = COALESCE($6, previsao),
         obs = COALESCE($7, obs),
         updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, a.status, a.responsavel, a.pendencia, a.tipoDemanda, a.previsao, a.obs]
    );
    if (!rows.length) return res.status(404).json({ error: "Não encontrada" });
    res.json(rowToActivity(rows[0]));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log("ANP API listening on " + PORT);
});
