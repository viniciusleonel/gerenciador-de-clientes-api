// Importar o Express e o Body-parser
const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const cors = require('cors');

// Inicializar o Express
const app = express();

app.use(cors()); // Configuração básica para permitir solicitações de todos os origens

// Configurar o Body-parser para processar requisições JSON
app.use(bodyParser.json());

// Configuração do banco de dados PostgreSQL
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'gerenciamento_clientes',
  password: 'root',
  port: 5432,
});

// Rotas e lógica do servidor

// Rota para listar clientes
app.get('/clientes', async (req, res) => {
  try {
    // Executar a consulta SQL para buscar todos os clientes
    const query = 'SELECT * FROM clientes';
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    res.status(500).send('Erro interno do servidor');
  }
});

// Rota para cadastrar clientes
app.post('/clientes', async (req, res) => {
  const { nome, email, telefone, coordenada_x, coordenada_y } = req.body;
  try {
    // Executar a consulta SQL para inserir um novo cliente
    const query = 'INSERT INTO clientes (nome, email, telefone, coordenada_x, coordenada_y) VALUES ($1, $2, $3, $4, $5)';
    await pool.query(query, [nome, email, telefone, coordenada_x, coordenada_y]);
    res.status(201).send('Cliente cadastrado com sucesso!');
  } catch (error) {
    console.error('Erro ao cadastrar cliente:', error);
    res.status(500).send('Erro interno do servidor');
  }
});


// Rota para atualizar cliente
app.put('/clientes/:id', async (req, res) => {
  const id = req.params.id;
  const { nome, email, telefone, coordenada_x, coordenada_y } = req.body;
  try {
    // Executar a consulta SQL para atualizar o cliente com o ID especificado
    const query = 'UPDATE clientes SET nome = $1, email = $2, telefone = $3, coordenada_x = $4, coordenada_y = $5 WHERE id = $6';
    await pool.query(query, [nome, email, telefone, coordenada_x, coordenada_y, id]);
    res.send(`Cliente com ID ${id} atualizado com sucesso!`);
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    res.status(500).send('Erro interno do servidor');
  }
});


// Rota para deletar cliente
app.delete('/clientes/:id', async (req, res) => {
  const id = req.params.id;
  try {
    // Executar a consulta SQL para deletar o cliente com o ID especificado
    const query = 'DELETE FROM clientes WHERE id = $1';
    await pool.query(query, [id]);
    res.send(`Cliente com ID ${id} deletado com sucesso!`);
  } catch (error) {
    console.error('Erro ao deletar cliente:', error);
    res.status(500).send('Erro interno do servidor');
  }
});

// Rota para listar um cliente específico
app.get('/clientes/:id', async (req, res) => {
  const id = req.params.id;
  try {
    // Executar a consulta SQL para buscar o cliente com o ID especificado
    const query = 'SELECT * FROM clientes WHERE id = $1';
    const result = await pool.query(query, [id]);
    
    // Verifica se o cliente foi encontrado
    if (result.rowCount === 0) {
      // Se o cliente não for encontrado, retorna um status 404 (Not Found)
      res.status(404).send('Cliente não encontrado');
    } else {
      // Se o cliente for encontrado, retorna os dados do cliente
      res.json(result.rows[0]);
    }
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    res.status(500).send('Erro interno do servidor');
  }
});

// Função para calcular a distância entre dois pontos
function calcularDistancia(ponto1, ponto2) {
  return Math.sqrt(Math.pow((ponto2.coordenada_x - ponto1.coordenada_x), 2) + Math.pow((ponto2.coordenada_y - ponto1.coordenada_y), 2));
}

// Função para calcular a rota mais curta usando força bruta
function calcularRotaMaisCurta(clientes) {
  let menorDistancia = Infinity;
  let melhorRota = [];

  function permutar(array, inicio = 0) {
      if (inicio === array.length - 1) {
          let distanciaTotal = 0;
          for (let i = 0; i < array.length - 1; i++) {
              distanciaTotal += calcularDistancia(array[i], array[i + 1]);
          }
          distanciaTotal += calcularDistancia(array[array.length - 1], array[0]); // voltando para o início
          if (distanciaTotal < menorDistancia) {
              menorDistancia = distanciaTotal;
              melhorRota = array.slice();
          }
      } else {
          for (let i = inicio; i < array.length; i++) {
              [array[inicio], array[i]] = [array[i], array[inicio]];
              permutar(array, inicio + 1);
              [array[inicio], array[i]] = [array[i], array[inicio]];
          }
      }
  }

  permutar(clientes);

  return { rota: melhorRota, distancia: menorDistancia };
}

// Rota para calcular a rota mais curta
app.get('/calcular-rota', async (req, res) => {
try {
  // Executar a consulta SQL para buscar todos os clientes
  const query = 'SELECT * FROM clientes';
  const result = await pool.query(query);
  const clientes = result.rows;

  // Calcular a rota mais curta
  const rotaCalculada = calcularRotaMaisCurta(clientes);
  
  // Retornar a rota calculada como resposta da API
  res.json(rotaCalculada);
} catch (error) {
  console.error('Erro ao calcular a rota:', error);
  res.status(500).send('Erro interno do servidor');
}
});

// Iniciar o servidor
const port = 3001; // Porta alterada para 3001
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
