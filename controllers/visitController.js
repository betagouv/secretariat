const BetaGouv = require('../betagouv');
const config = require('../config');
const knex = require('../db');

module.exports.getForm = async function (req, res) {
  try {
    const users = await BetaGouv.usersInfos();
    const userAgent = Object.prototype.hasOwnProperty.call(req.headers, 'user-agent') ? req.headers['user-agent'] : null;
    const isMobileFirefox = userAgent && /Android.+Firefox\//.test(userAgent);
    const title = 'Prévoir une visite';
    return res.render('visit', {
      domain: config.domain,
      title,
      errors: req.flash('error'),
      messages: req.flash('message'),
      userConfig: config.user,
      users,
      currentUserId: req.user.id,
      formData: {
        visitorList: [],
        referent: '',
        start: new Date().toISOString().split('T')[0], // current date in YYYY-MM-DD format
      },
      activeTab: 'visit',
      useSelectList: isMobileFirefox,
    });
  } catch (err) {
    console.error(err);
    req.flash('error', `Impossible de récupérer la liste des membres sur ${config.domain}`);
    return res.redirect('/');
  }
};

module.exports.postForm = async function (req, res) {
  try {
    const formValidationErrors = [];

    function requiredError(field) {
      formValidationErrors.push(`${field} : le champ n'est pas renseigné`);
    }

    function isValidDate(field, date) {
      if (date instanceof Date && !Number.isNaN(date.getTime())) {
        return date;
      }
      formValidationErrors.push(`${field} : la date n'est pas valide`);
      return null;
    }

    function isValidNumber(field, number) {
      if (!number) {
        requiredError(field);
        return null;
      }
      const numberRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/gmi;
      if (numberRegex.test(number)) {
        return number;
      }
      formValidationErrors.push(`${field} : le numéro n'est pas valide`);
      return null;
    }

    let visitors = req.body.visitorList || requiredError('visiteurs');
    const referent = req.body.referent || requiredError('référent');
    const number = isValidNumber('numéro', req.body.number);
    let date = req.body.date || requiredError('date');
    date = isValidDate('date de visite', new Date(date));
    // when only one visitor is sent in the form, visitors is a string
    visitors = Array.isArray(visitors) ? visitors : [visitors];

    if (formValidationErrors.length) {
      req.flash('error', formValidationErrors);
      throw new Error();
    }
    await knex('visits')
      .insert(visitors.map((username) => ({
        username,
        date,
        number,
        referent,
      })));

    req.flash('message', 'La visite a été programmée, un email sera envoyé à l\'accueil Ségur un jour avant la date définie.');
    res.rdirect('/visit');
  } catch (err) {
    const userAgent = Object.prototype.hasOwnProperty.call(req.headers, 'user-agent') ? req.headers['user-agent'] : null;
    const isMobileFirefox = userAgent && /Android.+Firefox\//.test(userAgent);
    const users = await BetaGouv.usersInfos();
    res.render('visit', {
      errors: req.flash('error'),
      messages: req.flash('message'),
      userConfig: config.user,
      domain: config.domain,
      currentUserId: req.user.id,
      users,
      activeTab: 'visit',
      formData: req.body,
      useSelectList: isMobileFirefox,
    });
  }
};
