
class routes {
  static WHAT_IS_GOING_ON_WITH_MEMBER = '/que-ce-passe-t-il'
  static ADMIN = '/admin'
  static ADMIN_MATTERMOST = '/admin/mattermost'
  static ADMIN_MATTERMOST_MESSAGE_API = '/api/admin/mattermost/message/users'
  static ADMIN_MATTERMOST_SEND_MESSAGE = '/admin/mattermost/send-message'
  // onboarding
  static ONBOARDING = '/onboarding'
  static ONBOARDING_ACTION = '/onboarding'
  // users
  static USER_CREATE_EMAIL = '/users/:username/email'
  static USER_DELETE_EMAIL = '/users/:username/email/delete'
  static USER_CREATE_REDIRECTION = '/users/:username/redirections'
  static USER_DELETE_REDIRECTION = '/users/:username/redirections/:email/delete'
  static USER_UPDATE_PASSWORD = '/users/:username/password'
  static USER_UPDATE_SECONDARY_EMAIL = '/users/:username/secondary_email'
  static USER_UPDATE_PRIMARY_EMAIL = '/users/:username/primary_email'
  static USER_UPDATE_END_DATE = '/users/:username/end-date'
  static USER_UPGRADE_EMAIL = '/users/:username/email-upgrade'
  static USER_CREATE_EMAIL_API = '/users/:username/create-email'
  static API_GET_USER_INFO = '/api/users/:username'
  // account
  static ACCOUNT_GET = '/account'
  static ACCOUNT_GET_BASE_INFO_FORM = '/account/base-info'
  static ACCOUNT_POST_BASE_INFO_FORM = '/account/base-info/:username'
  static ACCOUNT_GET_DETAIL_INFO_FORM = '/account/info'
  static ACCOUNT_POST_DETAIL_INFO_FORM = '/account/info'
  static PULL_REQUEST_GET_PRS: string = '/api/pull-requests'
}

export default routes
