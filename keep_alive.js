const http = require('http');
http.createServer(function (req, res) {
    res.write("THTrueMilk");
    res.end();
}).listen(8888);