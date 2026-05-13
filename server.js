const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

app.get("/", (req, res) => {
  res.send("api bank funcionando");
});

app.get("/teste-banco", async (req, res) => {
  try {
    const resultado = await pool.query("select now()");

    res.json({
      mensagem: "Conexão com o banco realizada com sucesso",
      dataHoraBanco: resultado.rows[0].now,
    });
  } catch (erro) {
    console.error("Erro ao conectar com o banco:", erro);

    res.status(500).json({
      erro: "Erro interno do servidor...",
    });
  }
});

app.get("/criar-tabela-transferencias", async (req, res) => {
  try {
    await pool.query(`
      create table if not exists transferencias (
        id serial primary key,
        valor numeric(10,2) not null,
        numero_conta integer not null
      )
    `);

    res.json({
      mensagem: "Tabela transferencias criada com sucesso",
    });
  } catch (erro) {
    console.error("Erro ao criar tabela:", erro);

    res.status(500).json({
      erro: "Erro ao criar tabela transferencias",
    });
  }
});

app.get("/transferencias", async (req, res) => {
  try {
    const resultado = await pool.query(
      "select id, valor, numero_conta from transferencias order by id desc",
    );

    res.json(resultado.rows);
  } catch (erro) {
    console.error("erro ao buscar transferências:", erro);

    res.status(500).json({
      erro: "Erro Interno do servidor...",
    });
  }
});

app.post("/transferencias", async (req, res) => {
  try {
    const { valor, numeroConta } = req.body;

    if (!valor || !numeroConta) {
      return res.status(400).json({
        erro: "valor e numeroConta são obrigatórios",
      });
    }

    const resultado = await pool.query(
      `insert into transferencias (valor, numero_conta)
       values ($1, $2)
       returning id, valor, numero_conta`,
      [valor, numeroConta],
    );

    res.status(201).json({
      mensagem: "Transferência cadastrada com sucesso",
      transferencia: resultado.rows[0],
    });
  } catch (erro) {
    console.error("Erro ao cadastrar Transferência:", erro);

    res.status(500).json({
      erro: "Erro Interno do Servidor...",
    });
  }
});

const porta = process.env.PORT || 3000;

app.listen(porta, () => {
  console.log(`Servidor rodando na porta ${porta} ...`);
});