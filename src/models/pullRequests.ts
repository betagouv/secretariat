export interface DBPullRequest {
    status: PULL_REQUEST_STATE,
    username: string,
    created_at: Date,
    last_updated_at: Date
    url: string
    type: PULL_REQUEST_TYPE,
    info: {
        name: string,
        isEmailBetaAsked: boolean,
        referent: string,
        startup?: string,
        missions?: any,
        role?: string,
        startups: string[]
    }
}


export enum PULL_REQUEST_STATE {
  PR_CREATED = 'PR_CREATED',
  PR_SENT_TO_REFERENT = 'PR_SENT_TO_REFERENT',
  PR_SENT_TO_TEAM = 'PR_SENT_TO_TEAM',
  PR_READY_TO_BE_CLOSED = 'PR_READY_TO_BE_CLOSED',
  PR_CLOSED = 'PR_CLOSED',
  PR_MEMBER_UPDATE_CREATED = "PR_MEMBER_UPDATE_CREATED",
  PR_STARTUP_UPDATE_CREATED = "PR_STARTUP_UPDATE_CREATED"
}

export enum PULL_REQUEST_TYPE {
    PR_TYPE_ONBOARDING = 'PR_TYPE_ONBOARDING',
    PR_TYPE_MEMBER_UPDATE = 'PR_TYPE_MEMBER_UPDATE',
    PR_TYPE_STARTUP_UPDATE = 'PR_TYPE_STARTUP_UPDATE'
}
