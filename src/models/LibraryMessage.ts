import Action from "@web-eid/web-eid-library/models/Action";

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
  userInteractionTimeout: number;
  serverRequestTimeout: number;
}
