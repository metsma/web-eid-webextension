import Action from "@web-eid/web-eid-library/models/Action";
import libraryConfig from "@web-eid/web-eid-library/config";

import { LibraryMessage } from "../models/LibraryMessage";
import authenticate from "./actions/authenticate";
import getStatus from "./actions/getStatus";

browser.runtime.onMessage.addListener((message: LibraryMessage) => {
  switch (message.action) {
    case Action.AUTHENTICATE:
      return authenticate(
        message.getAuthChallengeUrl,
        message.postAuthTokenUrl,
        message.userInteractionTimeout || libraryConfig.DEFAULT_USER_INTERACTION_TIMEOUT,
        message.serverRequestTimeout   || libraryConfig.DEFAULT_SERVER_REQUEST_TIMEOUT,
      );

    case Action.STATUS:
      return getStatus();

    default:
      return;
  }
});
