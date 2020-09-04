import Action from "@web-eid/web-eid-library/models/Action";
import { serializeError } from "@web-eid/web-eid-library/utils/errorSerializer";

import config from "../../config";
import NativeAppService from "../services/NativeAppService";

export default async function getStatus(): Promise<any> {
  const extension = config.VERSION;

  try {
    const nativeAppService = new NativeAppService();
    const status           = await nativeAppService.connect();

    const nativeApp = (
      status.version.startsWith("v")
        ? status.version.substring(1)
        : status.version
    );

    nativeAppService.close();

    return {
      extension,
      nativeApp,

      action: Action.STATUS_SUCCESS,
    };
  } catch (error) {
    error.extension = extension;

    console.error("Status:", error);

    return {
      action: Action.STATUS_FAILURE,
      error:  serializeError(error),
    };
  }
}
