class routes {
  // startup
  static STARTUP_GET_ALL = '/startups';
  static STARTUP_GET_ALL_API = '/api/startups';
  static STARTUP_GET_DETAIL = '/startups/:startup';
  static STARTUP_GET_DETAIL_API = '/api/startups/:startup';
  static STARTUP_GET_INFO_UPDATE_FORM = '/startups/:startup/info-form';
  static STARTUP_POST_INFO_UPDATE_FORM = '/startups/:startup/info-form';
  static STARTUP_GET_INFO_UPDATE_FORM_API = '/api/startups/:startup/info-form';
  static STARTUP_GET_INFO_CREATE_FORM = '/startups/create-form';
  static STARTUP_GET_INFO_CREATE_FORM_API = '/api/startups/create-form';
  static STARTUP_POST_INFO_CREATE_FORM = '/startups';

  // page de diagnostic
  static WHAT_IS_GOING_ON_WITH_MEMBER_WITH_TYPO = '/que-ce-passe-t-il';
  static WHAT_IS_GOING_ON_WITH_MEMBER = '/que-se-passe-t-il';
  static WHAT_IS_GOING_ON_WITH_MEMBER_SIMPLE = '/keskispasse';
  // ADMIN
  static ADMIN = '/admin';
  static ADMIN_MATTERMOST = '/admin/mattermost';
  static ADMIN_MATTERMOST_API = '/api/admin/mattermost';
  static ADMIN_MATTERMOST_MESSAGE_API = '/api/admin/mattermost/message/users';
  static ADMIN_MATTERMOST_SEND_MESSAGE = '/admin/mattermost/send-message';
  // onboarding
  static ONBOARDING = '/onboarding';
  static ONBOARDING_API = '/api/onboarding';
  static ONBOARDING_ACTION = '/onboarding';
  // users
  static USER_CREATE_EMAIL = '/users/:username/email';
  static USER_DELETE_EMAIL = '/users/:username/email/delete';
  static USER_CREATE_REDIRECTION = '/users/:username/redirections';
  static USER_DELETE_REDIRECTION =
    '/users/:username/redirections/:email/delete';
  static USER_UPDATE_PASSWORD = '/users/:username/password';
  static USER_UPDATE_SECONDARY_EMAIL = '/users/:username/secondary_email';
  static USER_UPDATE_PRIMARY_EMAIL = '/users/:username/primary_email';
  static USER_UPDATE_END_DATE = '/users/:username/end-date';
  static USER_UPGRADE_EMAIL = '/users/:username/email-upgrade';
  static USER_CREATE_EMAIL_API = '/api/users/:username/create-email';
  static API_GET_PUBLIC_USER_INFO = '/api/public/users/:username';
  // account
  static ACCOUNT_GET = '/account';
  static ACCOUNT_GET_API = '/api/account';
  static ACCOUNT_GET_BASE_INFO_FORM = '/account/base-info';
  static ACCOUNT_GET_BASE_INFO_FORM_API = '/api/account/base-info';

  static ACCOUNT_POST_BASE_INFO_FORM = '/account/base-info/:username';
  static ACCOUNT_GET_DETAIL_INFO_FORM = '/account/info';
  static ACCOUNT_GET_DETAIL_INFO_FORM_API = '/api/account/info';
  static ACCOUNT_POST_DETAIL_INFO_FORM = '/account/info';
  static API_PUBLIC_POST_BASE_INFO_FORM =
    '/api/public/account/base-info/:username';
  static ACCOUNT_GET_BADGE_REQUEST_PAGE = '/account/badge-demande';
  static API_POST_BADGE_REQUEST = '/api/badge';
  static API_UPDATE_BADGE_REQUEST_STATUS = '/api/badge/status';

  static PULL_REQUEST_GET_PRS: string = '/api/pull-requests';
  static ME: string = '/api/me';

  static LOGIN_API: string = '/api/login';
  static API_UPDATE_BADGE_STATUS: string;
  static API_PUBLIC_INCUBATORS_GET_ALL: string = '/api/incubators';
  static API_PUBLIC_SPONSORS_GET_ALL: string = '/api/sponsors';

  static GET_USER: string = '/community/:username';
  static GET_USER_API: string = '/api/community/:username';
  static GET_COMMUNITY: string = '/community';
  static GET_COMMUNITY_API: string = '/api/community';
}

export default routes;
