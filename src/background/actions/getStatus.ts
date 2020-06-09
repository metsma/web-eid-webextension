import Action from "web-eid/models/Action";
import { serializeError } from "web-eid/utils/errorSerializer";

import config from "../../config";
import NativeAppService from "../services/NativeAppService";

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
    error.extension = extension;

    return {
      action: Action.STATUS_FAILURE,
      error:  serializeError(error),
    };
  }
}
