import axios from 'axios';
import ovh0 from 'ovh';
import config from '@/config';
import { checkUserIsExpired } from '@controllers/utils';
import { Incubator } from '@models/incubator';
import { Job, JobWTTJ } from '@models/job';
import { Member } from '@models/member';
import { Startup } from '@models/startup';
import _ from 'lodash';
import {
  EMAIL_PLAN_TYPE,
  OvhExchangeCreationData,
  OvhMailingList,
  OvhProCreationData,
  OvhResponder,
  OvhRedirection,
} from './models/ovh';

const ovh = ovh0({
  appKey: config.OVH_APP_KEY,
  appSecret: config.OVH_APP_SECRET,
  consumerKey: config.OVH_CONSUMER_KEY,
});

const betaGouv = {
  sendInfoToChat: async (
    text: string,
    channel: string = null,
    username: string = null,
    hookURL: string = null
  ) => {
    const params: any = {
      text,
      channel: channel === 'general' ? 'town-square' : channel,
    };
    if (!hookURL) {
      hookURL = config.CHAT_WEBHOOK_URL_SECRETARIAT;
      if (channel === 'general') {
        hookURL = config.CHAT_WEBHOOK_URL_GENERAL;
      } else if (channel === 'dinum') {
        hookURL = config.CHAT_WEBHOOK_URL_DINUM;
      } else if (channel && channel !== 'secretariat') {
        hookURL = config.CHAT_WEBHOOK_URL_GENERAL;
      }
    }
    if (username) {
      params.channel = `@${username}`;
    }
    try {
      return await axios.post(hookURL, params);
    } catch (err) {
      throw new Error(`Error to notify slack: ${err}`);
    }
  },

  usersInfos: async (): Promise<Member[]> => {
    return axios
      .get<Member[]>(config.usersAPI)
      .then((response) =>
        response.data.map((author: Member) => {
          if (author.missions && author.missions.length > 0) {
            const sortedStartDates = author.missions.map((x) => x.start).sort();
            const sortedEndDates = author.missions
              .map((x) => x.end || '')
              .sort()
              .reverse();
            const latestMission = author.missions.reduce((a, v) =>
              v.end > a.end || !v.end ? v : a
            );

            [author.start] = sortedStartDates;
            author.end = sortedEndDates.includes('') ? '' : sortedEndDates[0];
            author.employer = latestMission.status
              ? `${latestMission.status}/${latestMission.employer}`
              : latestMission.employer;
          }
          return author;
        })
      )
      .catch((err) => {
        throw new Error(`Error to get users infos in ${config.domain}: ${err}`);
      });
  },
  incubators: async (): Promise<Incubator[]> => {
    return axios
      .get<any[]>(config.incubatorAPI)
      .then((response) => response.data)
      .catch((err) => {
        throw new Error(`Error to get incubators infos : ${err}`);
      });
  },
  sponsors: async (): Promise<Incubator[]> => {
    return axios
      .get<any[]>(config.SPONSOR_API)
      .then((response) => response.data)
      .catch((err) => {
        throw new Error(`Error to get incubators infos : ${err}`);
      });
  },
  getJobs: async (): Promise<Job[]> => {
    return await axios
      .get<any[]>(config.JOBS_API)
      .then((res) => res.data)
      .catch((err) => {
        throw new Error(`Error to get jobs infos : ${err}`);
      });
  },
  getJobsWTTJ: async (): Promise<JobWTTJ[]> => {
    return await axios
      .get(config.JOBS_WTTJ_API)
      .then((res) => res.data.jobs)
      .catch((err) => {
        throw new Error(`Error to get jobs infos : ${err}`);
      });
  },
  userInfosById: async (id: string): Promise<Member> => {
    const users = await betaGouv.usersInfos();
    return users.find((user) => user.id === id);
  },
  startupInfos: async (): Promise<Startup[]> => {
    return axios
      .get<Startup[]>(config.startupsDetailsAPI)
      .then((response) =>
        Object.keys(response.data).map((key) => response.data[key])
      )
      .catch((err) => {
        throw new Error(
          `Error to get startups infos in ${config.domain}: ${err}`
        );
      });
  },
  startupInfosById: async (id: string): Promise<Startup> => {
    const startups = await betaGouv.startupInfos();
    return startups.find((startup) => startup.id === id);
  },
  startupsInfos: async () =>
    axios
      .get(config.startupsAPI)
      .then((x) => x.data.data) // data key
      .catch((err) => {
        throw new Error(
          `Error to get startups infos in ${config.domain}: ${err}`
        );
      }),
};

