const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());
app.use(express.json()); 
app.use(cors());

const JWT_SECRET = process.env.JWT_SECRET;

// Configuração do banco de dados
const db = mysql.createConnection({
    host: 'mysql.4patas.kinghost.net',
    user: '4patas',      
    password: 'Renan1502',      
    database: '4patas'
});

// Conectando ao banco de dados
db.connect((err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
        return;
    }
    console.log('Conectado ao banco de dados MySQL');
});

// Middleware de autenticação para proteger rotas
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(401).send({ message: 'Token não fornecido' });
    }

    // Verifica o token
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'Token inválido' });
        }
        req.userId = decoded.id; 
        next();
    });
};

// Configuração do multer para armazenar arquivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'src/images/pets'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9); 
        cb(null, uniqueSuffix + path.extname(file.originalname)); 
    }
});

const upload = multer({
    limits: { fileSize: 2 * 1024 * 1024 } 
}).single('imagem');

// Rota para adicionar um novo animal (protegida)
app.post('/animais', verifyToken, (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            console.error("Erro no upload da imagem:", err);
            return res.status(500).send({ message: 'Erro no upload da imagem.' });
        }
        if (!req.file) {
            return res.status(400).send({ message: 'Imagem não enviada. Por favor, selecione uma imagem.' });
        }
        const { nome, idade, especie, raca, descricao, idUsuario, porte, sexo } = req.body;
        const imagemData = req.file.buffer;
        const query = 'INSERT INTO Animal (nome, idade, especie, raca, descricao, idUsuario, porte, sexo, imagem, dataCriacao) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        
        db.query(query, [nome, idade, especie, raca, descricao, idUsuario, porte, sexo, imagemData, new Date().toISOString().slice(0, 10)], (err, result) => {
            if (err) {
                console.error("Erro ao salvar no banco de dados:", err);
                return res.status(500).send({ message: 'Erro ao adicionar o animal no banco de dados.' });
            }
            res.status(201).send({ message: 'Animal adicionado com sucesso!' });
        });
    });
});

// Rota esqueci minha senha
app.post('/esqueci-minha-senha', async (req, res) => { 
    const { email } = req.body;
    console.log('Corpo da requisição:', req.body); 
    console.log('E-mail recebido:', email); 

    const query = 'SELECT * FROM Usuario WHERE email = ?';
    db.query(query, [email], (err, result) => {
        if (err) {
            console.error('Erro ao consultar o banco de dados:', err); 
            return res.status(500).send(err);
        }
        console.log('Resultado da consulta:', result); 

        if (result.length === 0) {
            return res.status(404).send({ message: 'Usuário não encontrado' });
        }

        const user = result[0];
        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1h' });

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Redefinição de Senha',
            text: `Clique no link para redefinir sua senha: https://4patas.github.io/${token}`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Erro ao enviar e-mail:', error);
                return res.status(500).send({ message: 'Erro ao enviar e-mail' });
            }
            res.status(200).send({ message: 'E-mail de redefinição de senha enviado!' });
        });
    });
});


// Endpoint para redefinir a senha
app.post('/redefinir-senha', async (req, res) => {
    const { token, novaSenha } = req.body;

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const hashedPassword = await bcrypt.hash(novaSenha, 10);

        const query = 'UPDATE Usuario SET senha = ? WHERE id = ?';
        db.query(query, [hashedPassword, decoded.id], (err) => {
            if (err) {
                return res.status(500).send(err);
            }
            res.status(200).send({ message: 'Senha redefinida com sucesso!' });
        });
    } catch (error) {
        res.status(400).send({ message: 'Token inválido ou expirado.' });
    }
});


// Registro de novo usuário
app.post('/register', async (req, res) => {
    const { nome, email, senha, tipo, endereco, telefone, cidade } = req.body;

    if (!senha) {
        return res.status(400).send({ message: 'Senha não fornecida' });
    }

    try {
        const hashedPassword = await bcrypt.hash(senha, 10);
        const query = 'INSERT INTO Usuario (nome, email, senha, tipo, endereco, telefone, cidade) VALUES (?, ?, ?, ?, ?, ?, ?)';
        db.query(query, [nome, email, hashedPassword, tipo, endereco, telefone, cidade], (err, result) => {
            if (err) {
                return res.status(500).send(err);
            }
            res.status(201).send({ message: 'Usuário registrado com sucesso!' });
        });
    } catch (error) {
        res.status(500).send({ message: 'Erro ao registrar o usuário', error });
    }
});

// Login de usuário
app.post('/login', (req, res) => {
    const { email, senha } = req.body;

    const query = 'SELECT * FROM Usuario WHERE email = ?';
    db.query(query, [email], async (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        if (result.length === 0) {
            return res.status(404).send({ message: 'Usuário não encontrado' });
        }

        const user = result[0];
        const isMatch = await bcrypt.compare(senha, user.senha);
        
        if (!isMatch) {
            return res.status(401).send({ message: 'Senha incorreta' });
        }

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
        const userId = user.id;
        const userName = user.nome;
        res.status(200).send({ token, userId, userName});
    });
});

