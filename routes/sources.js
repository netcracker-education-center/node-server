const { Router, request } = require('express');
const router = Router();
const config = require('config');
const KafkaConsumers = require('../consumers/KafkaConsumers');

// Logger configuration
const log4js = require('log4js');
log4js.configure('./config/log4js-config.json');
const logger = log4js.getLogger('sources');

const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    clientId: config.get('kafka.producers.source'),
    brokers: [config.get('kafka.broker')]
});


/**
 * Get all saources
 */
router.post('/get', async (req, res) => {
    let sourcesHistory = KafkaConsumers.getSourceHistory();
    res.send(sourcesHistory);
});

/**
 * push source to kafka
 */
router.post('/push', async (req, res) => {

    let topic = 'listening.ui.admin';
    let action = req.body.action.toLowerCase();

    if (action === 'remove') {
        let id = req.body.id;
        let sourceType = req.body.sourceType
        let msg = {
            type: action,
            source: sourceType,
            credentials:{
                url: id,
                server: id,
                port: '',
                login: '',
                password: '',
                token:''
            }
        }

        const producer = kafka.producer({ groupId: 'dataminer.consumer' });
        await producer.connect();
        await producer.send({
            topic,
            messages: [
                { value: JSON.stringify(msg) },
            ]
        });
        await producer.disconnect();

    } else {
        let source = req.body.source.toUpperCase();
        let credentials = req.body.credentials;
        let msg = {
            type: action,
            source,
            credentials
        }
        
        logger.info(`${action} ${source} source`);
        logger.info('Get source request: ' + JSON.stringify(msg));

        const producer = kafka.producer({ groupId: 'dataminer.consumer' });

        await producer.connect();
        await producer.send({
            topic,
            messages: [
                { value: JSON.stringify(msg) },
            ]
        });

        await producer.disconnect();

        res.send('Message sended');
    }
});

module.exports = router;