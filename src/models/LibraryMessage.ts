import Action from "@web-eid/web-eid-library/models/Action";
import TypedMap from "./TypedMap";

export type LibraryMessage
  = StatusRequestMessage
  | AuthenticateRequestMessage
  | SignRequestMessage;

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

export interface SignRequestMessage extends Object {
  action: Action.SIGN;
  postPrepareSigningUrl: string;
  postFinalizeSigningUrl: string;
  headers: TypedMap<string>;
  userInteractionTimeout: number;
  serverRequestTimeout: number;
}
