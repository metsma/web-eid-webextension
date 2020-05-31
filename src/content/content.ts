import Action from "web-eid/models/Action";
import ContextInsecureError from "web-eid/errors/ContextInsecureError";

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
      switch (event.data.action) {
        case Action.AUTHENTICATE:
        case Action.STATUS: {
          const response = await send(event.data);
          window.postMessage(response, event.origin);
          break;
        }
      }
    }
  }
});
