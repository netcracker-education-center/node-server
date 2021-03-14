const { Router } = require('express');
const router = Router();
const config = require('config');


const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    clientId: config.get('kafkaClientId'),
    brokers: [config.get('kafkaBroker')]
});

/**
 * Last 5 user reports
 */
 let reportHistory = [];

 /**
  * Get report by reqId
  */
 router.post('/get', async (req, res) => {

    let reqId = req.body.requestId;

    //If dosn't found any status, return null
    if (reportHistory === null) {
        res.send(null);
    }
    
    //Finding all reports with current reqId
    let reportArray = reportHistory.map(v => {
        if (v.message.requestId === reqId) {
            return v
        }
    });
    
    //If DontFind report send req to topic and return -1
    if (reportArray === null) {
        //Produce req for getting report by reqId
        produceReport(reqId);
        res.send(-1);
    }
        //Array with users Requestes Id and last index in history
        let resultReport = reportArray[0];

    //Getting latest reports and delete old reports
    reportArray.forEach(e => {
        if (e.timestamp > resultReport.timestamp) {
            reportArray=e;
        } else {
            reportHistory.splice(reportHistory.indexOf(e), 1)
        }
    });

    //Delet old reports and save last 5 reports
    if(reportHistory.length>5) {
        reportHistory.splice(0, reportHistory.length-5);
    }

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
        }

        console.log(JSON.stringify(msg));

        const producer = kafka.producer()

        await producer.connect()
        await producer.send({
            topic: topic,
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
}


/**
 * Consumer, which get message from topic "reports" and save it to local file
 */
 const reportConsumer = async () => {
    const consumer = kafka.consumer({ groupId: 'UIGetReports' });

    let topic = 'reports'

    await consumer.connect()
    console.log('connected to: ' + topic)
    await consumer.subscribe({ topic, fromBeginning: false })

    //get each message and save it to statusHistory array
    consumer.run({

        eachMessage: async ({ topic, partition, message }) => {
            console.log('Getting statuses....');
            let msg = JSON.parse(message.value.toString());
            console.log(msg);

            reportHistory.push({
                message: msg,
                timestamp: message.timestamp
            });
        },
    })
}

reportConsumer().catch(e => console.error(`[example/consumer] ${e.message}`, e))

module.exports = router;
