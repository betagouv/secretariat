export interface OvhRedirection {
  from: string;
  to: string;
  id: string;
}

export enum EMAIL_PLAN_TYPE {
  EMAIL_PLAN_PRO = 'EMAIL_PLAN_PRO',
  EMAIL_PLAN_EXCHANGE = 'EMAIL_PLAN_EXCHANGE',
  EMAIL_PLAN_BASIC = 'EMAIL_PLAN_BASIC',
}

export interface OvhMailingList {
  id: string;
}

export interface OvhResponder {
  account: string;
  content: string;
  copy: boolean;
  from: Date;
  to: Date;
}

export interface OvhExchangeCreationData {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  initial?: string;
  company?: string;
}

export interface OvhProCreationData {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  initial?: string;
}
