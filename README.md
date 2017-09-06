# polymer-live-editor-server
Server and client code for previewing the results of
user code typed in `polymer-live-editor` elements. This 
server is aware of all Polymer elements.

# Usage

## Running the server
To run an instance of `polymer-live-editor-server` locally, clone
this repo and run:

    npm install
    ./start.sh

This will start a server listening on `https://localhost:8080`, unless
your machine's `$PORT` is set to something else. The server-side
code resolves HTML import requests in the client code (which
is retrieved from the contents of a `polymer-live-editor`
instance.)

## HTTPS 
This server uses secure cookies to validate socket communication 
requests. For this reason, the start script expects to see 
files containing SSL certificate data. 

Please do one of the following with your credentials:
1. Name your key and cert files `key.pem` and `cert.pem`,
respectively, and place them at the root of this project (out
of version control.)
2. Set environment variables `$KEYFILE` and `$CERTFILE`, with
values being paths to those files on your machine.

## Using with `polymer-live-editor`
This application will not work as expected unless used in
conjunction with `polymer-live-editor`. To use this server,
set the `src` attribute of a `polymer-live-editor` to point
to this server. The `polymer-live-editor` will create
an `<iframe>` to display the results of code typed in the editor. 

# How it works
A `polymer-live-editor` creates an `<iframe>` pointing to
this server. This launches a handshake, which will open a
socket for further communication, provided the domain containing
the frame has been whitelisted. 

As a user types in the `polymer-live-editor`, the client side
of this repo (in `src`) attempts to display the results of 
the user's code. If the code contains HTML imports for files other
than those found in `bower_components` or `node_modules`, the 
server-side code (in `app.js`) will use the socket alluded to above
to resolve those imports. 

As an example, say a `polymer-live-editor` user is editing
two files: `custom-element.html` and `index.html`. Here are the contents
of `custom-element.html`:

    <link rel="import"  href="/bower_components/polymer/polymer-element.html">

    <script>
      // Define the class for a new element called custom-element
      class CustomElement extends Polymer.Element {
        static get is() { return "custom-element"; }
        constructor() {
            super();
            this.textContent = "I'm a custom-element.";
          }
      }
      // Register the new element with the browser
      customElements.define(CustomElement.is, CustomElement);
    </script>

And here is `index.html`:

    <script src="/bower_components/webcomponentsjs/webcomponents-loader.js"></script>
    <link rel="import" href="custom-element.html">
    <custom-element></custom-element>

In this case, the client code will use `document.write()` to write the 
contents of `index.html`. During this process, the server will use a socket
to request the contents of `custom-element.html` and return the
user code in `custom-element.html`. If no such file exists either on the filesystem
or in the user code, then the server returns a 404. 




