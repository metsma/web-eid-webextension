import TypedMap from "../models/TypedMap";

/**
 * Encode an array of bytes to a Base64 encoded string.
 *
 * @param byteArray Array of bytes to encode
 *
 * @returns The Base64 encoded string
 *
 * @example
 *   toBase64([72, 101, 108, 111])
 *   // =>  "SGVsbG8="
 */
export function toBase64(byteArray: number[]): string {
  return btoa(
    byteArray.reduce((acc, curr) => acc += String.fromCharCode(curr), "")
  );
}

/**
 * Transforms the Fetch API Header object to plain JSON.stringify-able object type.
 *
 * @param headers Fetch API Headers object
 *
 * @returns The headers in a simple object, where keys and values are strings.
 *
 * @example
 *   headersToObject(fetchResponse.headers)
 *   // => {
 *   //   "connection":     "keep-alive",
 *   //   "content-length": "49",
 *   //   "content-type":   "application/json; charset=utf-8",
 *   //   "date":           "Mon, 27 Apr 2020 06:28:54 GMT",
 *   //   "etag":           "W/\"30-YHV2nUGU912eoDvI+roJ2Yqn5SA\"",
 *   //   "x-powered-by":   "Express"
 *   // }
 */
export function headersToObject(headers: Headers): TypedMap<string> {
  function reducer(acc: TypedMap<string>, curr: Array<string>): TypedMap<string> {
    if (typeof curr[0] == "string") {
      acc[curr[0]] = curr[1];
    }
    return acc;
  }

  const headersArray = [...headers.entries()];
  const headersMap   = headersArray.reduce(reducer, {});

  return headersMap;
}

/**
 * Creates an object composed of the picked object properties.
 *
 * @param object Object to pick from
 * @param keys   Keys to pick from the object
 *
 * @returns The new object
 *
 * @example
 *   const object = { "a": 1, "b": 2, "c": 3 };
 *   pick(object, ["a", "b"]);
 *   // => { "a": 1, "b": 2 }
 */
export function pick(object: any, keys: string[]): object {
  return Object.keys(object)
    .filter((objectKey: string) => keys.includes(objectKey))
    .reduce((acc: TypedMap<string>, curr) => (acc[curr] = object[curr], acc), {});
}

export function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), milliseconds);
  });
}

export async function throwAfterTimeout(milliseconds: number, error: any): Promise<void> {
  await sleep(milliseconds);
  throw error;
}
