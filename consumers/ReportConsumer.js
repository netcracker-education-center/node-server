const config = require('config');

// Logger configuration
const log4js = require('log4js');
log4js.configure('./config/log4js-config.json');
const logger = log4js.getLogger('reportConsumer');

const { Kafka } = require('kafkajs');
const kafka = new Kafka({
    clientId: config.get('kafka.consumers.report'),
    brokers: [config.get('kafka.broker')]
});


/**
 * Class which consume kafka and collect reports
 */
class ReportConsumer {
    construcotr() {
        this.reportHistory = [];
        this.reportConsumer().catch(e => logger.error(`[example/consumer] ${e.message}`, e));
    }

    /**
    * Consumer, which get message from topic "reports" and save it to local file
    */
    async reportConsumer() {
        try {

            const consumer = kafka.consumer({ groupId: 'UIGetReports' });
            let topic = 'reports';

            await consumer.connect();
            logger.info('connected to: ' + topic);
            await consumer.subscribe({ topic, fromBeginning: false });

            //get each message and save it to reportHistory array
            consumer.run({
                eachMessage: async ({ topic, partition, message }) => {
                    let msg = JSON.parse(message.value.toString());
                    logger.info('Consumed message: ' + msg);
                    this.reportHistory.push({
                        message: msg,
                        timestamp: message.timestamp
                    });

                    //Delet old reports and save last 5 reports
                    if (this.reportHistory.length > 5) {
                        this.reportHistory.splice(0, this.reportHistory.length - 5);
                    }

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
    getReportsHistory() {
        return this.reportHistory;
    }
}

module.exports = ReportConsumer;