const config = require('config');
const logger = require('../config/Logger')('../logs/ReportConsumer.log');

const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    clientId: config.get('kafkaClientId'),
    brokers: [config.get('kafkaBroker')]
});

/**
 * Class which consume kafka and collect reports
 */
class ReportConsumer {
    construcotr() {
        this.reportHistory = [];
        reportConsumer().catch(e => logger.error(`[example/consumer] ${e.message}`, e));
    }
    
    /**
    * Consumer, which get message from topic "reports" and save it to local file
    */
     async reportConsumer(){
        try {

            const consumer = kafka.consumer({ groupId: 'UIGetReports' });

            let topic = 'reports';

            await consumer.connect();
            logger.info('connected to: ' + topic);
            await consumer.subscribe({ topic, fromBeginning: false });

            //get each message and save it to statusHistory array
            consumer.run({
                eachMessage: async ({ topic, partition, message }) => {
                    let msg = JSON.parse(message.value.toString());
                    logger.info('Consumed message: ' + msg);
                    this.reportHistory.push({
                        message: msg,
                        timestamp: message.timestamp
                    });
                }
            });
        } catch (e) {
            logger.error('Error while consuming reports. Message: ' + e);
        }
    }

    /**
     * 
     * @returns reports from current history
     */
    getReports() {
        return this.reportHistory;
    }
}

module.exports = ReportConsumer;