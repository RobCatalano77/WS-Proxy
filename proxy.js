var httpProxy = require('http-proxy')

var proxy = httpProxy.createProxy({
  ws : true
});

var options = {
  'herp.dev': 'http://0.0.0.0:9008',
  'derp.dev' : 'http://0.0.0.0:3000'
}

var server = require('http').createServer(function(req, res) {
  proxy.web(req, res, {
    target: options[req.headers.host]
  },function(e){
    log_error(e,req);
  });
})

server.on('upgrade',function(req,res){
  proxy.ws(req, res, {
    target: options[req.headers.host]
  },function(e){
    log_error(e,req);
  });
})

server.listen(80)

function log_error(e,req){
  if(e){
    console.error(e.message);
    console.log(req.headers.host,'-->',options[req.headers.host]);
    console.log('-----');
  }
}