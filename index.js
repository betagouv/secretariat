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
const flash = require('connect-flash')
const session = require('express-session')

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

app.use(cookieParser(config.secret));
app.use(session({ cookie: { maxAge: 60000 }}));
app.use(flash());

app.use(bodyParser.urlencoded({ extended: false }))

app.use(expressJWT({
  secret: config.secret,
  getToken: (req) => {
    if (req.query.token || req.cookies.token) { 
      return req.query.token || req.cookies.token;
    }
    return null;
}}).unless({path: ['/', '/login']}));

// Save a permanent token if user logged
app.use(function (req, res, next) {
  if(req.user && req.user.id){
    const token = jwt.sign({ id: req.user.id }, config.secret, { expiresIn: "7 days" });
    res.cookie('token', token)
  }
  next();
});

app.use(function (err, req, res, next) {
  if (err.name === 'UnauthorizedError') {
      req.flash('error', 'Vous n\'étes pas identifié pour accèder à cette page (ou votre accès n\'est plus valide)')
      res.redirect('/login')
  } else {
      next(err);
  }
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


function renderLogin(req, res, params) {
  params.partials = {
    header: 'header',
    footer: 'footer',
    user: req.user
  }
  return res.render('login', params);
}

app.get('/login', function(req, res) {
  BetaGouv.users_infos().then(function (users){
    renderLogin(req, res, { errors: req.flash('error'), users: users });
  }).catch(function(err) {
    console.log(err);
    renderLogin(req, res, { errors: ['Erreur interne: impossible de récupérer la liste des membres sur beta.gouv.fr'] })
  })
});

app.post('/login', function(req, res) {
  if(req.body.id == undefined || !/^[a-z0-9_-]+\.[a-z0-9_-]+$/.test(req.body.id)){
    req.flash('error', 'Nom invalid ([a-z0-9_-]+\.[a-z0-9_-]+)')
    return res.redirect('/login')
  } 
  BetaGouv.user_infos_by_id(req.body.id).then(function (user){
    if(user === undefined) {
      req.flash('error', 'Utilisateur inconnu sur beta.gouv.fr (Avez-vous une fiche sur github ?)')
      return res.redirect('/login')
    }
    const email = req.body.id+'@beta.gouv.fr';
    const token = jwt.sign({ id: req.body.id }, config.secret, { expiresIn: "10 mins" });
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
        renderLogin(req, res, { errors: ['Erreur d\'envoi de mail à ton adresse'] })
        return console.log(error);
      }
      renderLogin(req, res, { result: 'Email de connexion envoyé à '+email });
    });
  }).catch(function(err) {
    console.log(err);
    renderLogin(req, res, { errors:  ['Erreur interne: impossible de récupérer les données sur beta.gouv.fr'] })
  })
})

app.get('/users', function(req, res) {
  if(req.query.name){
    return res.redirect('/users/'+req.query.name);
  } 
  BetaGouv.users_infos().then(function (users){
    res.render('search', {
      users: users,
      user: req.user,
      partials: {
      header: 'header',
      footer: 'footer'
    }});
  }).catch(function(err) {
    console.log(err);
    res.render('search', {
      users: [],
      errors: ['Erreur interne: impossible de récupérer la liste des membres sur beta.gouv.fr'],
      user: req.user,
      partials: {
        header: 'header',
        footer: 'footer'
    }});
  })
});

app.get('/users/:name', function(req, res) {
  const name = req.params.name;
  Promise.join(BetaGouv.user_infos_by_id(name), BetaGouv.email_infos(name), BetaGouv.redirection_for_name(name), function(user_infos, email_infos, redirections) {
    // On ne peut créé un compte que se la page fiche github existe, que le compte n'existe pas et qu'il n'y a aucun redirection. (sauf l'utilisateur connecté qui peut créer son propre compte)
    const can_create_email = user_infos != undefined //&& email_infos == undefined && (req.user.id === name || redirections.length === 0) 
    // On peut créer une redirection que si la page fiche github existe, que le compte n'existe pas et qu'il n'y a aucun redirection. (sauf l'utilisateur connecté qui peut créer ces propres redirections)
    const can_create_redirection = user_infos != undefined && (req.user.id === name || (redirections.length === 0 && email_infos == undefined))
    // TODO : bloquer les changements sur les utilisateurs connectés ?

    res.render('user', {
      email_infos: email_infos,
      redirections: redirections,
      user_infos: user_infos,
      name: name,
      user: req.user,
      can_create_email: can_create_email,
      can_create_redirection: can_create_redirection,
      errors: req.flash('error'),
      messages: req.flash('message'),
      partials: {
        header: 'header',
        footer: 'footer'
      }});
  }).catch(function (err) {
    console.log(err);
    res.send(err);
  });
});


app.post('/users/:name/email', function(req, res) {
  const name = req.params.name;
  BetaGouv.user_infos_by_id(name).then(function (user){
    if(user == undefined){
      return res.send("L'utilisateur n'a pas de fiche sur github")
    }
    res.send("Non implémenté");
  }).catch(function(err) {
    console.log(err);
    res.send(err);
  })
})

app.post('/users/:name/redirections', function(req, res) {
  const name = req.params.name;
  BetaGouv.user_infos_by_id(name).then(function (user){
    if(user == undefined){
      req.flash('error', "L'utilisateur n'a pas de fiche sur github: vous ne pouvez pas créer de redirection")
      return res.redirect('/users/'+name)
    }
    BetaGouv.create_redirection(name + '@beta.gouv.fr', req.body.to_email, req.body.keep_copy == "true").then(function (result){
      req.flash('message', 'La redirection a bien été créé')
      res.redirect('/users/'+name)
    }).catch(function(err) {
      console.log(err);
      req.flash('error', 'Erreur pour créer la redirection: '+err)
      res.redirect('/users/'+name)
    })
  }).catch(function(err) {
    console.log(err);
    req.flash('error', 'Problème pour vérifier la présence de l\'utilisateur sur beta.gouv.fr')
    res.redirect('/users/'+name)
  })
})

app.listen(8100);