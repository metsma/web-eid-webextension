# Web-eID WebExtension

## Configure
1. Open `src/config.ts`
2. Make sure the `NATIVE_APP_NAME` value matches the one in Web-eID native application manifest file.

## Setup (for developers/testers)
1. Install the latest LTS version of Node.js - [https://nodejs.org](https://nodejs.org)

2. Clone the project
    ```bash
    git clone git@gitlab.com:web-eid/webextension/web-eid-webextension.git
    ```

3. Install dependencies
    ```bash
    cd web-eid-webextension
    npm install
    ```

4. Build the project
    ```bash
    npm run build
    ```

5. Load in Firefox as a Temporary Extension
    1. Open [about:debugging#/runtime/this-firefox](about:debugging#/runtime/this-firefox)
    2. Click "Load temporary Add-on..." and open `/web-eid-webextension/dist/manifest.json`

