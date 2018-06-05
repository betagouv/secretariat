const express = require('express');
const cons = require('consolidate');
var app = express();
const session = require('express-session');
const BetaGouv = require('./betagouv');
const Promise = require("bluebird");

// respond with "hello world" when a GET request is made to the homepage
app.engine('mustache', cons.mustache);
app.set('view engine', 'mustache');
app.set('views', __dirname + '/views');

app.get('/', function(req, res) {
  res.render('index', {partials: {
    header: 'header',
    footer: 'footer'
   }});
});

app.get('/users', function(req, res) {
  res.redirect('/users/'+req.query.name);
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