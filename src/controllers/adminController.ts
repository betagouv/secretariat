import PromiseMemoize from "promise-memoize";
import config from "../config";
import BetaGouv from "../betagouv";
import * as utils from "./utils";
import { AdminPage } from '../views';
import betagouv from "../betagouv";
import { Domaine, Member } from "src/models/member";

const isBetaEmail = (email) => email && email.endsWith(`${config.domain}`);

const getBetaEmailId = (email) => email && email.split('@')[0];

const emailWithMetadataMemoized = PromiseMemoize(
  async () => {
    const [accounts, redirections, users] = await Promise.all([
      BetaGouv.accounts(),
      BetaGouv.redirections(),
      BetaGouv.usersInfos(),
    ]);

    console.log('users', users.length);

    const emails = Array.from(
      new Set([
        ...redirections.reduce(
          (acc, r) => !isBetaEmail(r.to) ? [...acc, r.from] : acc,
          [],
        ),
        ...accounts.map(utils.buildBetaEmail),
      ]),
    ).sort();

    return emails.map((email) => {
      const id = getBetaEmailId(email);
      const user = users.find((ui) => ui.id === id);

      return {
        id,
        email,
        github: user !== undefined,
        redirections: redirections.reduce(
          (acc, r) => (r.from === email ? [...acc, r.to] : acc),
          [],
        ),
        account: accounts.includes(id),
        endDate: user ? user.end : undefined,
        expired:
          user
          && user.end
          && new Date(user.end).getTime() < new Date().getTime(),
      };
    });
  },
  {
    maxAge: 120000,
  },
);

export async function getEmailLists(req, res) {
  try {
    const emails = await emailWithMetadataMemoized();
    const expiredEmails = emails.filter((user) => user.expired);
    const users = await betagouv.usersInfos()
    const incubators = await betagouv.incubators()
    const startups = await betagouv.startupsInfos()
    // const currentUser = await utils.userInfos(req.auth.id, true);
    const title = 'Administration';
      res.send(
        AdminPage({
          request: req,
          title,
          currentUserId: req.auth.id,
          incubatorOptions: Object.keys(incubators).map(incubator => {
            return {
              value: incubator,
              label: incubators[incubator].title 
            }
          }),
          startupOptions: startups.map(startup => {
            return {
              value: startup.id,
              label: startup.attributes.name
            }
          }),
          domaineOptions: [{
              value: "ANIMATION",
              label: "Animation"
            }, {
              value: "COACHING",
              label: "Coaching"
            }, {
              value: "DEPLOIEMENT",
              label: "Déploiement"
            }, {
              value: "DESIGN",
              label: "Design"
            }, {
              value: "DEVELOPPEMENT",
              label: "Développement"
            }, {
              value: "INTRAPRENARIAT",
              label: "Intraprenariat"
            }, {
              value: "PRODUIT",
              label: "Produit"
            }, {
              value: "AUTRE",
              label: "Autre"
            }
          ],
          users: users.splice(0, 100),
          // userInfos: currentUser.userInfos,
          emails,
          expiredEmails,
          activeTab: 'admin',
          errors: req.flash('error'),
          messages: req.flash('message'),
        })
      )
  } catch (err) {
    console.error(err);
    req.flash('error', 'Erreur interne');
    res.redirect('/account');
  }
}

export async function getUsers(req, res) {
    const domaines = req.query.domaines ? req.query.domaines.split(',').map(domaine => Domaine[domaine]) : []
    const incubators = req.query.incubators ? req.query.incubators.split(',') : []
    const memberStatus = req.query.memberStatus
    let startups = (req.query.startups || '').split(',')
    // const activeMembers = req.params.activeMembers
    let users: Member[] = await betagouv.usersInfos()
    if (memberStatus === 'unactive') {
      users = utils.getExpiredUsers(users)
    } else if (memberStatus === 'active') {
      users = utils.getActiveUsers(users)
    }
    if (incubators.length) {
      const incubatorsDict = await betagouv.incubators()
      const incubatorStartups = incubators.reduce((acc, incubator) => {
        return [...acc, ...incubatorsDict[incubator].startups.map(s => s.id)]
      }, [])
      startups = [...startups, ...incubatorStartups]
    }
    if (domaines.length) {
      users = users.filter(user => domaines.includes(user.domaine))
      console.log(users)
    }
    if (startups.length) {
      users = users.filter(user => {
        return Boolean(startups.filter(function(n) {
          return (user.startups || []).indexOf(n) !== -1;
        }).length);
      })
    }
    res.json({ users })
}


