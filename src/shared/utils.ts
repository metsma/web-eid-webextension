import TypedMap from "../models/TypedMap";

export function hostFromUrl(url: string): string {
  return (new URL(url)).host;
}

export function toHexString(byteArray: number[]): string {
  return Array.from(byteArray, function (byte) {
    return ("0" + (byte & 0xFF).toString(16)).slice(-2);
  }).join("");
}

export function toBase64(byteArray: number[]): string {
  return btoa(
    byteArray.reduce((acc, curr) => acc += String.fromCharCode(curr), "")
  );
}

export function matchEvent(event: any): any {
  let target: string;
  let action: string;

  function isMatching(): boolean {
    return (
      event.source === window &&
      event.data &&
      event.data.target === target &&
      event.data.action === action
    );
  }

  return {
    target: (t: string): any => {
      target = t;

      return {
        action: (a: string): any => {
          action = a;

          return isMatching();
        },
      };
    },
  };
}

export function iterableToObject(headers: Headers): TypedMap<string> {
  function reducer(acc: TypedMap<string>, curr: Array<string>): TypedMap<string> {
    if (typeof curr[0] == "string") {
      acc[curr[0]] = curr[1];
    }
    return acc;
  }

  const headersArray = [...headers.entries()];
  const headersMap = headersArray.reduce(reducer, {});

  return headersMap;
}

/**
 * Creates an object composed of the picked object properties.
 *
 * @param object Object to pick from
 * @param keys   Keys to pick from the object
 *
 * @returns The new object.
 *
 * @example
 *   const object = { "a": 1, "b": 2, "c": 3 };
 *   pick(object, ["a", "b"]);
 *   // => { "a": 1, "b": 2 }
 */
export function pick(object: TypedMap<string>, keys: string[]): object {
  return Object.keys(object)
    .filter((objectKey: string) => keys.includes(objectKey))
    .reduce((acc: TypedMap<string>, curr) => (acc[curr] = object[curr], acc), {});
}

export function until(predicate: () => boolean | void, timeout: number): Promise<boolean> {
  return new Promise((resolve) => {
    let timeoutTimer:  any = null;
    let intervalTimer: any = null;

    timeoutTimer = setTimeout(() => {
      clearInterval(intervalTimer);
      resolve(false);
    }, timeout);

    intervalTimer = setInterval(() => {
      const result = predicate();

      console.log("until result", result);

      if (typeof result === "boolean") {
        clearTimeout(timeoutTimer);
        clearInterval(intervalTimer);
        resolve(result);
      }
    }, 200);
  });
}

export function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), milliseconds);
  });
}

export async function nightmare(milliseconds: number, error: any): Promise<void> {
  await sleep(milliseconds);
  throw error;
}

export function toObject(objectLike: any): object {
  if (!objectLike) return {};

  return Object.fromEntries(
    Object.getOwnPropertyNames(objectLike)
      .map((prop) => [prop, objectLike[prop]])
  );
}
