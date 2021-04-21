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
    clientId: config.get('kafka.producers.report'),
    brokers: [config.get('kafka.broker')]
});


let reportConsumer = KafkaConsumers;

/**
 * Get report by reqId
 */
router.post('/get', async (req, res) => {
    let reqId = req.body.requestId;
    let time = req.body.time;

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
            if (!!resultReport) {
                res.send(resultReport.message);
            } else {
                if (time === 'first') {

                    logger.info('mesage at ' + time + ' time')
                    // Produce req for getting report by reqId
                    await produceReport(reqId);
                    res.send('null');
                }
            }
            if (time === 'first') {

                logger.info('mesage at ' + time + ' time')
                // Produce req for getting report by reqId
                await produceReport(reqId);
                res.send('null');
            }
        } else {
        }
    } catch (e) {
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

//------------------------------------------------------
// //WebSocket
// const WebSocket = require('ws');
// function setupWebSocket(server) {
//     //ws instance
//     const wss = new WebSocket.Server({noServer: true});

//     //handle upgrade of the request
//     server.on("upgrade", function upgrade(request, socket, head){
//         try{
//             // authentication and some other steps will come here
//             // we can choose wheather to upgrade or not

//             wss.handleUpgrade(request,socket, head, function done(ws){
//                 wss.emit("connection", ws, request);
//             });
//         } catch (err) {
//             console.log('upgrade exception', err);
//             socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
//             socket.destroy();
//             return;
//         }
//     });
//     // what to do after connection established
//     wss.on('connection', (ctx)=>{

//     })
// }

//------------------------------------------------------

module.exports = router;