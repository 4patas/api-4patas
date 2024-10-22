const mailer = require("nodemailer");

module.exports = (email, name, phone, mensagem, anexo) => {
  const smtpTransport = mailer.createTransport({
    host: 'smtp.umbler.com',
    port: 587,
    secure: false, //SSL/TLS
    auth: {
      user: 'contato@bott.digital',
      pass: 'Bott123@'
    }
  })

  const mail = {
    from: "Bott Digital <contato@bott.digital>",
    to: `${'contato@bott.digital'}`,
    subject: `${name} te enviou uma mensagem`,
    text: `${phone} ${email}  | ${mensagem}`,
    //html: "<b>Opcionalmente, pode enviar como HTML</b>"
  }

  if (anexo) {
    console.log(anexo);
    mail.attachments = [];
    mail.attachments.push({
      filename: anexo.originalname,
      content: anexo.buffer
    })
  }

  return new Promise((resolve, reject) => {
    smtpTransport.sendMail(mail)
      .then(response => {
        smtpTransport.close();
        return resolve(response);
      })
      .catch(error => {
        smtpTransport.close();
        return reject(error);
      });
  })
}