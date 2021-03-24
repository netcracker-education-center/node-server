const { Router } = require('express');
const router = Router();
const config = require('config');
const ReportConsumer = require('../consumers/ReportConsumer');

// Logger configuration
const log4js = require('log4js');
log4js.configure('./config/log4js-config.json');
const logger = log4js.getLogger('report');

const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    clientId: config.get('kafkaClientIdReport'),
    brokers: [config.get('kafkaBroker')]
});


let reportConsumer = new ReportConsumer();

/**
 * Get report by reqId
 */
router.post('/get', async (req, res) => {

    let reqId = req.body.requestId;

    let reportHistory = reportConsumer.getReportsHistory();

    //If dosn't found any status, return null
    if (repo === null) {
        res.send(null);
    }

    //Finding all reports with current reqId
    let reportArray = reportHistory.map(v => {
        if (v.message.requestId === reqId) {
            return v
        }
    });

    //If Dont Find report send req to topic and return -1
    if (reportArray === null) {
        //Produce req for getting report by reqId
        produceReport(reqId);
        res.send(-1);
    }
    //Last report in array
    let resultReport = reportArray[reportArray.length - 1];

    //Return latest report
    res.send(resultReport.message);
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
        return res.status(200).json({ message: 'Message, sended!' });

    } catch (e) {
        logger.error(`Enything while sending request went wrong ${e}`);
        res.status(500).json({ e });
    }
}

module.exports = router;