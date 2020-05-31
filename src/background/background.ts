import { LibraryMessage, StatusRequestMessage, AuthenticateRequestMessage } from "../models/LibraryMessage";
import Action from "web-eid/models/Action";
import authenticate from "./actions/authenticate";
import getStatus from "./actions/getStatus";

// If we want an instance of the native app per request
browser.runtime.onMessage.addListener((message: LibraryMessage, sender) => {
  console.log("background", message);

  switch (message.action) {
    case Action.AUTHENTICATE:
      return authenticate(message.getAuthChallengeUrl, message.postAuthTokenUrl, message.timeout);

    case Action.STATUS:
      return getStatus();

    default:
      return;
  }
});
