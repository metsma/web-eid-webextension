import Action from "@web-eid/web-eid-library/models/Action";
import ProtocolInsecureError from "@web-eid/web-eid-library/errors/ProtocolInsecureError";
import UserTimeoutError from "@web-eid/web-eid-library/errors/UserTimeoutError";
import ServerTimeoutError from "@web-eid/web-eid-library/errors/ServerTimeoutError";
import OriginMismatchError from "@web-eid/web-eid-library/errors/OriginMismatchError";
import { serializeError } from "@web-eid/web-eid-library/utils/errorSerializer";

import NativeAppService, { NativeAppState } from "../services/NativeAppService";
import WebServerService from "../services/WebServerService";
import HttpResponse from "../../models/HttpResponse";
import TypedMap from "../../models/TypedMap";
import { pick, throwAfterTimeout, isSameOrigin } from "../../shared/utils";

export default async function sign(
  postPrepareSigningUrl: string,
  postFinalizeSigningUrl: string,
  headers: TypedMap<string>,
  userInteractionTimeout: number,
  serverRequestTimeout: number,
): Promise<object | void> {
  let webServerService: WebServerService | undefined;
  let nativeAppService: NativeAppService | undefined;

  try {
    if (!postPrepareSigningUrl.startsWith("https:")) {
      throw new ProtocolInsecureError(`HTTPS required for postPrepareSigningUrl ${postPrepareSigningUrl}`);
    }

    if (!postFinalizeSigningUrl.startsWith("https:")) {
      throw new ProtocolInsecureError(`HTTPS required for postFinalizeSigningUrl ${postFinalizeSigningUrl}`);
    }

    if (!isSameOrigin(postPrepareSigningUrl, postFinalizeSigningUrl)) {
      throw new OriginMismatchError();
    }

    webServerService = new WebServerService();
    nativeAppService = new NativeAppService();

    let nativeAppStatus = await nativeAppService.connect();

    console.log("Sign: connected to native", nativeAppStatus);

    const certificateResponse = await Promise.race([
      nativeAppService.send({
        command: "get-certificate",

        arguments: {
          "type":   "sign",
          "origin": (new URL(postPrepareSigningUrl)).origin,
        },
      }),

      throwAfterTimeout(userInteractionTimeout, new UserTimeoutError()),
    ]) as {
      certificate: string;
      error?: string;

      "supported-signature-algos": Array<{
        "crypto-algo":  string;
        "hash-algo":    string;
        "padding-algo": string;
      }>;
    };

    if (certificateResponse.error) {
      throw new Error(certificateResponse.error);
    } else if (!certificateResponse.certificate) {
      throw new Error("Missing signing certificate");
    }

    const { certificate } = certificateResponse;

    const supportedSignatureAlgorithms = certificateResponse["supported-signature-algos"].map((algorithmSet) => ({
      crypto:  algorithmSet["crypto-algo"],
      hash:    algorithmSet["hash-algo"],
      padding: algorithmSet["padding-algo"],
    }));

    const prepareDocumentResult = await Promise.race([
      webServerService.fetch(postPrepareSigningUrl, {
        method: "POST",

        headers: {
          ...headers,
          "Content-Type": "application/json",
        },

        body: JSON.stringify({ certificate, supportedSignatureAlgorithms }),
      }),

      throwAfterTimeout(
        serverRequestTimeout,
        new ServerTimeoutError(`server failed to respond in time - POST ${postPrepareSigningUrl}`),
      ),
    ]) as HttpResponse<{ hash: string; algorithm: string }>;

    console.log("Sign: postPrepareSigningUrl fetched", prepareDocumentResult);

    console.log("Native app state", nativeAppService.state);

    if (nativeAppService.state === NativeAppState.CONNECTED) {
      nativeAppService.close();
    }

    nativeAppService = new NativeAppService();

    nativeAppStatus = await nativeAppService.connect();

    console.log("Sign: reconnected to native", nativeAppStatus);

    const signatureResponse = await Promise.race([
      nativeAppService.send({
        command: "sign",

        arguments: {
          "doc-hash":      prepareDocumentResult.body.hash,
          "hash-algo":     prepareDocumentResult.body.algorithm,
          "origin":        (new URL(postPrepareSigningUrl)).origin,
          "user-eid-cert": certificate,
        },
      }),

      throwAfterTimeout(userInteractionTimeout, new UserTimeoutError()),
    ]) as { signature: string; error: string };

    if (signatureResponse.error) {
      throw new Error(signatureResponse.error);
    } else if (!signatureResponse.signature) {

      throw new Error("Missing sign signature");
    }

    const { signature } = signatureResponse;

    console.log("Sign: user signature received from native app", signature);

    const signatureVerifyResponse = await Promise.race([
      webServerService.fetch<any>(postFinalizeSigningUrl, {
        method: "POST",

        headers: {
          ...headers,
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          ...prepareDocumentResult.body,
          signature,
        }),
      }),

      throwAfterTimeout(
        serverRequestTimeout,
        new ServerTimeoutError(`server failed to respond in time - POST ${postFinalizeSigningUrl}`),
      ),
    ]);

    console.log("Sign: signature accepted by the server", signatureVerifyResponse);

    return {
      action: Action.SIGN_SUCCESS,

      response: {
        ...pick(signatureVerifyResponse, [
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
    console.error("Sign:", error);

    return {
      action: Action.SIGN_FAILURE,
      error:  serializeError(error),
    };
  } finally {
    if (nativeAppService) nativeAppService.close();
  }
}
