const { Router } = require('express');
const router = Router();
const config = require('config');
const KafkaConsumers = require('../consumers/KafkaConsumers');

// Logger configuration
const log4js = require('log4js');
log4js.configure('./config/log4js-config.json');
const logger = log4js.getLogger('request');

const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    clientId: config.get('kafka.producers.request'),
    brokers: [config.get('kafka.broker')]
});

/**
 * push request to topic for analyse
 */
router.post('/push', async (req, res) => {
    try {
        let msg = {
            'jiraIssues': {
                'jql': req.body.jiraJQLRequest,
                'jiraIssuesDate': req.body.jiraIssuesDate,
                'jiraIssuesStatus': req.body.jiraIssuesStatus
            },

            'ftpFiles': {
                'pathToDir': req.body.pathToDir,
                'extensionFilter': req.body.ftpExtention,
                'dateFilter': req.body.ftpDate
            },

            'confPages': {
                'confPagesDate': req.body.confPagesDate,
                'cql': req.body.cql
            },
            'status': 'COMPLETED',

            'keywords': req.body.keywords,
            'userId': req.body.userId,
            'selectedSources': req.body.selectedSources

        }
        console.log(` Sended message: ${JSON.stringify(msg)}`);

        KafkaConsumers.setStatus({
            message: msg,
            timestamp: Date.now
        })

        // const producer = kafka.producer({ groupId: 'dataminer.consumer' });

        // await producer.connect();
        // await producer.send({
        //     topic: 'TEST-listening.ui.request',
        //     messages: [
        //         { value: JSON.stringify(msg) },
        //     ]
        // });

        // await producer.disconnect();

        return res.status(200).json({ message: 'Message, sended!' })
    } catch (e) {
        console.log(`Enything went wrong while sending request. Current exception: ${e}`);
        res.status(500).json(`Enything went wrong while sending request. Current exception: ${e}`);
    }
});

module.exports = router;