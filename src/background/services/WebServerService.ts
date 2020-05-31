import { OnHeadersReceivedDetails, CertificateInfo, Fingerprint } from "../../models/Browser/WebRequest";
import { iterableToObject } from "../../shared/utils";
import HttpResponse from "../../models/HttpResponse";

import TlsConnectionBrokenError from "web-eid/errors/TlsConnectionBrokenError";
import TlsConnectionInsecureError from "web-eid/errors/TlsConnectionInsecureError";
import TlsConnectionWeakError from "web-eid/errors/TlsConnectionWeakError";
import CertificateChangedError from "web-eid/errors/CertificateChangedError";
import ServerRejectedError from "web-eid/errors/ServerRejectedError";

export default class WebServerService {
  private fingerprints: Fingerprint[];

  constructor() {
    this.fingerprints = [];
  }

  hasCertificateChanged(): boolean {
    return !this.fingerprints.every((fingerprint) => this.fingerprints[0].sha256 === fingerprint.sha256);
  }

  async fetch<T>(fetchUrl: string, init?: RequestInit): Promise<HttpResponse<T>> {
    let certificateInfo: CertificateInfo | null;

    let fetchError: Error | null = null;

    certificateInfo = null;

    const onHeadersReceivedListener = async (details: OnHeadersReceivedDetails): Promise<any> => {
      const securityInfo = await browser.webRequest.getSecurityInfo(
        details.requestId,
        { rawDER: true }
      );

      switch (securityInfo.state) {
        case "secure": {
          certificateInfo = securityInfo.certificates[0];

          this.fingerprints.push(certificateInfo.fingerprint);

          if (this.hasCertificateChanged()) {
            fetchError = new CertificateChangedError();
            return { cancel: true };
          }

          break;
        }

        case "broken": {
          fetchError = new TlsConnectionBrokenError(`TLS connection was broken while requesting ${fetchUrl}`);
          return { cancel: true };
        }

        case "insecure": {
          fetchError = new TlsConnectionInsecureError(`TLS connection was insecure while requesting ${fetchUrl}`);
          return { cancel: true };
        }

        case "weak": {
          fetchError = new TlsConnectionWeakError(`TLS connection was weak while requesting ${fetchUrl}`);
          return { cancel: true };
        }

        default:
          fetchError = new Error("Unexpected connection security state");
          return { cancel: true };
      }
    };

    browser.webRequest.onHeadersReceived.addListener(
      onHeadersReceivedListener,
      { urls: [fetchUrl] },
      ["blocking"]
    );

    let response;

    try {
      response = await fetch(fetchUrl, init);
    } catch (error) {
      throw fetchError || error;
    }

    const headers  = iterableToObject(response.headers);

    const body = (
      headers["content-type"]?.includes("application/json")
        ? (await response.json())
        : (await response.text())
    ) as T;

    browser.webRequest.onHeadersReceived.removeListener(onHeadersReceivedListener);

    console.log("fingerprints", this.fingerprints);

    const {
      ok,
      redirected,
      status,
      statusText,
      type,
      url,
    } = response;

    const result = {
      certificateInfo,
      ok,
      redirected,
      status,
      statusText,
      type,
      url,
      body,
      headers,
    };

    if (!ok) {
      fetchError = new ServerRejectedError();
      Object.assign(fetchError, { request: result });
    }

    if (fetchError) {
      throw fetchError;
    }

    return result;
  }

  async getCertificateInfo(request: OnHeadersReceivedDetails): Promise<CertificateInfo | null> {
    const securityInfo = await browser.webRequest.getSecurityInfo(
      request.requestId,
      { rawDER: true }
    );

    const { state, certificates } = securityInfo;

    if (state === "secure" || state === "weak") {
      return certificates[0];
    }

    return null;
  }
}

