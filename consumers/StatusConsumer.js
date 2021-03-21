const config = require('config');
const { Kafka } = require('kafkajs');
const logger = require('../config/Logger')('../logs/StatusConsumer.log');

const kafka = new Kafka({
    clientId: config.get('kafkaClientId'),
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

    async statusConsumer(){
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
                    logger.info('Consumed statuse:' + msg);

                    this.statusHistory.push({
                        message: msg,
                        timestamp: message.timestamp
                    });
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