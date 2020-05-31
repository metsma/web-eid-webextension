import Action from "web-eid/models/Action";
import { serializeError } from "web-eid/utils/errorSerializer";

import NativeAppService from "../services/NativeAppService";
import config from "../../config";

declare global {
  interface Window {
    nativeAppService: any;
  }
}

export default async function getStatus(): Promise<any> {
  const extension = config.VERSION;

  try {
    const nativeAppService = new NativeAppService();
    const status           = await nativeAppService.connect();
    const nativeApp        = status.version;

    nativeAppService.close();

    return {
      extension,
      nativeApp,

      action: Action.STATUS_SUCCESS,
    };
  } catch (error) {
    console.error("onStatus error", error);

    return {
      action: Action.STATUS_FAILURE,
      error:  serializeError(error),
      extension,
    };
  }
}
