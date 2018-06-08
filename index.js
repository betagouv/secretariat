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
  secret: process.env.SESSION_SECRET,
  port: process.env.PORT || 8100,
  secure: (process.env.SECURE ||"true") === "true"
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

// Save a token in cookie that expire after 7 days if user is logged
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
  if(!req.cookies.token) {
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

function sendMail(to_email, subject, html, text){
  const mail = {
    to: to_email,
    from: "Secrétariat BetaGouv <secretariat@beta.gouv.fr>",
    subject: subject,
    html: html,
    text: html.replace(/<(?:.|\n)*?>/gm, ''),
    headers : { "X-Mailjet-TrackOpen" : "0", "X-Mailjet-TrackClick" : "0"}
  };
  return new Promise(function(resolve, reject) {
    mailTransport.sendMail(mail, (error, info) => {
      if (error) {
        reject(error)
      } else {
        resolve(info)
      }
    });
  })
}

function sendLoginEmail(id, domain) {
  return BetaGouv.user_infos_by_id(id).then(function (user){
    if(user === undefined) {
      throw 'Utilisateur inconnu sur beta.gouv.fr (Avez-vous une fiche sur github ?)'
    }
    const email = id+'@beta.gouv.fr';
    const token = jwt.sign({ id: id }, config.secret, { expiresIn: "10 mins" });
    const url = `${domain}/users?token=${encodeURIComponent(token)}`
    const html = `
        <h1>Ton lien de connexion ! (Valable 10 mins)</h1>
        <a href="${url}">${url}
        </a>`
    return sendMail(email, 'Connexion secrétariat BetaGouv', html)
     .catch(function(err){
        throw 'Erreur d\'envoi de mail à ton adresse'
     })
  })
}

function userInfos(name,is_current_user) {
  return Promise.join(BetaGouv.user_infos_by_id(name), BetaGouv.email_infos(name), BetaGouv.redirection_for_name(name), function(user_infos, email_infos, redirections) {
      // On ne peut créé un compte que se la page fiche github existe, que le compte n'existe pas et qu'il n'y a aucun redirection. (sauf l'utilisateur connecté qui peut créer son propre compte)
      const can_create_email = user_infos != undefined && email_infos == undefined && (is_current_user || redirections.length === 0) 
      // On peut créer une redirection que si la page fiche github existe, que le compte n'existe pas et qu'il n'y a aucun redirection. (sauf l'utilisateur connecté qui peut créer ces propres redirections)
      const can_create_redirection = user_infos != undefined && (is_current_user || (redirections.length === 0 && email_infos == undefined))
      const result = {
        email_infos: email_infos,
        redirections: redirections,
        user_infos: user_infos,
        name: name,
        can_create_email: can_create_email,
        can_create_redirection: can_create_redirection
      }
      return result
    })
    .catch(function(err) {
       throw 'Problème pour récupérer les infos de l\'utilisateur'
    })
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
  const domain = `${config.secure?"https":"http"}://${req.hostname}`
  sendLoginEmail(req.body.id, domain).then(function(result){
    renderLogin(req, res, { result: 'Email de connexion envoyé pour '+req.body.id });
  }).catch(function(err) {
    console.log(err);
    renderLogin(req, res, { errors:  [err] })
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
  const name = req.params.name
  userInfos(name, req.user.id === name).then(function(result) {
    res.render('user', {
      email_infos: result.email_infos,
      redirections: result.redirections,
      user_infos: result.user_infos,
      name: name,
      user: req.user,
      can_create_email: result.can_create_email,
      can_create_redirection: result.can_create_redirection,
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


app.post('/users/:id/email', function(req, res) {
  const id = req.params.id;
  userInfos(id, req.user.id === id)
  .then(function(result) {
    if(result.user_infos == undefined){
      throw "L'utilisateur n'a pas de fiche sur github: vous ne pouvez pas créer son compte email"
    }
    if(!result.can_create_email){
      throw "Vous n'avez pas le droits de créer de redirection"
    }
    const password = Math.random().toString(36).slice(-10)
    const email = id+'@beta.gouv.fr'
    console.log("Email account creation by="+req.user.id+"&email="+email+"&to_email="+req.query.to_email)
    return BetaGouv.create_email(id, password)
      .then(function(result){
        const url = `${config.secure?"https":"http"}://${req.hostname}/`
        const html = `
            <h1>Ton compte ${id} a été créé !</h1>
            <ul>
            <li>Identifiant de login : ${id}</li>
            <li>Mot de passe : ${password}</li>
            <li>Comment utiliser ton compte email, voici les infos OVH pour configurer ta boite mail : <a href="https://docs.ovh.com/fr/emails/generalites-sur-les-emails-mutualises">https://docs.ovh.com/fr/emails/generalites-sur-les-emails-mutualises</a></li>
            <li>Gérer son compte mail sur le secrétariat BetaGouv : <a href="${url}">${url}</a></li>
            </a>`
        return sendMail(req.body.to_email, 'Création compte '+email, html)
        .catch(function(err){
            throw 'Erreur d\'envoi de mail à l\'adresse indiqué '+err
        })
      })
      .then(function(result){
        if(req.body.create_redirection === "true") {
          return BetaGouv.create_redirection(email, req.body.to_email, req.body.keep_copy == "true")
            .catch(function(err) {
              throw 'Erreur pour créer la redirection: '+err
            })
        }
        return null
      })
  }).then(function(success) {
    req.flash('message', 'Le compte email a bien été créé')
    res.redirect('/users/'+id)
  }).catch(function(err) {
    console.log(err);
    req.flash('error', err)
    res.redirect('/users/'+id)
  })
})

app.post('/users/:name/redirections', function(req, res) {
  const name = req.params.name;
  userInfos(name,req.user.id === name)
  .then(function(result) {
    if(result.user_infos == undefined){
      throw "L'utilisateur n'a pas de fiche sur github: vous ne pouvez pas créer de redirection"
    }
    if(!result.can_create_redirection){
      throw "Vous n'avez pas le droits de créer de redirection"
    }
    return BetaGouv.create_redirection(name + '@beta.gouv.fr', req.body.to_email, req.body.keep_copy == "true").catch(function(err) {
      throw 'Erreur pour créer la redirection: '+err
    })
  })
  .then(function (result){
    req.flash('message', 'La redirection a bien été créé')
    res.redirect('/users/'+name)
  })
  .catch(function(err) {
    console.log(err);
    req.flash('error', err)
    res.redirect('/users/'+name)
  })
})

app.listen(config.port);