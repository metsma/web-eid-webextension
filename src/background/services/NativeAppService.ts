import NativeUnavailableError from "@web-eid/web-eid-library/errors/NativeUnavailableError";
import UserCancelledError from "@web-eid/web-eid-library/errors/UserCancelledError";
import libraryConfig from "@web-eid/web-eid-library/config";

import config from "../../config";
import { Port } from "../../models/Browser/Runtime";

type NativeAppPendingRequest = { reject?: Function; resolve?: Function } | null;

export enum NativeAppState {
  UNINITIALIZED,
  CONNECTING,
  CONNECTED,
  DISCONNECTED,
}

export default class NativeAppService {
  public state: NativeAppState = NativeAppState.UNINITIALIZED;

  private port: Port | null = null;
  private pending: NativeAppPendingRequest = null;

  async connect(): Promise<{ version: string }> {
    this.state = NativeAppState.CONNECTING;

    this.port = browser.runtime.connectNative(config.NATIVE_APP_NAME);
    this.port.onDisconnect.addListener(this.disconnectListener.bind(this));

    try {
      const message = await this.nextMessage(libraryConfig.NATIVE_APP_HANDSHAKE_TIMEOUT);

      if (message.version) {
        this.state = NativeAppState.CONNECTED;

        return message;
      }

      if (message) {
        throw new NativeUnavailableError(
          `expected native application to reply with a version, got ${JSON.stringify(message)}`
        );
      } else if (this.port.error) {
        throw new NativeUnavailableError(this.port.error.message);
      } else {
        throw new NativeUnavailableError("unexpected error");
      }
    } catch (error) {
      if (this.port.error) {
        console.error(this.port.error);
      }

      if (error instanceof NativeUnavailableError) {
        throw error;
      } else if (error?.message) {
        throw new NativeUnavailableError(error?.message);
      } else if (this.port.error?.message) {
        throw new NativeUnavailableError(this.port.error.message);
      } else {
        throw new NativeUnavailableError("unexpected error");
      }
    }
  }

  disconnectListener(): void {
    // Accessing lastError when it exists stops chrome from throwing it unnecessarily.
    chrome?.runtime?.lastError;

    this.state = NativeAppState.DISCONNECTED;
    this.pending?.reject?.(new UserCancelledError());
    this.pending = null;
  }

  close(error?: any): void {
    console.log("Disconnecting from native app");
    this.state = NativeAppState.DISCONNECTED;

    this.pending?.reject?.(error);
    this.pending = null;
    this.port?.disconnect();
  }

  send<T extends object>(message: object): Promise<T> {
    switch (this.state) {
      case NativeAppState.CONNECTED: {
        return new Promise((resolve, reject) => {
          this.pending = { resolve, reject };

          const onResponse = (message: T): void => {
            this.port?.onMessage.removeListener(onResponse);
            resolve(message);
            this.pending = null;
          };

          this.port?.onMessage.addListener(onResponse);

          console.log("Sending message to native app", JSON.stringify(message));
          this.port?.postMessage(message);
        });
      }

      case NativeAppState.UNINITIALIZED: {
        return Promise.reject(
          new Error("unable to send message, native application port is not initialized yet")
        );
      }

      case NativeAppState.CONNECTING: {
        return Promise.reject(
          new Error("unable to send message, native application port is still connecting")
        );
      }

      case NativeAppState.DISCONNECTED: {
        return Promise.reject(
          new Error("unable to send message, native application port is disconnected")
        );
      }

      default: {
        return Promise.reject(
          new Error("unable to send message, unexpected native app state")
        );
      }
    }
  }

  nextMessage(timeout: number): Promise<any> {
    return new Promise((resolve, reject) => {
      let cleanup: Function | null = null;
      let timer: ReturnType<typeof setTimeout> | null = null;

      const onMessageListener = (message: any): void => {
        cleanup?.();
        resolve(message);
      };

      const onDisconnectListener = (): void => {
        cleanup?.();
        reject(new NativeUnavailableError(
          "a message from native application was expected, but native application closed connection"
        ));
      };

      cleanup = (): void => {
        this.port?.onDisconnect.removeListener(onDisconnectListener);
        this.port?.onMessage.removeListener(onMessageListener);
        if (timer) clearTimeout(timer);
      };

      timer = setTimeout(
        () => {
          cleanup?.();
          reject(new NativeUnavailableError(
            `a message from native application was expected, but message wasn't received in ${timeout}ms`
          ));
        },
        timeout,
      );

      if (!this.port) {
        return reject(new NativeUnavailableError("missing native application port"));
      }

      this.port.onDisconnect.addListener(onDisconnectListener);
      this.port.onMessage.addListener(onMessageListener);
    });
  }
}
