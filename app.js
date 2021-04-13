const express = require("express");
const config = require('config');
const PORT = config.get('port') || 7071;
const app = express();
const expressWs = require('express-ws')(app);
const http = require("http");
const WebSocket = require( "ws");


// Logger configuration
const log4js = require('log4js');
const KafkaConsumers = require("./consumers/KafkaConsumers");
log4js.configure('./config/log4js-config.json');
const logger = log4js.getLogger('app');


const server = http.createServer(app);

const webSocketServer = new WebSocket.Server({ server });

// We define a handler that will be called everytime a new
// Websocket connection is made
const wsHandler = (ws) => {
    // Add the connection to our set
    connections.add(ws)

    // We define the handler to be called everytime this
    // connection receives a new message from the client
    ws.on('message', (message) => {
        // Once we receive a message, we send it to all clients
        // in the connection set
        // connections.forEach((conn) => conn.send(message))
        let data = JSON.parse(message);
        if (data.give === 'statuses')
            console.log(data);
    });

    ws.on('connection', (wss) => {
        let msg = {
            data: KafkaConsumers.getStatusHistory(),
            type: 'status'
        }
        console.log('Sended msg: ' + JSON.stringify(msg));
        wss.send(msg);
    })

    // Once the client disconnects, the `close` handler is called
    ws.on('close', () => {
        // The closed connection is removed from the set
        connections.delete(ws)
    });
}

webSocketServer.on('connection', ws => {
    let msg = {
        data: KafkaConsumers.getStatusHistory(),
        type: 'status'
    }
    console.log('-------------------Sended msg: ' + JSON.stringify(msg));
    ws.send(JSON.stringify(msg));

    ws.on('message', m => {
 webSocketServer.clients.forEach(client => client.send(m));
    });
 
    ws.on("error", e => ws.send(e));
 });

// add our websocket handler to the '/chat' route

// host the static files in the build directory
// (we will be using this later)
app.use(express.static('build'))

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", config.get('crossOrigin.reactUIAddress')); // update to match the domain you will make the request from
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));

app.ws('/ws', require('./routes/ws'));
app.use('/api/request', require('./routes/request'));
app.use('/api/status', require('./routes/status'));
app.use('/api/report', require('./routes/report'));
app.use('/api/sources', require('./routes/sources'));

server.listen(PORT, () => {
    logger.info(`Server listening on ${PORT}`);
});


