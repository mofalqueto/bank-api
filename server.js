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

app.get('/', (req, res) => {
  res.json({
    mensagem: 'Api bank funcionando...',
    rotas: [
      'GET /teste-banco',
      'GET /transferencias',
      'POST /transferencias',
      'GET /contatos',
      'POST /contatos',
      'GET /contatos/:id'
    ]
  });
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

app.post('/transferencias', async (req, res) => {
  try {
    const { valor, numeroConta } = req.body;

    if (!valor || valor <= 0) {
      return res.status(400).json({
        erro: 'valor deve ser maior que zero'
      });
    }

    if (!numeroConta || numeroConta <= 0) {
      return res.status(400).json({
        erro: 'numeroConta deve ser maior que zero'
      });
    }

    const resultado = await pool.query(
      `insert into transferencias (valor, numero_conta)
       values ($1, $2)
       returning id, valor, numero_conta`,
      [valor, numeroConta]
    );

    res.status(201).json({
      mensagem: 'Transferência cadastrada com sucesso',
      transferencia: resultado.rows[0]
    });
  } catch (erro) {
    console.error('Erro ao cadastrar transferência:', erro);

    res.status(500).json({
      erro: 'Erro interno do servidor...'
    });
  }
});

app.get('/criar-tabela-contatos', async (req, res) => {
  try {
    await pool.query(`
      create table if not exists contatos (
        id serial primary key,
        nome varchar(100) not null,
        numero_conta integer not null
      )
    `);

    res.json({
      mensagem: 'Tabela contatos criada com sucesso'
    });
  } catch (erro) {
    console.error('Erro ao criar tabela contatos:', erro);

    res.status(500).json({
      erro: 'Erro Interno do Servidor...'
    });
  }
});

app.get('/contatos', async (req, res) => {
  try {
    const resultado = await pool.query(
      'select id, nome, numero_conta from contatos order by id desc'
    );

    res.json(resultado.rows);
  } catch (erro) {
    console.error('Erro ao buscar contatos:', erro);

    res.status(500).json({
      erro: 'Erro Interno do Servidor...'
    });
  }
});

app.post('/contatos', async (req, res) => {
  try {
    const { nome, numeroConta } = req.body;

if (!nome || nome.trim() === '') {
  return res.status(400).json({
    erro: 'nome é obrigatório'
  });
}

if (!numeroConta || numeroConta <= 0) {
  return res.status(400).json({
    erro: 'numeroConta deve ser maior que zero'
  });
}

    const resultado = await pool.query(
      `insert into contatos (nome, numero_conta)
       values ($1, $2)
       returning id, nome, numero_conta`,
     [nome.trim(), numeroConta] 
    );

    res.status(201).json({
      mensagem: 'Contato cadastrado com sucesso',
      contato: resultado.rows[0]
    });
  } catch (erro) {
    console.error('Erro ao cadastrar contato:', erro);

    res.status(500).json({
      erro: 'Erro interno do Servidor...'
    });
  }
});

app.get('/contatos/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const resultado = await pool.query(
      'select id, nome, numero_conta from contatos where id = $1',
      [id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        erro: 'Contato não encontrado'
      });
    }

    res.json(resultado.rows[0]);
  } catch (erro) {
    console.error('Erro ao buscar contato por id:', erro);

    res.status(500).json({
      erro: 'Erro interno do Servidor...'
    });
  }
});

const porta = process.env.PORT || 3000;

app.listen(porta, () => {
  console.log(`Servidor rodando na porta ${porta} ...`);
});