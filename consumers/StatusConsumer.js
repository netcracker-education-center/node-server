const config = require('config');

// Logger configuration
const log4js = require('log4js');
log4js.configure('./config/log4js-config.json');
const logger = log4js.getLogger('statusConsumer');

const { Kafka } = require('kafkajs');
const kafka = new Kafka({
    clientId: config.get('kafkaClientIdStatusConsumer'),
    brokers: [config.get('kafkaBroker')]
});


/**
 * Class consumer, which collect all request statuses
 */
class StatusConsumer {
    constructor() {
        this.statusHistory = [];
        this.statusConsumer().catch(e => logger.error(`[example/consumer] ${e.message}`, e));
    }

    /**
     * Method which consume status topic
     */
    async statusConsumer() {
        try {

            const consumer = kafka.consumer({ groupId: 'UIRequestStatuses' });
            let topic = 'analysis-topic';

            await consumer.connect();
            logger.info('connected to: ' + topic);
            await consumer.subscribe({ topic, fromBeginning: false });

            //get each message and save it to statusHistory array
            consumer.run({
                eachMessage: async ({ topic, partition, message }) => {
                    let msg = JSON.parse(message.value.toString());
                    logger.info('Consumed statuse:' + JSON.stringify(msg));
                    
                    this.statusHistory.push({
                        message: msg,
                        timestamp: message.timestamp
                    });

                    //Delete user requestes old statuses from history
                    this.statusHistory.forEach(element => {
                        if(JSON.stringify(element.message.requestId)===JSON.stringify(msg.requestId) && message.timestamp > element.timestamp) {
                            this.statusHistory.splice(this.statusHistory.indexOf(element), 1)
                        }
                    })

                }
            });
        } catch (e) {
            logger.error('Error while consuming statuses. Message: ' + e);
        }
    }

    /**
     * 
     * @returns status history from kafka
     */
    getStatusHistory() {
        return this.statusHistory;
    }
}

module.exports = StatusConsumer;