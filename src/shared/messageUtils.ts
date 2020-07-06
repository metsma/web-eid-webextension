import { Port } from "../models/Browser/Runtime";

export function nextMessage(port: Port, timeout: number): Promise<any> {
  return new Promise((resolve, reject) => {
    let cleanup: Function | null                    = null;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const onMessageListener = (message: any): void => {
      cleanup?.();
      resolve(message);
    };

    const onDisconnectListener = (): void => {
      cleanup?.();
      reject("native application closed connection");
    };

    cleanup = (): void => {
      port.onDisconnect.removeListener(onDisconnectListener);
      port.onMessage.removeListener(onMessageListener);
      if (timer) clearTimeout(timer);
    };

    timer = setTimeout(
      () => {
        cleanup?.();
        reject(`native application failed to reply in ${timeout}ms`);
      },
      timeout,
    );

    port.onDisconnect.addListener(onDisconnectListener);
    port.onMessage.addListener(onMessageListener);
  });
}
