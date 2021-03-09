const { Router } = require('express');
const router = Router();

const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    clientId: 'collect-and-search-backend',
    brokers: ['localhost:9092']
});

let consumerData = [{
    message: [],
    timestamp: ''
}];;

router.post('/push', async (req, res) => {

    try {
        // console.log("req.params: "+ req.params);
        // console.log("req.body: "+ req);
        // console.log("req.body: "+ req.body);
        let msg = {
            ticketSystem: req.body.ticketSystem,
            login: req.body.login,
            password: req.body.password,
            url: req.body.url,
            userId: req.body.userId
        }
        console.log(JSON.stringify(msg));

        const producer = kafka.producer()

        await producer.connect()
        await producer.send({
            topic: 'ui-search-requests',
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

router.post('/get', async (req, res) => {
    const userId = JSON.parse(req.body.userId);

    //let userData = consumerData.map((v) => { if (JSON.stringify(v.userId) === userId) { return v } })
    let userData = consumerData.map((v) => {
        console.log( {'consumerData.userId': JSON.stringify(v.userId)} );
        console.log( `${v.userId===req.body.userId}`);
        return v;
    })

    //console.log({userData: userData.toString()});
    res.send(userData);

})

const run = async () => {
    const consumer = kafka.consumer({ groupId: 'UIConsumers1' });

    let reqest_topic = 'ui-search-requests';
    let response_topic = 'ui-search-results-topic'

    await consumer.connect()
    console.log('connected')
    await consumer.subscribe({ topic: response_topic, fromBeginning: false })
    consumer.run({
        // eachBatch: async ({ batch }) => {
        //   console.log(batch)
        // },

        eachMessage: async ({ topic, partition, message }) => {
            console.log('runing....');
            let msg = JSON.parse(message.value.toString());
            console.log(msg);
            consumerData.push({
                message: msg,
                timestamp: message.timestamp
            });
            //console.log({ msg });

        },
    })
}

run().catch(e => console.error(`[example/consumer] ${e.message}`, e))


module.exports = router;