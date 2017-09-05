/**
 * Copyright 2017, Google, Inc.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const express = require('express');
const fs = require('fs');

var privateKey = fs.readFileSync('key.pem').toString();
var certificate = fs.readFileSync('cert.pem').toString();

var credentials = {key: privateKey, cert: certificate};

const app = express();

var https = require('https').Server(credentials, app);
var io = require('socket.io')(https);

app.use('/src', express.static(__dirname + '/src'));
app.use('/bower_components', express.static(__dirname + '/bower_components'));
app.use('/node_modules', express.static(__dirname + '/node_modules'));

app.get('/', (req, res) => {
  // TODO (eblaine): load whitelisted domains from file once the editor is live
  var options = {
    headers: {
      'Content-Security-Policy': "frame-ancestors 'self'"
    }
  }
  options = {};
  res.sendFile(__dirname + '/index.html', options);
});

app.get('/update-demo/:socketId/:filename', (req, res) => {
  var socketId = req.params.socketId;
  var filename = req.params.filename;
  var socket = io.sockets.connected[socketId];
  if (!socket) {
    return res.status(400).send('Demo does not exist or was not initialized');
  }

  socket.emit('html-import-request', filename);

  function responseCallback(fileData) {
    if (filename !== fileData.filename) return;

    res.status(200).send(fileData.content);
    socket.removeListener('html-import-response', responseCallback);
    socket.removeListener('html-import-error', errorCallback);    
  };

  function errorCallback(errorData) {
    if (filename !== errorData.filename) return;
  
    res.status(404).send(errorData.message);
    socket.removeListener('html-import-error', errorCallback);
    socket.removeListener('html-import-response', responseCallback);
  };

  socket.on('html-import-response', responseCallback);
  socket.on('html-import-error', errorCallback);
});

app.get('*', (req, res) => {
  res.status(404).send('Not found');
});

io.on('connection', function(socket){
  socket.on('client-connection', function() {
    socket.emit('server-acknowledgement', socket.id);
    socket.join(socket.id);
  });
});

// Start the server
const PORT = process.env.PORT || 8080;
https.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});
