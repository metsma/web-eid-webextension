import { Port } from "../../models/Browser/Runtime";
import config from "../../config";
import NativeUnavailableError from "web-eid/errors/NativeUnavailableError";
import UserCancelledError from "web-eid/errors/UserCancelledError";
import { nextMessage } from "../../shared/messageUtils";

type NativeAppPendingRequest = { reject?: Function; resolve?: Function } | null;

enum NativeAppStatus {
  UNINITIALIZED,
  CONNECTING,
  CONNECTED,
  DISCONNECTED,
}

export default class NativeAppService {
  private port: Port | null       = null;
  private status: NativeAppStatus = NativeAppStatus.UNINITIALIZED;

  private pending: NativeAppPendingRequest = null;

  async connect(): Promise<{ version: string }> {
    this.status = NativeAppStatus.CONNECTING;

    this.port = browser.runtime.connectNative(config.NATIVE_APP_NAME);
    this.port.onDisconnect.addListener(this.disconnectListener.bind(this));

    try {
      const message = await nextMessage(this.port, 10000);

      if (message.version) {
        this.status = NativeAppStatus.CONNECTED;

        return message;
      } else {
        throw new NativeUnavailableError(this.port.error.message);
      }
    } catch (error) {
      throw new NativeUnavailableError(error?.message || this.port.error.message);
    }
  }

  /*
  async connectOld(): Promise<void> {

    return new Promise((resolve, reject) => {
      let onResponse: Function | null = null;

      this.pending = { resolve, reject };
      this.port    = browser.runtime.connectNative(config.NATIVE_APP_NAME);

      this.port.onDisconnect.addListener(this.disconnectListener.bind(this));



      const connectTimer = setTimeout(() => {
        if (onResponse) {
          this.port?.onMessage.removeListener(onResponse);
        }

        reject(new NativeUnavailableError(this.port?.error.message));

        this.pending = null;
      }, 10000);



      onResponse = (message: any): void => {
        clearTimeout(connectTimer);
        if (onResponse) {
          this.port?.onMessage.removeListener(onResponse);
        }

        if (message.version) {
          resolve(message);
        } else {
          console.error("Unable to connect to native app", message);
          reject(new NativeUnavailableError());
        }

        this.pending = null;
      };

      this.port?.onMessage.addListener(onResponse);
    });
  }
  */

  disconnectListener(): void {
    this.status = NativeAppStatus.DISCONNECTED;
    this.pending?.reject?.(new UserCancelledError());
  }

  close(error?: any): void {
    console.log("Disconnecting...");
    this.status = NativeAppStatus.DISCONNECTED;

    this.pending?.reject?.(error);
    this.port?.disconnect();
  }

  send<T extends object>(message: object): Promise<T> {
    if (this.status === NativeAppStatus.UNINITIALIZED) {
      return Promise.reject(
        new Error("unable to send message, native application port is not initialized yet")
      );

    } else if (this.status === NativeAppStatus.CONNECTING) {
      return Promise.reject(
        new Error("unable to send message, native application port is still connecting")
      );

    } else if (this.status === NativeAppStatus.DISCONNECTED) {
      return Promise.reject(
        new Error("unable to send message, native application port is disconnected")
      );

    } else {
      return new Promise((resolve, reject) => {
        this.pending = { resolve, reject };

        const onResponse = (message: T): void => {
          resolve(message);
          this.port?.onMessage.removeListener(onResponse);
        };

        this.port?.onMessage.addListener(onResponse);

        console.log("sending message", JSON.stringify(message));
        this.port?.postMessage(message);
      });
    }
  }
}