// Rota protegida - Listar usuários
app.get('/usuarios', verifyToken, (req, res) => {
    const query = 'SELECT * FROM Usuario';
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.status(200).json(results);
    });
});

//Obter um usuário específico por ID
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

// Rota protegida - Obter dados do usuário autenticado
app.get('/meusdados', verifyToken, (req, res) => {
    const userId = req.userId;

    const query = 'SELECT * FROM Usuario WHERE id = ?';
    db.query(query, [userId], (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        if (result.length === 0) {
            return res.status(404).send({ message: 'Usuário não encontrado' });
        }
        res.status(200).json(result[0]);
    });
});

// Rota para listar animais
app.get('/animais', (req, res) => {
    const query = 'SELECT id, nome, idade, especie, raca, descricao, idUsuario, porte, sexo, imagem, dataCriacao FROM Animal';

    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        const animaisComImagens = results.map(animal => {
            return {
                ...animal,
                imagem: animal.imagem ? Buffer.from(animal.imagem).toString('base64') : null
            };
        });
        res.status(200).json(animaisComImagens);
    });
});

// Endpoint para buscar animais de um usuário específico
app.get('/animais/usuario/:idUsuario', verifyToken, (req, res) => {
    const { idUsuario } = req.params;
    
    const query = 'SELECT * FROM Animal WHERE idUsuario = ?';
    db.query(query, [idUsuario], (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        const animalsWithBase64Images = results.map(animal => {
            if (animal.imagem) {
                animal.imagem = animal.imagem.toString('base64');
            }
            return animal;
        });

        res.status(200).json(animalsWithBase64Images);
    });
});

// Rota para atualizar um animal (protegida)
app.put('/animais/:id', verifyToken, (req, res) => {
    const { id } = req.params;
    const { nome, idade, especie, raca, descricao, idUsuario, porte, sexo, imagem, dataCriacao } = req.body;

    const query = 'UPDATE Animal SET nome = ?, idade = ?, especie = ?, raca = ?, descricao = ?, idUsuario = ?, porte = ?, sexo = ?, imagem = ?, dataCriacao = ? WHERE id = ?';
    db.query(query, [nome, idade, especie, raca, descricao, idUsuario, porte, sexo, imagem, dataCriacao, id], (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.status(200).send({ message: 'Animal atualizado com sucesso!' });
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

// Rota para deletar um animal (protegida)
app.delete('/animais/:id', verifyToken, (req, res) => {
    const { id } = req.params;

    const query = 'DELETE FROM Animal WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.status(200).send({ message: 'Animal deletado com sucesso!' });
    });
});

// Rota para atualizar o perfil do usuário autenticado
app.put('/user/profile', verifyToken, (req, res) => { 
    const userId = req.userId;
    const { nome, email, cidade, telefone } = req.body;

    if (!nome || !email || !cidade || !telefone) {
        return res.status(400).send({ message: 'Todos os campos são obrigatórios.' });
    }
    const query = 'UPDATE Usuario SET nome = ?, email = ?, cidade = ?, telefone = ? WHERE id = ?';
    db.query(query, [nome, email, cidade, telefone, userId], (err, result) => {
        if (err) {
            return res.status(500).send({ message: 'Erro ao atualizar perfil' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).send({ message: 'Usuário não encontrado' });
        }
        res.status(200).json({ nome, email, cidade, telefone });
    });
});

// Rota para excluir conta de usuário
app.delete('/user/delete', verifyToken, (req, res) => {
    const userId = req.userId; // Obtém o ID do usuário autenticado
    const query = 'DELETE FROM Usuario WHERE id = ?';
    db.query(query, [userId], (err, result) => {
        if (err) {
            return res.status(500).send({ message: 'Erro ao excluir conta' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).send({ message: 'Usuário não encontrado' });
        }
        res.status(200).send({ message: 'Conta excluída com sucesso!' });
    });
});

// Endpoint para obter o perfil do usuário autenticado
app.get('/user/profile', verifyToken, (req, res) => {
    const userId = req.userId;
    const query = 'SELECT id, nome, email, cidade, telefone FROM Usuario WHERE id = ?';
    
    db.query(query, [userId], (err, result) => {
        if (err) {
            return res.status(500).send({ message: 'Erro ao buscar dados do usuário' });
        }
        if (result.length === 0) {
            return res.status(404).send({ message: 'Usuário não encontrado' });
        }
        res.status(200).json(result[0]);
    });
});

// Iniciar o servidor
const PORT = 21072;
// const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
