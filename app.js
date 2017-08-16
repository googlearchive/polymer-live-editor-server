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

// [START app]
const express = require('express');

const app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use('/src', express.static('src'));
app.use('/bower_components', express.static('bower_components'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/:socketId/:filename', (req, res) => {
  var socketId = req.params.socketId;
  var filename = req.params.filename;
  var socket = io.sockets.connected[socketId];
  if (!socket)
    return res.status(400).send('Demo does not exist or was not initialized');

  socket.emit('html-import-request', filename);

  function responseCallback(fileData) {
    if (filename !== fileData.filename)
      return;
    res.status(200).send(fileData.content);
    socket.removeListener('html-import-response', responseCallback);
    socket.removeListener('html-import-error', errorCallback);    
  };

  function errorCallback(errorData) {
    if (filename !== errorData.filename)
      return;
  
    res.status(404).send(errorData.message);
    socket.removeListener('html-import-error', errorCallback);
    socket.removeListener('html-import-response', responseCallback);
  };

  socket.on('html-import-response', responseCallback);
  socket.on('html-import-error', errorCallback);

});

// app.get('/update-demo/:filename/:socketId', function(req, res) {
//   console.log('update-demo');
//   let socketId = req.params.socketId;
//   let filename = req.params.filename;
//   req.session[filename] = socketId;
//   console.log(filename);
//   console.log(req.params.socketId);
//   console.log(req.session[filename]);
//   console.log('-----')
//   res.status(200).send('file ' + filename + ' added to socket');
// });

// // 404 redirect handles failed HTML imports 
// app.get('*', function(req, res){
//   let filename = req.url.trim().substring(1);
//   if (!req.session[filename]) {
//     res.status(404).send('Not found');
//     return;
//   }

//   console.log(req.session[filename]);
//   console.log(Object.keys(io.sockets.connected));
//   return res.status(200).send('ok');

//   var socket = io.sockets.connected[req.session[filename]];
  
//   if (!socket) {
//     res.status(400).send('Socket not connected');
//     return;
//   }
//   // console.log(io.sockets.connected);
//   // console.log('emitting request for file

//   socket.to(socket.id).emit('html-import-request', filename);
//   let resolve, reject;
//   var promise = new Promise(function(res, rej) {
//       resolve = res;
//       reject = rej;
//     });

//   function createResponseCallback(resolve) {
//     return function responseCallback(fileData) {
//       console.log('received req ', fileData);
//       if (filename !== fileData.filename)
//         return;
//       // res.status(200).send(fileData.content);
//       resolve(fileData.content);
//       socket.removeListener('html-import-response', responseCallback);
//       socket.removeListener('html-import-error', errorCallback);    
//     };
//   };

//   function createErrorCallback(reject) {
//     return function errorCallback(errorData) {
//       if (filename !== errorData.filename)
//         return;
      
      
//       reject(errorData.message);
//       socket.removeListener('html-import-error', errorCallback);
//       socket.removeListener('html-import-response', responseCallback);
//     };
//   }

//   socket.on('html-import-response', createResponseCallback(resolve));
//   socket.on('html-import-error', createErrorCallback(reject));
//   return promise;
// });

app.get('*', (req, res) => {
  res.status(404).send('Not found');
})

io.on('connection', function(socket){
  socket.on('client-connection', function() {
    socket.emit('server-acknowledgement', socket.id);
    socket.join(socket.id);
  });

});

// Start the server
// console.log(http.address().address);
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});
// [END app]