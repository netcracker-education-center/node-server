const { Router } = require('express');
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
                'jiraJQLRequest': req.body.jiraJQLRequest,
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
        console.log(JSON.stringify(msg));

        const producer = kafka.producer()

        await producer.connect()
        await producer.send({
            topic: 'listening.ui.request',
            messages: [
                { value: JSON.stringify(msg) },
            ],
        })

        await producer.disconnect()

        return res.status(200).json({ message: 'Message, sended!' })
    } catch (e) {
        console.log(e)
        res.status(500).json({ e })
    }
})

module.exports = router;