import Action from "@web-eid/web-eid-library/models/Action";
import ProtocolInsecureError from "@web-eid/web-eid-library/errors/ProtocolInsecureError";
import UserTimeoutError from "@web-eid/web-eid-library/errors/UserTimeoutError";
import ServerTimeoutError from "@web-eid/web-eid-library/errors/ServerTimeoutError";
import { serializeError } from "@web-eid/web-eid-library/utils/errorSerializer";

import NativeAppService from "../services/NativeAppService";
import WebServerService from "../services/WebServerService";
import { toBase64, pick, throwAfterTimeout } from "../../shared/utils";
import HttpResponse from "../../models/HttpResponse";
import TypedMap from "../../models/TypedMap";

export default async function authenticate(
  getAuthChallengeUrl: string,
  postAuthTokenUrl: string,
  headers: TypedMap<string>,
  userInteractionTimeout: number,
  serverRequestTimeout: number,
): Promise<object | void> {
  let webServerService: WebServerService | undefined;
  let nativeAppService: NativeAppService | undefined;

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

    const response = await Promise.race([
      webServerService.fetch(getAuthChallengeUrl, {
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
      }),

      throwAfterTimeout(
        serverRequestTimeout,
        new ServerTimeoutError(`server failed to respond in time - GET ${getAuthChallengeUrl}`),
      ),
    ]) as HttpResponse<{ nonce: string }>;

    console.log("Authenticate: getAuthChallengeUrl fetched");

    const token = await Promise.race([
      nativeAppService.send({
        command: "authenticate",

        arguments: {
          "nonce":  response.body.nonce,
          "origin": (new URL(response.url)).origin,

          "origin-cert": (
            response.certificateInfo?.rawDER
              ? toBase64(response.certificateInfo?.rawDER)
              : null
          ),
        },
      }),

      throwAfterTimeout(userInteractionTimeout, new UserTimeoutError()),
    ]);

    console.log("Authenticate: authentication token received");

    const tokenResponse = await Promise.race([
      webServerService.fetch<any>(postAuthTokenUrl, {
        method: "POST",

        headers: {
          ...headers,
          "Content-Type": "application/json",
        },

        body: JSON.stringify(token),
      }),

      throwAfterTimeout(
        serverRequestTimeout,
        new ServerTimeoutError(`server failed to respond in time - POST ${postAuthTokenUrl}`),
      ),
    ]);

    console.log("Authenticate: token accepted by the server");

    return {
      action: Action.AUTHENTICATE_SUCCESS,

      response: {
        ...pick(tokenResponse, [
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
    console.error("Authenticate:", error);

    return {
      action: Action.AUTHENTICATE_FAILURE,
      error:  serializeError(error),
    };
  } finally {
    if (nativeAppService) nativeAppService.close();
  }
}
