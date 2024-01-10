import PromiseMemoize from 'promise-memoize';
import config from '@config';
import BetaGouv from '../../betagouv';
import * as utils from '../utils';
import { AdminPage } from '../../views';
import betagouv from '../../betagouv';
import { Domaine, Member } from '@models/member';
import db from '../../db';
import { CommunicationEmailCode, DBUser } from '@/models/dbUser/dbUser';
import { getBetaEmailId, isBetaEmail } from '../utils';
import { makeSendinblue } from '@/infra/email/sendInBlue';
import htmlBuilder from '@modules/htmlbuilder/htmlbuilder';

const emailWithMetadataMemoized = PromiseMemoize(
  async () => {
    const [accounts, redirections, users] = await Promise.all([
      BetaGouv.accounts(),
      BetaGouv.redirections(),
      BetaGouv.usersInfos(),
    ]);

    const emails = Array.from(
      new Set([
        ...redirections.reduce(
          (acc, r) => (!isBetaEmail(r.to) ? [...acc, r.from] : acc),
          []
        ),
        ...accounts.map(utils.buildBetaEmail),
      ])
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
          []
        ),
        account: accounts.includes(id),
        endDate: user ? user.end : undefined,
        expired:
          user &&
          user.end &&
          new Date(user.end).getTime() < new Date().getTime(),
      };
    });
  },
  {
    maxAge: 120000,
  }
);

export async function getSendinblueInfo(req, res) {
  const sendInBlueCommu = makeSendinblue({
    SIB_APIKEY_PRIVATE: config.SIB_APIKEY_PRIVATE,
    SIB_APIKEY_PUBLIC: config.SIB_APIKEY_PUBLIC,
    MAIL_SENDER: config.senderEmail,
    htmlBuilder,
  });

  const startDate = new Date();
  const endDate = new Date();
  startDate.setMonth(startDate.getMonth() - 6);
  let contacts = await sendInBlueCommu.getAllContactsFromList({ listId: 332 }); // SIB newsletter mailing list
  contacts = contacts.filter((c) => c.emailBlacklisted);
  const commuTransacBlockedContact =
    await sendInBlueCommu.getAllTransacBlockedContacts({
      startDate,
      endDate,
      offset: 0,
    });

  return res.json({
    contacts,
    commuTransacBlockedContact,
  });
}

export async function getEmailLists(req, res) {
  try {
    const emails = await emailWithMetadataMemoized();
    const expiredEmails = emails.filter((user) => user.expired);
    const users = await betagouv.usersInfos();
    const title = 'Administration';
    res.send(
      AdminPage({
        request: req,
        title,
        currentUserId: req.auth.id,
        users: users.splice(0, 100),
        emails,
        isAdmin: config.ESPACE_MEMBRE_ADMIN.includes(req.auth.id),
        expiredEmails,
        activeTab: 'admin',
        errors: req.flash('error'),
        messages: req.flash('message'),
      })
    );
  } catch (err) {
    console.error(err);
    req.flash('error', 'Erreur interne');
    res.redirect('/account');
  }
}

export async function getUsers(req, res) {
  const domaines = req.query.domaines
    ? req.query.domaines.split(',').map((domaine) => Domaine[domaine])
    : [];
  const incubators = req.query.incubators
    ? req.query.incubators.split(',')
    : [];
  const startupPhases = req.query.startupPhases
    ? req.query.startupPhases.split(',')
    : [];
  const memberStatus = req.query.memberStatus;
  let startups = req.query.startups ? req.query.startups.split(',') : [];
  // const activeMembers = req.params.activeMembers
  let users: Member[] = await betagouv.usersInfos();
  if (memberStatus === 'unactive') {
    users = utils.getExpiredUsers(users);
  } else if (memberStatus === 'active') {
    users = utils.getActiveUsers(users);
  }
  if (incubators.length) {
    const incubatorsDict = await betagouv.incubators();
    const incubatorStartups = incubators.reduce((acc, incubator) => {
      return [...acc, ...incubatorsDict[incubator].startups.map((s) => s.id)];
    }, []);
    startups = [...startups, ...incubatorStartups];
  }
  if (domaines.length) {
    users = users.filter((user) => domaines.includes(user.domaine));
  }
  if (startupPhases.length) {
    const usersStartupsByPhase: UserStartup[] = await db('users_startups')
      .whereIn(
        'user_id',
        users.map((user) => user.id)
      )
      .join('startups', 'users_startups.startup_id', 'startups.id')
      .whereIn('startups.current_phase', startupPhases);
    const usersByPhaseIds = usersStartupsByPhase.map((item) => item.user_id);
    users = users.filter((user) => usersByPhaseIds.includes(user.id));
  }
  if (startups.length) {
    users = users.filter((user) => {
      return Boolean(
        startups.filter(function (n) {
          return (user.startups || []).indexOf(n) !== -1;
        }).length
      );
    });
  }
  const dbUsers: DBUser[] = await db('users').whereIn(
    'username',
    users.map((user) => user.id)
  );
  if (
    process.env.ESPACE_MEMBRE_ADMIN &&
    process.env.ESPACE_MEMBRE_ADMIN.includes(req.auth.id)
  ) {
    users = users.map((user) => {
      const dbUser = dbUsers.find((dbUser) => dbUser.username === user.id);
      return {
        ...user,
        primaryEmail: dbUser ? dbUser.primary_email : '',
        secondaryEmail: dbUser ? dbUser.secondary_email : '',
        workplace_insee_code: dbUser ? dbUser.workplace_insee_code : '',
        communicationEmail: dbUser
          ? dbUser.communication_email === CommunicationEmailCode.SECONDARY &&
            dbUser.secondary_email
            ? dbUser.secondary_email
            : dbUser.primary_email
          : '',
      };
    });
  }
  res.json({ users });
}
