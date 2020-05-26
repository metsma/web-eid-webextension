import Action from "web-eid/models/Action";

import NativeAppService from "../services/NativeAppService";
import config from "../../config";
import { toObject } from "../../shared/utils";

declare global {
  interface Window {
    nativeAppService: any;
  }
}

export default async function getStatus(options?: any): Promise<any> {
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
      ...toObject(error),
      extension,

      action: Action.STATUS_FAILURE,
    };
  }
}
