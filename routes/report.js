const { Router } = require('express');
const router = Router();
const config = require('config');
const KafkaConsumers = require('../consumers/KafkaConsumers');

// Logger configuration
const log4js = require('log4js');
log4js.configure('./config/log4js-config.json');
const logger = log4js.getLogger('report');

const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    clientId: config.get('kafka.producers.report'),
    brokers: [config.get('kafka.broker')]
});


let reportConsumer = KafkaConsumers;

/**
 * Get report by reqId
 */
router.post('/get', async (req, res) => {
    let reqId = req.body.requestId;
    try {


        let reportHistory = reportConsumer.getReportsHistory();

        if (Array.isArray(reportHistory) && reportHistory.length) {

            //Finding all reports with current reqId
            let reportArray = reportHistory.map(v => {
                if (v.message.requestId === reqId) {
                    return v
                }
            });

            let resultReport = reportArray[reportArray.length - 1];
            res.send(resultReport.message);
        } else {
            //Produce req for getting report by reqId
            await produceReport(reqId);
            res.send('null');
        }
    } catch (e) {
        await produceReport(reqId);
        res.send('null');
    }
})

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