import TypedMap from "../models/TypedMap";

export function toBase64(byteArray: number[]): string {
  return btoa(
    byteArray.reduce((acc, curr) => acc += String.fromCharCode(curr), "")
  );
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

export function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), milliseconds);
  });
}

export async function nightmare(milliseconds: number, error: any): Promise<void> {
  await sleep(milliseconds);
  throw error;
}
