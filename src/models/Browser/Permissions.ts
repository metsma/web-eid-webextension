export interface PermissionsObject {

  /**
   * An array of match patterns, representing host permissions.
   *
   * @see https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Match_patterns
   */
  origins?: Array<string>;

  /**
   * An array of named permissions, including API permissions and clipboard permissions.
   *
   * @see https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/permissions
   */
  permissions?: Array<string>;
}

export default interface Permissions {

  /**
   * Check whether the extension has the permissions listed in the given permissions.Permissions object.
   *
   * The Permissions argument may contain either an origins property, which is an array of host permissions,
   * or a permissions property, which is an array of API permissions, or both.
   *
   * This is an asynchronous function that returns a Promise.
   * The promise is fulfilled with true only if all the extension currently has all the given permissions.
   * For host permissions, if the extension's permissions pattern-match the permissions listed in origins,
   * then they are considered to match.
   */
  contains: (permissionsObject: PermissionsObject) => Promise<boolean>;

  /**
   * Retrieve a permissions.Permissions object containing all the permissions currently granted to the extension.
   *
   * This is an asynchronous function that returns a Promise.
   */
  getAll: () => Promise<PermissionsObject>;

  /**
   * Ask to give up the permissions listed in the given permissions.Permissions object.
   *
   * A Promise that will be fulfilled with true if the permissions listed in the permissions argument were removed,
   * or false otherwise.
   */
  remove: (permissionsObject: PermissionsObject) => Promise<boolean>;

  /**
   * Ask for the set of permissions listed in the given permissions.Permissions object.
   *
   * The Permissions argument may contain either an origins property, which is an array of host permissions,
   * or a permissions property, which is an array of API permissions, or both.
   * Permissions must come from the set of permissions defined in the optional_permissions manifest.json key.
   * The origins property may include permissions that match a subset of the hosts matched
   * by an optional permission: for example, if optional_permissions include "*://mozilla.org/",
   * then permissions.origins may include "https://developer.mozilla.org/".
   *
   * The request can only be made inside the handler for a user action.
   *
   * Depending on a circumstances, the browser will probably handle the request
   * by asking the user whether to grant the requested permissions. Only a single request is made
   * for all requested permissions: thus either all permissions are granted or none of them are.
   *
   * Any permissions granted are retained by the extension, even over upgrade and disable/enable cycling.
   *
   * This is an asynchronous function that returns a Promise.
   */
  request: (permissionsObject: PermissionsObject) => Promise<boolean>;
}
