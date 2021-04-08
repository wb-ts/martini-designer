# Martini IDE

This project is the IDE for the Martini Runtime built with Theia, React and TypeScript.
It has a desktop (Electron based) version and a browser one.

## Getting started

### Install Node.js and NPM

Install [nvm](https://github.com/creationix/nvm#install-script).

    curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.5/install.sh | bash

Install npm and node.

    nvm install 12.14.1
    nvm use 12.14.1

### Install yarn and lerna

Install yarn.

    npm install -g yarn

Install lerna

    yarn global add lerna

## Building

Run `yarn` in the project root.

## Running Tests

Run `yarn jest` in the project root.

## Starting the Application

First start your Martini Runtime server on `localhost:8080`.

In order to connect to the Martini Runtime server, Martini Designer needs to know the credentials of your account. You can pass them by using the `MR_USERNAME` and `MR_PASSWORD` env variables.

If you're using VS Code to launch, replace the env variable values in `.vscode/launch.json`.

### Browser App

    # only the first time
    yarn theia rebuild:browser

    cd browser-app
    yarn start

Or launch the `Start Browser Backend` in the `.vscode/launch.json` file.

### Electron App

    # only the first time
    yarn theia rebuild:electron

    cd electron-app
    yarn start

Or launch the `Start Electron Backend` in the `.vscode/launch.json` file.

## Watching for Changes

To rebuild the packages when there is changes, run `lerna run --parallel watch` in the project root.
