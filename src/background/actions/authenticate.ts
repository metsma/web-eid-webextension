import Action from "web-eid/models/Action";
import ProtocolInsecureError from "web-eid/errors/ProtocolInsecureError";
import UserTimeoutError from "web-eid/errors/UserTimeoutError";
import { serializeError } from "web-eid/utils/errorSerializer";

import TypedMap from "../../models/TypedMap";
import NativeAppService from "../services/NativeAppService";
import WebServerService from "../services/WebServerService";
import { toBase64, pick } from "../../shared/utils";

export default async function authenticate(
  getAuthChallengeUrl: string,
  postAuthTokenUrl: string,
  timeout: number,
): Promise<object | void> {
  let webServerService: WebServerService | undefined;
  let nativeAppService: NativeAppService | undefined;
  let timeoutCheckInterval: any;

  try {
    if (!getAuthChallengeUrl.startsWith("https:")) {
      throw new ProtocolInsecureError(`HTTPS required for getAuthChallengeUrl ${getAuthChallengeUrl}`);
    }

    if (!postAuthTokenUrl.startsWith("https:")) {
      throw new ProtocolInsecureError(`HTTPS required for postAuthTokenUrl ${postAuthTokenUrl}`);
    }

    webServerService = new WebServerService();
    nativeAppService = new NativeAppService();

    const nativeAppStatus = await nativeAppService.connect();

    console.log("Authenticate: connected to native", nativeAppStatus);

    const response = await webServerService.fetch<{ challenge: string }>(getAuthChallengeUrl);

    console.log("Authenticate: getAuthChallengeUrl fetched");

    const timeoutTime = (+ new Date()) + timeout;

    timeoutCheckInterval = setInterval(
      () => {
        if ((+ new Date()) > timeoutTime) {
          clearInterval(timeoutCheckInterval);
          nativeAppService?.close(new UserTimeoutError());
        }
      }
    );

    const token = await nativeAppService.send({
      command: "authenticate",

      arguments: {
        "nonce":       response.body.challenge,
        "origin":      (new URL(response.url)).origin,
        "origin-cert": (
          response.certificateInfo?.rawDER
            ? toBase64(response.certificateInfo?.rawDER)
            : null
        ),
      },
    });

    console.log("Authenticate: challenge solved");

    clearInterval(timeoutCheckInterval);

    const tokenResponse = await webServerService.fetch<any>(postAuthTokenUrl, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({ token }),
    });

    console.log("Authenticate: token accepted by the server");

    return {
      action: Action.AUTHENTICATE_SUCCESS,

      response: {
        ...pick(tokenResponse as TypedMap<any>, [
          "body",
          "headers",
          "ok",
          "redirected",
          "status",
          "statusText",
          "type",
          "url",
        ]),
      },
    };
  } catch (error) {
    console.error("action/authenticate", error);

    return {
      action: Action.AUTHENTICATE_FAILURE,
      error:  serializeError(error),
    };
  } finally {
    clearInterval(timeoutCheckInterval);
    if (nativeAppService) nativeAppService.close();
  }
}
