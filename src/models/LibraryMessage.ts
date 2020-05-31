import Action from "web-eid/models/Action";

export type LibraryMessage
  = StatusRequestMessage
  | AuthenticateRequestMessage;

export interface StatusRequestMessage extends Object {
  action: Action.STATUS;
}

export interface AuthenticateRequestMessage extends Object {
  action: Action.AUTHENTICATE;
  getAuthChallengeUrl: string;
  postAuthTokenUrl: string;
  timeout: number;
}
