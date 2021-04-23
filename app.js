const express = require("express");
const config = require('config');
const PORT = config.get('port') || 7071;
const app = express();

// Logger configuration
const log4js = require('log4js');
const KafkaConsumers = require("./consumers/KafkaConsumers");
log4js.configure('./config/log4js-config.json');
const logger = log4js.getLogger('app');

const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    clientId: config.get('kafka.producers.source'),
    brokers: [config.get('kafka.broker')]
});

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", config.get('crossOrigin.reactUIAddress'));
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));

app.use('/api/request', require('./routes/request'));
app.use('/api/status', require('./routes/status'));
app.use('/api/report', require('./routes/report'));
app.use('/api/sources', require('./routes/sources'));

app.listen(PORT, () => {
    logger.info(`Server listening on ${PORT}`);
});


