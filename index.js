require('dotenv').config()
const express = require('express')
const cons = require('consolidate')
const BetaGouv = require('./betagouv')
const Promise = require('bluebird')
const bodyParser = require('body-parser')
const jwt = require('jsonwebtoken')
const expressJWT = require('express-jwt')
const nodemailer = require('nodemailer')
const cookieParser = require('cookie-parser')

const config = {
  secret: process.env.SESSION_SECRET
}

const mailTransport = nodemailer.createTransport({
  service: process.env.MAIL_SERVICE,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

var app = express();

app.engine('mustache', cons.mustache);
app.set('view engine', 'mustache');
app.set('views', __dirname + '/views');

app.use(cookieParser());

app.use(bodyParser.urlencoded({ extended: false }))

app.use(expressJWT({secret: config.secret,
  getToken: (req) => {
    if (req.query.token) { 
      return req.query.token;
    } else if(req.cookies.token) {
      return req.cookies.token;
    }
    return null;
}}).unless({path: ['/', '/login']}));

app.use(function (req, res, next) {
  if(req.query.token){
    res.cookie('token', req.query.token)
  }
  next();
});

app.get('/', function(req, res) {
  if(!req.user) {
    return res.redirect('/login');
  }
  res.redirect('/users');
});

app.get('/logout', function(req, res) {
  res.clearCookie('token').redirect('/login');
});

function renderLogin(res, params) {
  params.partials = {
    header: 'header',
    footer: 'footer'
  }
  return res.render('login', params);
}

app.get('/login', function(req, res) {
  renderLogin(res, {});
});

app.post('/login', function(req, res) {
  if(req.body.id == undefined){
    return renderLogin(res, { error: 'Nom manquant' });
  } 
  BetaGouv.user_infos_by_id(req.body.id).then(function (user){
    if(user === undefined) {
       return renderLogin(res, { error: 'Utilisateur inconnu sur beta.gouv.fr (Avez-vous une fiche sur github ?)' })
    }
    const email = req.body.id+'@beta.gouv.fr';
    const token = jwt.sign({ id: req.body.id }, config.secret);
    const url = `${req.secure?"https":"http"}://${req.hostname}/users?token=${encodeURIComponent(token)}`
    const mail = {
      to: email,
      from: "Secrétariat BetaGouv <secretariat@beta.gouv.fr>",
      subject: 'Connexion secrétariat BetaGouv',
      html: `
        <h1>Ton lien de connexion !</h1>
        <a href="${url}">${url}
        </a>
      `,
      text: `Lien de connexion: ${url}`,
    };
    mailTransport.sendMail(mail, (error, info) => {
      if (error) {
        renderLogin(res, { error: 'Erreur d\'envoi de mail à ton adresse' })
        return console.log(error);
      }
      renderLogin(res, { result: 'Email de connexion envoyé à '+email });
    });
  }).catch(function(err) {
    console.log(err);
    renderLogin(res, { error: 'Erreur interne' })
  })
})

app.get('/users', function(req, res) {
  if(req.query.name){
    return res.redirect('/users/'+req.query.name);
  } 
  res.render('search', {partials: {
    header: 'header',
    footer: 'footer'
  }});
});

app.get('/users/:name', function(req, res) {
  const name = req.params.name;
  Promise.join(BetaGouv.user_infos_by_id(name), BetaGouv.email_infos(name), BetaGouv.redirection_for_name(name), function(user_infos, email_infos, redirections) {
    res.render('user', {
      email_infos: email_infos,
      redirections: redirections,
      user_infos: user_infos,
      name: name ,
      partials: {
        header: 'header',
        footer: 'footer'
      }});
  }).catch(function (err) {
    console.log(err);
    res.send(err);
  });
});

app.listen(8100);