const { Router } = require('express');
const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    clientId: 'node-server',
    brokers: ['localhost:9092']
});
const router = Router();

/**
 * All statuses from topic
 */
let statusHistory = [];

/**
 * Return latest status of all user's requestes
 */
router.get('/getStatus', async (req, res) => {
    let userId = req.params.userId;

    //All user's requests status from topic 
    let reqStatuses = statusHistory.map(value => {
        if (value.message.userId === userId) {
            return value;
        }
    })

    //If dosn't found any status, return null
    if (reqStatuses === null) {
        res.send(null);
    }

    //Array of users RequestesId and last index in history
    let resultStatuses = [];

    //Getting latest request statuses 
    reqStatuses.forEach(element => {
        if (!resultStatuses.includes(element)) {
            resultStatuses.push(element);
        } else {
            resultStatuses.slice(resultStatuses.indexOf(element), 1, element)
        }
    });

    //Delete user requestes old statuses from history
    reqStatuses.forEach(element => {
        if (!resultStatuses.includes(element)) {
            statusHistory.slice(statusHistory.indexOf(element), 1)
        }
    })

    //Return latest statuses
    res.send(resultStatuses)

})


/**
 * Consumer, which collect all msg (request statuses)
 */
const run = async () => {
    const consumer = kafka.consumer({ groupId: 'UIConsumers2' });

    let topic = 'request-status-topic'

    await consumer.connect()
    console.log('connected to status-topic')
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

run().catch(e => console.error(`[example/consumer] ${e.message}`, e))


module.exports = router;