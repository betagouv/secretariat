type Status = 'independant' | 'admin' | 'service';

export interface Mission {
  start: string,
  end: string,
  status: Status,
  employer: string
}
