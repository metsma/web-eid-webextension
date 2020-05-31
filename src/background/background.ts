import Action from "web-eid/models/Action";

import { LibraryMessage } from "../models/LibraryMessage";
import authenticate from "./actions/authenticate";
import getStatus from "./actions/getStatus";

browser.runtime.onMessage.addListener((message: LibraryMessage) => {
  switch (message.action) {
    case Action.AUTHENTICATE:
      return authenticate(message.getAuthChallengeUrl, message.postAuthTokenUrl, message.timeout);

    case Action.STATUS:
      return getStatus();

    default:
      return;
  }
});
