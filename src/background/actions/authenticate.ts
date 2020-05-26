import { hostFromUrl, toBase64, pick, toObject } from "../../shared/utils";
import { OnHeadersReceivedDetails, CertificateInfo } from "../../models/Browser/WebRequest";
import AwaitingResponseMap from "../../models/AwaitingResponseMap";
import NativeAppService from "../services/NativeAppService";
import WebServerService from "../services/WebServerService";
import HttpResponse from "../../models/HttpResponse";
import TypedMap from "../../models/TypedMap";
import Action from "web-eid/models/Action";

export default async function authenticate(
  getAuthChallengeUrl: string,
  postAuthTokenUrl: string,
): Promise<object | void> {
  let webServerService;
  let nativeAppService;

  try {
    webServerService = new WebServerService();
    nativeAppService = new NativeAppService();

    const nativeAppStatus = await nativeAppService.connect();

    console.log("Ready!", nativeAppStatus);

    const response = await webServerService.fetch<{ challenge: string }>(getAuthChallengeUrl);

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

    const tokenResponse = await webServerService.fetch<any>(postAuthTokenUrl, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({ token }),
    });

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
      ...toObject(error),

      action: Action.AUTHENTICATE_FAILURE,
    };
  } finally {
    if (nativeAppService) nativeAppService.close();
  }
}
