This is an interface, written in React.JS, to create certain sorts of annotations on a [Stemmarest](https://github.com/DHUniWien/tradition_repo) variant text. Use of this app assumes you have such a text in a Stemmarest repository somewhere. As written, the app also assumed that your text supports certain kinds of annotations:

- Person references, associated with individual persons
- Place references, associated with specific places
- Date references, associated with specific dates
- Dating of episodes in the text, associated with specific dates
- Translations of the text

## Initial setup and testing it out

For development purposes, this app consists of a frontend React app, which is the interface, and a backend app that proxies requests to the Stemmarest repository. To try it out, the first step is to install all necessary dependencies with the command

    yarn install

Next you will need to set two environment variables pointing to the Stemmarest server and the ID of the text/tradition you want to annotate. This can be done by creating a file in this directory called `.env.local`, whose contents should look like this:

    TRADITION=UUID-FOR-YOUR-TRADITION
    ENDPOINT=https://PATH.TO.YOUR/INSTANCE_OF/stemmarest

Once this is done, you can start the system with

    yarn dev

This will start both the "frontend" server on port 3000 and the "backend" server on port 5000. The interface will then be loaded in your browser.

## Deploying the application

When the app has been tested and (if necessary) modified, it can be set up to run in production with the following commands:

    yarn build
    cp server/index.js .
    TRADITION=UUID-FOR-YOUR-TRADITION ENDPOINT=https://PATH.TO.YOUR/INSTANCE_OF/stemmarest node index.js

Alternatively, you may use the Docker image that is available [here](https://hub.docker.com/repository/docker/chrysaphi/annotate). You will still need to set the appropriate environment variables when creating the container.
