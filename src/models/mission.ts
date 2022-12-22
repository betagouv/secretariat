export type Status = 'independant' | 'admin' | 'service';

export interface Mission {
  start: string,
  end: string,
  status: Status,
  employer: string
}

export interface DBMission {
  id: number,
  startup: string,
  status: string,
  role?: string,
  employer: string,
  username: string,
  start: Date,
  end?: Date
}

export interface GithubMission {
  start: Date,
  end: Date,
  status: Status,
  employer: string
}
