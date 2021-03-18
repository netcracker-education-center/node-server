const { Router } = require('express');
const logger = require('../config/Logger')('../logs/Request.log');
const router = Router();
const config = require('config');

const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    clientId: config.get('kafkaClientId'),
    brokers: [config.get('kafkaBroker')]
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
                'dataFilter': req.body.ftpDate
            },

            'keywords': req.body.keywords
        }
        logger.info(` Sended message: ${JSON.stringify(msg)}`);

        const producer = kafka.producer();

        await producer.connect();
        await producer.send({
            topic: 'listening.ui.request',
            messages: [
                { value: JSON.stringify(msg) },
            ]
        });

        await producer.disconnect();

        return res.status(200).json({ message: 'Message, sended!' })
    } catch (e) {
        logger.error(`Enything went wrong while sending request. Current exception: ${e}`);
        res.status(500).json(`Enything went wrong while sending request. Current exception: ${e}`);
    }
});

module.exports = router;