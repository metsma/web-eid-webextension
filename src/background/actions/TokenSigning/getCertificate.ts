/*
 * Copyright (c) 2020-2024 Estonian Information System Authority
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { NativeGetSigningCertificateRequest } from "@web-eid.js/models/message/NativeRequest";
import { NativeGetSigningCertificateResponse } from "@web-eid.js/models/message/NativeResponse";
import UserTimeoutError from "@web-eid.js/errors/UserTimeoutError";

import {
  TokenSigningCertResponse,
  TokenSigningErrorResponse,
} from "../../../models/TokenSigning/TokenSigningResponse";

import ByteArray from "../../../shared/ByteArray";
import NativeAppService from "../../services/NativeAppService";
import config from "../../../config";
import errorToResponse from "./errorToResponse";
import threeLetterLanguageCodes from "./threeLetterLanguageCodes";
import tokenSigningResponse from "../../../shared/tokenSigningResponse";

export default async function getCertificate(
  nonce: string,
  sourceUrl: string,
  lang?: string,
  filter: "AUTH" | "SIGN" = "SIGN",
): Promise<TokenSigningCertResponse | TokenSigningErrorResponse> {
  if (lang && Object.keys(threeLetterLanguageCodes).includes(lang)) {
    lang = threeLetterLanguageCodes[lang];
  }

  const nativeAppService = new NativeAppService();

  if (filter !== "SIGN") {
    const { message, name, stack } = new Error("Web-eID only allows signing with a signing certificate");

    return tokenSigningResponse<TokenSigningErrorResponse>("not_allowed", nonce, {
      message,
      name,
      stack,
    });
  }

  try {
    const nativeAppStatus = await nativeAppService.connect();

    config.DEBUG && console.log("Get certificate: connected to native", nativeAppStatus);

    const message: NativeGetSigningCertificateRequest = {
      command: "get-signing-certificate",

      arguments: {
        origin: (new URL(sourceUrl)).origin,

        ...(lang ? { lang } : {}),
      },
    };

    const response = await nativeAppService.send<NativeGetSigningCertificateResponse>(
      message,
      config.TOKEN_SIGNING_USER_INTERACTION_TIMEOUT,
      new UserTimeoutError(),
    );

    if (!response?.certificate) {
      return tokenSigningResponse<TokenSigningErrorResponse>("no_certificates", nonce);
    } else {
      return tokenSigningResponse<TokenSigningCertResponse>("ok", nonce, {
        cert: new ByteArray().fromBase64(response.certificate).toHex(),
      });
    }
  } catch (error) {
    console.error(error);
    return errorToResponse(nonce, error);
  } finally {
    nativeAppService.close();
  }
}
