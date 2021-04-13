const config = require('config');

// Logger configuration
const log4js = require('log4js');
log4js.configure('./config/log4js-config.json');
const loggerS = log4js.getLogger('statusConsumer');

// Logger configuration
const loggerR = log4js.getLogger('reportConsumer');


const { Kafka } = require('kafkajs');
const kafka = new Kafka({
    clientId: config.get('kafka.consumers.status'),
    brokers: [config.get('kafka.broker')]
});


/**
 * Class consumer, which collect all request statuses
 */
class KafkaConsumers {
    constructor() {
        // Report consumer run
        this.reportHistory = [];
        this.reportConsumer().catch(e => logger.error(`[example/consumer] ${e.message}`, e));

        // Sources consumer run
        this.sourcesHistory = [];
        this.sourcesConsumer().catch(e => logger.error(`[example/consumer] ${e.message}`, e));

        // Status consumer run
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
            loggerS.info('connected to: ' + topic);
            await consumer.subscribe({ topic, fromBeginning: false });

            //get each message and save it to statusHistory array
            consumer.run({
                eachMessage: async ({ topic, partition, message }) => {
                    let msg = JSON.parse(message.value.toString());
                    loggerS.info('Consumed statuse:' + JSON.stringify(msg));



                    //Delete user requestes old statuses from history
                    if (msg.status === 'COMPLETED') {
                        this.statusHistory.forEach(element => {
                            if (element.message.requestId === msg.requestId) {

                                this.statusHistory.splice(this.statusHistory.indexOf(element), 1)
                            }
                        });
                    } else {
                        this.statusHistory.forEach(element => {
                            if (element.message.requestId === msg.requestId &&
                                message.timestamp >= element.timestamp) {
                                this.statusHistory.splice(this.statusHistory.indexOf(element), 1)
                            }
                        });
                    }
                    this.statusHistory.push({
                        message: msg,
                        timestamp: message.timestamp
                    });
                }
            });
        } catch (e) {
            loggerS.error('Error while consuming statuses. Message: ' + e);
        }
    }

    /**
     * Consume reports from kafka
     */
    async reportConsumer() {
        try {

            const consumer = kafka.consumer({ groupId: 'UIGetReport' });
            let topic = 'reports';

            await consumer.connect();
            loggerR.info('connected to: ' + topic);
            await consumer.subscribe({ topic, fromBeginning: false });

            //get each message and save it to reportHistory array
            consumer.run({
                eachMessage: async ({ topic, partition, message }) => {
                    let msg = JSON.parse(message.value.toString());
                    loggerR.info('Consumed message: ' + msg);
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
            loggerR.error('Error while consuming reports. Message: ' + e);
        }
    }

    /**
     * Consume sources from kafka
     */
    async sourcesConsumer() {
        try {

            const consumer = kafka.consumer({ groupId: 'UIGetSources' });
            let topic = 'sources';

            await consumer.connect();
            loggerR.info('connected to: ' + topic);
            await consumer.subscribe({ topic, fromBeginning: false });

            //get each message and save it to sourcesHistory array
            consumer.run({
                eachMessage: async ({ topic, partition, message }) => {
                    let msg = JSON.parse(message.value.toString());
                    loggerR.info('Consumed message: ' + msg);
                    this.sourcesHistory.push({
                        message: msg,
                    });

                    //Delet old sources with current id and save last 5 reports
                    this.sourcesHistory.forEach(e => {
                        if (e.message.id === message.id) {
                            this.sourcesHistory.splice(this.sourcesHistory.indexOf(e), 1);
                        }
                    });

                }
            });
        } catch (e) {
            loggerR.error('Error while consuming reports. Message: ' + e);
        }
    }

    /**
     * 
     * @returns reports from current history
     */
    getReportsHistory() {
        return this.reportHistory;
    }

    /**
     * 
     * @returns status history from kafka
     */
    getStatusHistory() {
        return this.statusHistory;
    }

    /**
     * 
     * @returns source history
     */
    getSourceHistory() {
        return this.sourcesHistory;
    }

    setStatus(status) {
        this.statusHistory.push(status);
    }

    setSource(source) {
        this.sourcesHistory.push(source);
    }

    deleteSource(id) {
        let source = this.sourcesHistory.map(v => {
            if (v.credentials.id === id) {
                return v
            }
        });
        this.sourcesHistory.splice(this.sourcesHistory.indexOf(source[0]), 1);
    }
}

module.exports = new KafkaConsumers();