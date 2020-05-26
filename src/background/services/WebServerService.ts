import { OnHeadersReceivedDetails, CertificateInfo, Fingerprint } from "../../models/Browser/WebRequest";
import { iterableToObject } from "../../shared/utils";
import HttpResponse from "../../models/HttpResponse";

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

    certificateInfo = null;

    const onHeadersReceivedListener = async (details: OnHeadersReceivedDetails): Promise<any> => {
      const securityInfo = await browser.webRequest.getSecurityInfo(
        details.requestId,
        { rawDER: true }
      );

      if (["secure", "weak"].includes(securityInfo?.state)) {
        certificateInfo = securityInfo.certificates[0];

        this.fingerprints.push(certificateInfo.fingerprint);

        if (this.hasCertificateChanged()) {


          return {
            cancel: true,
          };
        }
      }
    };

    browser.webRequest.onHeadersReceived.addListener(
      onHeadersReceivedListener,
      { urls: [fetchUrl] },
      ["blocking"]
    );

    try {
      const response = await fetch(fetchUrl, init);

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

      return {
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
    } catch (error) {
      if (this.hasCertificateChanged()) {
        throw new Error("Server certificate changed during authentication");
      } else {
        throw error;
      }
    }
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

