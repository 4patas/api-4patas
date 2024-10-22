const http = require('http');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');

app.use(cors());

app.use(require("cors")());

var corsOptions = {
  origin: 'https://bott.digital',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

app.use(bodyParser.json());


const upload = require("multer")();
app.post('/send', cors(corsOptions), upload.single('anexo'), (req, res, next) => {
  const name = req.body.name;
  const email = req.body.email;
  const phone = req.body.phone;
  const mensagem = req.body.mensagem;
  const anexo = req.file;
  require("./nodemail")(email, name, phone, mensagem, anexo)
    .then(response => res.json(response))
    .catch(error => res.json(error));
})

app.get('/', (req, res) => {
  const html = `
    <html>
      <head>
        <style>
          body {
            padding: 30px;
          }
        </style>
      </head>
      <body>
        <h1>⊂◉‿◉つ</h1>
        <p> Eu sou uma API :D </p>

      </body>
    </html>
  `
  res.send(html)
})

const server = http.createServer(app);
server.listen(3000);
console.log("Servidor escutando na porta 3000 que saco mano...")

