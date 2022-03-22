var express = require('express');
var https = require('https');
var httpProxy = require('http-proxy')
var http = require('http');
var fs = require('fs');
var path = require('path');
var WebSocketServer = require('websocket').server;

// This line is from the Node.js HTTPS documentation.
var options = {
  key: fs.readFileSync('C:\\Users\\Rob\\certs\\myCA3.key'),
  cert: fs.readFileSync('C:\\Users\\Rob\\certs\\myCA3.pem')
};

var proxy = httpProxy.createProxy({
    ws : true
});

console.log(path.resolve('./'));

// Create a service (the app object is just a callback).
var app = express()
    .get('/', (req, res) => {
        res.send('root')
    });

function log_error(e,req){
    if(e){
      console.error(e.message);
      console.log(req.headers.host,'-->',options[req.headers.host]);
      console.log('-----');
    }
}



// Create an HTTP service.
var serv1 = http.createServer(app);
serv1.listen(80);

wsServer = new WebSocketServer({
    httpServer: serv1,
    path: '/wss',
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: false
});

function originIsAllowed(origin) {
    // put logic here to detect whether the specified origin is allowed.
    return true;
}

wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin
      request.reject();
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }
    
    var connection = request.accept('echo-protocol', request.origin);
    console.log((new Date()) + ' Connection accepted.');
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log('Received Message: ' + message.utf8Data);
            connection.sendUTF(message.utf8Data);
        }
        else if (message.type === 'binary') {
            console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
            connection.sendBytes(message.binaryData);
        }
    });
    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
});

var serv2 = http.createServer(app);
serv2.on('upgrade',function(req,res){
    console.log("proxying...");
    proxy.ws(req, res, {
      target: 'ws://localhost:80/wss'
    },function(e){
      log_error(e,req);
    });
  })
serv2.listen(100);
// Create an HTTPS service identical to the HTTP service.
//https.createServer(options, app).listen(443);