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
      reject();
    };

    cleanup = (): void => {
      port.onMessage.removeListener(onMessageListener);
      port.onMessage.removeListener(onMessageListener);
      if (timer) clearTimeout(timer);
    };


    timer = setTimeout(
      () => {
        cleanup?.();
        reject();
      },
      timeout,
    );

    port.onDisconnect.addListener(onDisconnectListener);
    port.onMessage.addListener(onMessageListener);
  });
}
