const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Configuração da conexão com o banco de dados
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',  // Substitua pelo seu usuário do MySQL
    password: '',  // Substitua pela sua senha do MySQL
    database: 'SistemaAdocao'
});

db.connect((err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
        return;
    }
    console.log('Conectado ao banco de dados MySQL');
});

// Rotas CRUD

// CREATE - Adicionar um novo usuário
app.post('/usuarios', (req, res) => {
    const { nome, email, senha, tipo, endereco, telefone, cidade } = req.body;
    
    // Atualizando a query para incluir os novos campos
    const query = 'INSERT INTO Usuario (nome, email, senha, tipo, endereco, telefone, cidade) VALUES (?, ?, ?, ?, ?, ?, ?)';
    
    // Enviando todos os dados necessários para a inserção
    db.query(query, [nome, email, senha, tipo, endereco, telefone, cidade], (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.status(201).send({ message: 'Usuário criado com sucesso!', id: result.insertId });
    });
});


// READ - Listar todos os usuários
app.get('/usuarios', (req, res) => {
    const query = 'SELECT * FROM Usuario';
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.status(200).json(results);
    });
});

// READ - Obter um usuário específico por ID
app.get('/usuarios/:id', (req, res) => {
    const { id } = req.params;
    const query = 'SELECT * FROM Usuario WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        if (result.length === 0) {
            return res.status(404).send({ message: 'Usuário não encontrado' });
        }
        res.status(200).json(result[0]);
    });
});

// UPDATE - Atualizar um usuário
app.put('/usuarios/:id', (req, res) => {
    const { id } = req.params;
    const { nome, email, senha, tipo, endereco, telefone, cidade } = req.body;
    
    // Atualizando a query para incluir os novos campos
    const query = 'UPDATE Usuario SET nome = ?, email = ?, senha = ?, tipo = ?, endereco = ?, telefone = ?, cidade = ? WHERE id = ?';
    
    // Enviando todos os dados necessários para a atualização
    db.query(query, [nome, email, senha, tipo, endereco, telefone, cidade, id], (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        if (result.affectedRows === 0) {
            return res.status(404).send({ message: 'Usuário não encontrado' });
        }
        res.status(200).send({ message: 'Usuário atualizado com sucesso!' });
    });
});

// DELETE - Deletar um usuário
app.delete('/usuarios/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM Usuario WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        if (result.affectedRows === 0) {
            return res.status(404).send({ message: 'Usuário não encontrado' });
        }
        res.status(200).send({ message: 'Usuário deletado com sucesso!' });
    });
});

// CRUD para Animais

// CREATE - Adicionar um novo animal
app.post('/animais', (req, res) => {
    const { nome, idade, especie, raca, descricao, idUsuario, porte, sexo, imagem, dataCriacao } = req.body;

    const sql = 'INSERT INTO Animal (nome, idade, especie, raca, descricao, idUsuario, porte, sexo, imagem, dataCriacao) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const values = [nome, idade, especie, raca, descricao, idUsuario, porte, sexo, imagem, dataCriacao];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Erro ao adicionar o animal:', err);
            return res.status(500).json({ message: 'Erro ao adicionar o animal.' });
        }
        res.status(201).json({ message: 'Animal adicionado com sucesso!', id: result.insertId });
    });
});


// UPDATE - Atualizar um animal
app.put('/animais/:id', (req, res) => {
    const { id } = req.params;
    const { nome, idade, especie, raca, descricao, idUsuario, porte, sexo, imagem, dataCriacao } = req.body;

    const query = 'UPDATE Animal SET nome = ?, idade = ?, especie = ?, raca = ?, descricao = ?, idUsuario = ?, porte = ?, sexo = ?, imagem = ?, dataCriacao = ? WHERE id = ?';
    
    db.query(query, [nome, idade, especie, raca, descricao, idUsuario, porte, sexo, imagem, dataCriacao, id], (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        if (result.affectedRows === 0) {
            return res.status(404).send({ message: 'Animal não encontrado' });
        }
        res.status(200).send({ message: 'Animal atualizado com sucesso!' });
    });
});

// READ - Listar todos os animais
app.get('/animais', (req, res) => {
    const query = 'SELECT * FROM Animal';
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.status(200).json(results);
    });
});

app.get('/animais/:id', (req, res) => {
  const { id } = req.params;
  const query = 'SELECT * FROM Animal WHERE id = ?';
  db.query(query, [id], (err, result) => {
      if (err) {
          return res.status(500).send(err);
      }
      if (result.length === 0) {
          return res.status(404).send({ message: 'Animal não encontrado' });
      }
      res.status(200).json(result[0]);
  });
});


// DELETE - Deletar um animal
app.delete('/animais/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM Animal WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        if (result.affectedRows === 0) {
            return res.status(404).send({ message: 'Animal não encontrado' });
        }
        res.status(200).send({ message: 'Animal deletado com sucesso!' });
    });
});

// Iniciando o servidor
const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
