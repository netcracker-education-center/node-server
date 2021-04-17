const { Router, request } = require('express');
const router = Router();
const config = require('config');
const KafkaConsumers = require('../consumers/KafkaConsumers');

// Logger configuration
const log4js = require('log4js');
log4js.configure('./config/log4js-config.json');
const logger = log4js.getLogger('report');

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
    console.log('get request');
    res.send(sourcesHistory);
});

/**
 * push source to kafka
 */
router.post('/push', async (req, res) => {

// let data = {
//     type: "get_all"
// }

// if(data.type==='get_all'){
//     const producer = kafka.producer({ groupId: 'dataminer.consumer' });

//     await producer.connect();
//     await producer.send({
//         topic:'listening.ui.admin',
//         messages: [
//             { value: JSON.stringify(data) },
//         ]
//     });

//     await producer.disconnect();
// }

    let topic = 'listening.ui.admin';
    let source = req.body.source;
    let action = req.body.action;
    let id = req.body.id;

    if (action === 'remove') {
        console.log('we delete: ' + id);
        KafkaConsumers.deleteSource(id);
    } else if (source === 'JIRA') {
        let credentials = req.body.jiraSource;
        let msg = {
            type: action,
            source,
            credentials: {
                id: credentials.id,
                password: credentials.password,
                login: credentials.login,
            }
        }
        console.log(action + ' JIRA source');
        console.log(JSON.stringify(msg));

        KafkaConsumers.setSource(msg);

        // const producer = kafka.producer({ groupId: 'dataminer.consumer' });

        // await producer.connect();
        // await producer.send({
        //     topic,
        //     messages: [
        //         { value: JSON.stringify(msg) },
        //     ]
        // });

        // await producer.disconnect();

        res.send('Message sended');
    } else if (source === 'FTP') {
        let credentials = req.body.ftpSource;
        let msg = {
            action,
            source,
            credentials
        }
        console.log(action + ' FTP source');
        console.log(JSON.stringify(msg));

        KafkaConsumers.setSource(msg);

        res.send('Message sended');
    } else if (source === 'CONFLUENCE'){
        let credentials = req.body.confSource;
        let msg = {
            action,
            source,
            credentials
        }
    }
});

/**
 * Produce to kafka topic request for getting new Report
 */
const produceReport = async (id) => {
    try {

        //topic name
        let topic = 'get.report';

        //message for topic
        let msg = {
            requestId: id
        };

        logger.info(`Request to get report by requestId: ${JSON.stringify(msg)} sended.`);

        const producer = kafka.producer({ groupId: 'analysis.consumer' });

        await producer.connect();
        await producer.send({
            topic: topic,
            messages: [
                { value: JSON.stringify(msg) },
            ]
        });
        await producer.disconnect();
        return 200;

    } catch (e) {
        logger.error(`Enything while sending request went wrong ${e}`);
    }
}

module.exports = router;