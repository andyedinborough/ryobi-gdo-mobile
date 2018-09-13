export interface Sys {
  ip: string;
  lastSeen: number;
}

export interface WskAuthAttempt {
  varName: string;
  apiKey: string;
  ts: string;
  success: boolean;
}

export interface MetaData {
  companyName: string;
  surName: string;
  givenName: string;
  sys: Sys;
  autoLogout: boolean;
  wskAuthAttempts: WskAuthAttempt[];
  authCount: number;
}

export interface AccountOptions {
  email: string;
  alertPhone: string;
  alertEmail: string;
  receiveEmailUpdates: boolean;
  receiveEmailAlerts: boolean;
  receiveSmsAlerts: boolean;
}

export interface RoleMap {
  roleSelectors: any[];
  roleRegex: string[];
  roleNames: string[];
}

export interface Auth {
  apiKey: string;
  regPin: string;
  clientUserName: string;
  createdDate: Date;
  childSelectors: string[];
  roleMap: RoleMap;
  roleIds: string[];
  clientSchema: string;
}

export interface LoginResult {
  _id: string;
  varName: string;
  metaData: MetaData;
  accountOptions: AccountOptions;
  enabled: boolean;
  deleted: boolean;
  createdDate: Date;
  activated: number;
  notificationTransports: any[];
  auth: Auth;
}

export interface LoginResponse {
  result: LoginResult;
}
