const { Router } = require('express');
const router = Router();
const config = require('config');


const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    clientId: config.get('kafkaClientId'),
    brokers: [config.get('kafkaBroker')]
});

/**
 * All statuses from topic
 */
let statusHistory = [];


/**
 * Return latest status of all user's requestes
 */
router.post('/get', async (req, res) => {
    // let userId = req.body.userId;

    //If dosn't found any status, return null
    if (statusHistory === null) {
        res.send(null);
    }

    //Array with users Requestes Id and last index in history
    let resultStatuses = [];

    //Getting latest request statuses 
    statusHistory.forEach(element => {
        if (!resultStatuses.includes(element)) {
            resultStatuses.push(element);
        } else {
            resultStatuses.splice(resultStatuses.indexOf(element), 1, element)
        }
    });

    //Delete user requestes old statuses from history
    statusHistory.forEach(element => {
        if (!resultStatuses.includes(element)) {
            statusHistory.splice(statusHistory.indexOf(element), 1)
        }
    })

    //Return latest statuses
    res.send(resultStatuses)
});


/**
 * Consumer, which collect all msg (request statuses)
 */
const statusConsumer = async () => {
    const consumer = kafka.consumer({ groupId: 'UIRequestStatuses' });

    let topic = 'analysis-topic'

    await consumer.connect()
    console.log('connected to: ' + topic)
    await consumer.subscribe({ topic, fromBeginning: false })

    //get each message and save it to statusHistory array
    consumer.run({

        eachMessage: async ({ topic, partition, message }) => {
            console.log('Getting statuses....');
            let msg = JSON.parse(message.value.toString());
            console.log(msg);

            statusHistory.push({
                message: msg,
                timestamp: message.timestamp
            });
        },
    })
}

statusConsumer().catch(e => console.error(`[example/consumer] ${e.message}`, e))


module.exports = router;