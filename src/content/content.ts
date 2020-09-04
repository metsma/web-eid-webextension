import Action from "@web-eid/web-eid-library/models/Action";
import ContextInsecureError from "@web-eid/web-eid-library/errors/ContextInsecureError";

function isValidEvent(event: MessageEvent): boolean {
  return (
    event.source === window &&
    event.data?.action?.startsWith?.("web-eid:")
  );
}

async function send(message: object): Promise<object | void> {
  const response = await browser.runtime.sendMessage(message);
  console.log("Content.send response", response);
  return response;
}

window.addEventListener("message", async (event) => {
  if (isValidEvent(event)) {
    console.log("message event: ", event);

    if (!window.isSecureContext) {
      const response = {
        action: Action.AUTHENTICATE_FAILURE,
        error:  new ContextInsecureError(),
      };

      window.postMessage(response, event.origin);

    } else {
      let response;

      switch (event.data.action) {
        case Action.STATUS: {
          window.postMessage({ action: Action.STATUS_ACK }, event.origin);
          response = await send({ action: Action.STATUS });
          break;
        }

        case Action.AUTHENTICATE: {
          window.postMessage({ action: Action.AUTHENTICATE_ACK }, event.origin);
          response = await send(event.data);
          break;
        }
      }

      if (response) {
        window.postMessage(response, event.origin);
      }
    }
  }
});
