# Web-eID WebExtension

## Configure
1. Open `src/config.ts`
2. Make sure the `NATIVE_APP_NAME` value matches the one in Web-eID native application manifest file.

## Setup (for developers/testers)
1. Install the latest LTS version of Node.js - [https://nodejs.org](https://nodejs.org)
    - **Windows:** Install Node.js via the official installer.
    - **Linux and MacOS:**
      - **Option 1:** Install Node.js and NPM via the official Node.js installer and optionally configure NPM global package path manually.
        ___
        **The following steps can be skipped for this project!**
        The following steps configure the NPM global package path, so that installing packages globally and running them does not require root or `sudo`.
        1. On the command line, in your home directory, create a directory for global installations:
            ```bash
            mkdir ~/.npm-global
            ```
        2. Configure npm to use the new directory path:
            ```bash
            npm config set prefix '~/.npm-global'
            ```
        3. In your preferred text editor, open or create a `~/.profile` file and **add this line**:
            ```bash
            export PATH=~/.npm-global/bin:$PATH
            ```
        4. On the command line, update your system variables:
            ```bash
            source ~/.profile
            ```
        6. To test your new configuration, install a package globally without using `sudo`
            ```bash
            npm install -g pm2
            ```
    - **Option 2:** Install Node.js and NPM via NVM (Node Version Manager).
      This option is recommended by NPM, but unless you need to switch between different Node.js versions quickly, I would recommend the first option instead.
      Manual configuration is more transparent.

2. Clone the project
    ```bash
    git clone git@gitlab.com:web-eid/webextension/web-eid-webextension.git
    ```

3. Install dependencies
    ```bash
    cd web-eid-webextension
    npm install
    ```

4. Build the project with zip packages
    ```bash
    npm run clean build package
    ```

5. Load in Firefox as a Temporary Extension
    1. Open [about:debugging#/runtime/this-firefox](about:debugging#/runtime/this-firefox)
    2. Click "Load temporary Add-on..." and open `/web-eid-webextension/dist/manifest.json`

