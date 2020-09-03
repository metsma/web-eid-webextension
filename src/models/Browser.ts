import WebRequest from "./Browser/WebRequest";
import Runtime from "./Browser/Runtime";
import Permissions from "./Browser/Permissions";

declare global {
  const browser: Browser;
  const chrome: any;
}

export default interface Browser {
  /**
   * Add event listeners for the various stages of making an HTTP request,
   * which includes websocket requests on ws:// and wss://.
   * The event listener receives detailed information about the request and can modify or cancel the request.
   *
   * @see https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest
   */
  webRequest: WebRequest;

  /**
   * This module provides information about your extension and the environment it's running in.
   *
   * It also provides messaging APIs enabling you to:
   * - Communicate between different parts of your extension.
   *   For advice on choosing between the messaging options,
   *   see Choosing between one-off messages and connection-based messaging.
   * - Communicate with other extensions.
   * - Communicate with native applications.
   *
   * @see https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime
   */
  runtime: Runtime;

  /**
   * Enables discovering current extension permissions and the ability to add or remove permissions during runtime.
   *
   * @see https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/permissions
   */
  permissions: Permissions;
}