const betaOVH = {
  emailInfos: async (
    id: string
  ): Promise<{
    email: string;
    emailPlan: EMAIL_PLAN_TYPE;
    isPro?: boolean;
    isExchange?: boolean;
  }> => {
    const errorHandler = (err) => {
      if (err.error === 404) return null;
      throw err;
    };
    const promises = [];
    const url = `/email/domain/${config.domain}/account/${id}`;
    promises.push(
      ovh
        .requestPromised('GET', url, {})
        .then((data) => ({
          ...data,
          emailPlan: EMAIL_PLAN_TYPE.EMAIL_PLAN_BASIC,
        }))
        .catch(errorHandler)
    );
    if (config.OVH_EMAIL_PRO_NAME) {
      const urlPro = `/email/pro/${config.OVH_EMAIL_PRO_NAME}/account/${id}@${config.domain}`;
      promises.push(
        ovh
          .requestPromised('GET', urlPro, {})
          .then((data) => ({
            ...data,
            emailPlan: EMAIL_PLAN_TYPE.EMAIL_PLAN_PRO,
            isPro: true,
            email: data.primaryEmailAddress,
          }))
          .catch(errorHandler)
      );
    }
    if (config.OVH_EMAIL_EXCHANGE_NAME) {
      const urlExchange = `/email/exchange/${config.OVH_EMAIL_EXCHANGE_NAME}/service/${config.OVH_EMAIL_EXCHANGE_NAME}/account/${id}@${config.domain}`;
      promises.push(
        ovh
          .requestPromised('GET', urlExchange, {})
          .then((data) => ({
            ...data,
            emailPlan: EMAIL_PLAN_TYPE.EMAIL_PLAN_EXCHANGE,
            isExchange: true,
            email: data.primaryEmailAddress,
          }))
          .catch(errorHandler)
      );
    }
    try {
      return await Promise.all(promises).then((data) => {
        const emailInfos = data.filter((d) => d)[0];
        return emailInfos ? emailInfos : null;
      });
    } catch (err) {
      if (err.error === 404) return null;
      throw new Error(`OVH Error GET on ${url} : ${JSON.stringify(err)}`);
    }
  },
  getAllEmailInfos: async (): Promise<string[]> => {
    // https://eu.api.ovh.com/console/#/email/domain/%7Bdomain%7D/account#GET
    // result is an array of the users ids : ['firstname1.lastname1', 'firstname2.lastname2', ...]
    const promises = [];
    const url = `/email/domain/${config.domain}/account/`;
    promises.push(ovh.requestPromised('GET', url, {}));
    if (config.OVH_EMAIL_PRO_NAME) {
      const urlPro = `/email/pro/${config.OVH_EMAIL_PRO_NAME}/account`;
      promises.push(
        ovh
          .requestPromised('GET', urlPro, {})
          .then((data) => data.map((d) => d.split('@')[0]))
          .catch((e) => [])
      );
    }
    if (config.OVH_EMAIL_EXCHANGE_NAME) {
      const urlExchange = `/email/exchange/${config.OVH_EMAIL_EXCHANGE_NAME}/service/${config.OVH_EMAIL_EXCHANGE_NAME}/account`;
      promises.push(
        ovh
          .requestPromised('GET', urlExchange, {
            primaryEmailAddress: `%@${config.domain}`,
          })
          .then((data) => data.map((d) => d.split('@')[0]))
          .catch((e) => [])
      );
    }
    try {
      return await Promise.all(promises).then((data) => {
        return data.flat(1);
      });
    } catch (err) {
      console.error(`OVH Error GET on ${url} : ${JSON.stringify(err)}`);
      throw new Error(`OVH Error GET on ${url} : ${JSON.stringify(err)}`);
    }
  },
  migrateEmailAccount: async ({
    userId,
    destinationServiceName,
    destinationEmailAddress,
    password,
  }: {
    userId: string;
    destinationServiceName: string;
    destinationEmailAddress: string; //configure.me adress
    password: string;
  }): Promise<void> => {
    const url = `/email/domain/${config.domain}/account/${userId}/migrate/${destinationServiceName}/destinationEmailAddress/${destinationEmailAddress}/migrate`;
    try {
      return ovh.requestPromised('POST', url, {
        password,
      });
    } catch (err) {
      console.error(`OVH Error POST on ${url} : ${JSON.stringify(err)}`);
      throw new Error(`OVH Error POST on ${url} : ${JSON.stringify(err)}`);
    }
  },
  getAvailableProEmailInfos: async (): Promise<string[]> => {
    if (!config.OVH_EMAIL_PRO_NAME) {
      return [];
    }
    const urlPro = `/email/pro/${config.OVH_EMAIL_PRO_NAME}/account`;
    /* TODO
     * use /email/domain/{domain}/account/{accountName}/migrate/{destinationServiceName}/destinationEmailAddress instead
     * get available email instead of all emails
     */
    try {
      console.log(`GET OVH pro emails infos : ${urlPro}`);
      return ovh
        .requestPromised('GET', urlPro, {})
        .then((data) =>
          data.filter((email) => email.includes('@configureme.me'))
        );
    } catch (err) {
      console.error(`OVH Error GET on ${urlPro} : ${JSON.stringify(err)}`);
      throw new Error(`OVH Error GET on ${urlPro} : ${JSON.stringify(err)}`);
    }
  },
  getAllMailingList: async () => {
    const url = `/email/domain/${config.domain}/mailingList/`;
    try {
      return await ovh.requestPromised('GET', url, {});
    } catch (err) {
      if (err.error === 404) return null;
      throw new Error(`OVH Error GET on ${url} : ${JSON.stringify(err)}`);
    }
  },
  createMailingList: async (mailingListName: string) => {
    const url = `/email/domain/${config.domain}/mailingList`;
    try {
      return await ovh.requestPromised('POST', url, {
        language: 'fr',
        name: mailingListName,
        options: {
          moderatorMessage: false,
          subscribeByModerator: false,
          usersPostOnly: false,
        },
        ownerEmail: 'espace-membre@beta.gouv.fr',
      });
    } catch (err) {
      if (err.error === 404) return null;
      throw new Error(
        `OVH Error createMailingList on ${url} : ${JSON.stringify(err)}`
      );
    }
  },
  unsubscribeFromMailingList: async (
    mailingListName: string,
    email: string
  ) => {
    const url = `/email/domain/${config.domain}/mailingList/${mailingListName}/subscriber/${email}`;
    try {
      return await ovh.requestPromised('DELETE', url);
    } catch (err) {
      if (err.error === 404) return null;
      throw new Error(`OVH Error DELETE on ${url} : ${JSON.stringify(err)}`);
    }
  },
  subscribeToMailingList: async (
    mailingListName: string,
    email: string
  ): Promise<OvhMailingList[]> => {
    const url = `/email/domain/${config.domain}/mailingList/${mailingListName}/subscriber`;
    try {
      return await ovh.requestPromised('POST', url, {
        email,
      });
    } catch (err) {
      throw new Error(`OVH Error subscribe on ${url} : ${JSON.stringify(err)}`);
    }
  },
  // get active users with email registered on ovh
  getActiveUsers: async () => {
    const users = await betaGouv.usersInfos();
    const activeUsers = users.filter((user) => !checkUserIsExpired(user));
    return activeUsers;
  },
  getActiveRegisteredOVHUsers: async () => {
    const users = await betaGouv.usersInfos();
    const allOvhEmails = await betaOVH.getAllEmailInfos();
    const activeUsers = users.filter(
      (user) => !checkUserIsExpired(user) && allOvhEmails.includes(user.id)
    );
    return activeUsers;
  },
  getResponder: async (id): Promise<OvhResponder> => {
    const url = `/email/domain/${config.domain}/responder/${id}`;

    try {
      return await ovh.requestPromised('GET', url);
    } catch (err) {
      if (err.error === 404) return null;
      throw new Error(`OVH Error GET on ${url} : ${JSON.stringify(err)}`);
    }
  },
  setResponder: async (id, { content, from, to }) => {
    const url = `/email/domain/${config.domain}/responder`;
    try {
      const params: OvhResponder = {
        account: id,
        content,
        from,
        to,
        copy: true,
      };
      return await ovh.requestPromised('POST', url, params);
    } catch (err) {
      throw new Error(`OVH Error POST on ${url} : ${JSON.stringify(err)}`);
    }
  },
  updateResponder: async (id, { content, from, to }) => {
    const url = `/email/domain/${config.domain}/responder/${id}`;
    try {
      return await ovh.requestPromised('PUT', url, {
        content,
        from,
        to,
      });
    } catch (err) {
      throw new Error(`OVH Error PUT on ${url} : ${JSON.stringify(err)}`);
    }
  },
  deleteResponder: async (id) => {
    const url = `/email/domain/${config.domain}/responder/${id}`;
    try {
      return await ovh.requestPromised('DELETE', url);
    } catch (err) {
      throw new Error(`OVH Error PUT on ${url} : ${JSON.stringify(err)}`);
    }
  },
  createEmail: async (id, password) => {
    const url = `/email/domain/${config.domain}/account`;

    try {
      return await ovh.requestPromised('POST', url, {
        accountName: id,
        password,
      });
    } catch (err) {
      throw new Error(
        `OVH Error POST on ${url}, account ${id}: ${JSON.stringify(err)}`
      );
    }
  },
  deleteEmail: async (id) => {
    const url = `/email/domain/${config.domain}/account/${id}`;

    try {
      return await ovh.requestPromised('DELETE', url);
    } catch (err) {
      throw new Error(`OVH Error DELETE on ${url} : ${JSON.stringify(err)}`);
    }
  },
  createRedirection: async (from, to, localCopy) => {
    const url = `/email/domain/${config.domain}/redirection`;

    try {
      return await ovh.requestPromised('POST', url, { from, to, localCopy });
    } catch (err) {
      throw new Error(`OVH Error POST on ${url} : ${JSON.stringify(err)}`);
    }
  },
  requestRedirection: async (method, redirectionId) =>
    ovh.requestPromised(
      method,
      `/email/domain/${config.domain}/redirection/${redirectionId}`
    ),
  requestRedirections: async (
    method,
    redirectionIds
  ): Promise<OvhRedirection[]> =>
    Promise.all(
      redirectionIds.map((x) => betaOVH.requestRedirection(method, x))
    ),
  redirectionsForId: async (query): Promise<OvhRedirection[]> => {
    if (!query.from && !query.to) {
      throw new Error("paramètre 'from' ou 'to' manquant");
    }

    const url = `/email/domain/${config.domain}/redirection`;

    // fixme
    const options = {} as any;

    if (query.from) {
      options.from = `${query.from}@${config.domain}`;
    }

    if (query.to) {
      options.to = `${query.to}@${config.domain}`;
    }

    try {
      const redirectionIds = await ovh.requestPromised('GET', url, options);

      return await betaOVH.requestRedirections('GET', redirectionIds);
    } catch (err) {
      throw new Error(`OVH Error on ${url} : ${JSON.stringify(err)}`);
    }
  },
  deleteRedirection: async (from, to) => {
    const url = `/email/domain/${config.domain}/redirection`;

    try {
      const redirectionIds = await ovh.requestPromised('GET', url, {
        from,
        to,
      });

      return await betaOVH.requestRedirections('DELETE', redirectionIds);
    } catch (err) {
      throw new Error(`OVH Error on deleting ${url} : ${JSON.stringify(err)}`);
    }
  },
  redirections: async (): Promise<OvhRedirection[]> => {
    const url = `/email/domain/${config.domain}/redirection`;

    try {
      const redirectionIds = await ovh.requestPromised('GET', url);

      return await betaOVH.requestRedirections('GET', redirectionIds);
    } catch (err) {
      throw new Error(`OVH Error on ${url} : ${JSON.stringify(err)}`);
    }
  },
  getMailingListSubscribers: async (
    mailingListName: string
  ): Promise<string[]> => {
    const url = `/email/domain/${config.domain}/mailingList/${mailingListName}/subscriber`;

    try {
      return await ovh.requestPromised('GET', url);
    } catch (err) {
      throw new Error(`OVH Error on ${url} : ${JSON.stringify(err)}`);
    }
  },
  accounts: async () => {
    const url = `/email/domain/${config.domain}/account`;

    try {
      return await ovh.requestPromised('GET', url, {});
    } catch (err) {
      if (err.error === 404) return null;
      throw new Error(`OVH Error GET on ${url} : ${JSON.stringify(err)}`);
    }
  },
  changePassword: async (id, password, plan) => {
    let url = `/email/domain/${config.domain}/account/${id}/changePassword`;
    if (plan === EMAIL_PLAN_TYPE.EMAIL_PLAN_PRO) {
      url = `/email/pro/${config.OVH_EMAIL_PRO_NAME}/account/${id}@${config.domain}/changePassword`;
    } else if (plan === EMAIL_PLAN_TYPE.EMAIL_PLAN_EXCHANGE) {
      url = `/email/exchange/${config.OVH_EMAIL_EXCHANGE_NAME}/service/${config.OVH_EMAIL_EXCHANGE_NAME}/account/${id}@${config.domain}/changePassword`;
    }
    try {
      await ovh.requestPromised('POST', url, { password });
    } catch (err) {
      throw new Error(`OVH Error on ${url} : ${JSON.stringify(err)}`);
    }
  },
  createEmailPro: async (id: string, creationData: OvhProCreationData) => {
    const primaryEmailAddress = `${id}@${config.domain}`;
    const getAccountsUrl = `/email/pro/${config.OVH_EMAIL_PRO_NAME}/account`;
    let availableAccounts;
    try {
      availableAccounts = await ovh.requestPromised('GET', getAccountsUrl, {
        primaryEmailAddress: '%@configureme.me',
      });
    } catch (err) {
      throw new Error(
        `OVH Error on ${getAccountsUrl} : ${JSON.stringify(err)}`
      );
    }
    if (availableAccounts.length === 0) {
      throw new Error('No Ovh Pro account available');
    }

    const accountToBeAssigned = _.sample(availableAccounts);

    console.log(
      `Assigning Ovh Pro account ${accountToBeAssigned} to ${primaryEmailAddress}`
    );

    const assignAccountUrl = `/email/pro/${config.OVH_EMAIL_PRO_NAME}/account/${accountToBeAssigned}`;

    try {
      const result = await ovh.requestPromised('PUT', assignAccountUrl, {
        ...creationData,
        login: id,
        domain: config.domain,
      });
      console.log(`Account ${primaryEmailAddress} assigned`);
      return result;
    } catch (err) {
      console.log(`OVH Error on ${assignAccountUrl} : ${JSON.stringify(err)}`);
      throw new Error(
        `OVH Error on ${assignAccountUrl} : ${JSON.stringify(err)}`
      );
    }
  },
  createEmailForExchange: async (
    id: string,
    creationData: OvhExchangeCreationData
  ) => {
    const primaryEmailAddress = `${id}@${config.domain}`;
    const getAccountsUrl = `/email/exchange/${config.OVH_EMAIL_EXCHANGE_NAME}/service/${config.OVH_EMAIL_EXCHANGE_NAME}/account`;
    let availableAccounts;
    try {
      availableAccounts = await ovh.requestPromised('GET', getAccountsUrl, {
        primaryEmailAddress: '%@configureme.me',
      });
    } catch (err) {
      throw new Error(
        `OVH Error on ${getAccountsUrl} : ${JSON.stringify(err)}`
      );
    }
    if (availableAccounts.length === 0) {
      throw new Error('No Exchange account available');
    }

    const accountToBeAssigned = _.sample(availableAccounts);

    console.log(
      `Assigning Exchange account ${accountToBeAssigned} to ${primaryEmailAddress}`
    );

    const assignAccountUrl = `/email/exchange/${config.OVH_EMAIL_EXCHANGE_NAME}/service/${config.OVH_EMAIL_EXCHANGE_NAME}/account/${accountToBeAssigned}`;

    try {
      const result = await ovh.requestPromised('PUT', assignAccountUrl, {
        ...creationData,
        login: id,
        domain: config.domain,
      });
      console.log(`Account ${primaryEmailAddress} assigned`);
      return result;
    } catch (err) {
      throw new Error(
        `OVH Error on ${assignAccountUrl} : ${JSON.stringify(err)}`
      );
    }
  },

  deleteEmailForExchange: async (id) => {
    try {
      const result = await ovh.requestPromised(
        'DELETE',
        `/email/exchange/${config.OVH_EMAIL_EXCHANGE_NAME}/service/${config.OVH_EMAIL_EXCHANGE_NAME}/account/${id}@${config.domain}`
      );
      return result;
    } catch (err) {
      throw new Error(`OVH Error: ${JSON.stringify(err)}`);
    }
  },
};

export default { ...betaGouv, ...betaOVH };
