const config = require('config');

// Logger configuration
const log4js = require('log4js');
log4js.configure('./config/log4js-config.json');
const loggerS = log4js.getLogger('statusConsumer');
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
        // Report consumer cache
        this.reportHistory = [];
        this.reportConsumer().catch(e => console.error(`[example/consumer] ${e.message}`, e));
        
        // Sources consumer cache
        this.sourcesHistory = [];
        
        // Status consumer cache
        this.statusHistory = [];
        this.statusConsumer().catch(e => logger.error(`[example/consumer] ${e.message}`, e));
        this.produceReport();
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
                            if (element.requestId === msg.requestId) {

                                this.statusHistory.splice(this.statusHistory.indexOf(element), 1)
                            }
                        });
                    } else {
                        this.statusHistory.forEach(element => {
                            if (element.requestId === msg.requestId &&
                                message.timestamp >= element.timestamp) {
                                this.statusHistory.splice(this.statusHistory.indexOf(element), 1)
                            }
                        });
                    }
                    this.statusHistory.push(msg);
                }
            });
        } catch (e) {
            loggerS.error('Error while consuming statuses. Message: ' + e);
        }
    }

    async produceReport() {
        try {
            let data = {
                type: "get_all"
            }

            const producer = kafka.producer({ groupId: 'dataminer.consumer' });

            await producer.connect();
            await producer.send({
                topic: 'listening.ui.admin',
                messages: [
                    { value: JSON.stringify(data) },
                ]
            });
            await producer.disconnect();

        } catch (e) {
            logger.error(`Enything while sending request went wrong ${e}`);
        }
    }

    /**
     * Consume reports from kafka
     */
    async reportConsumer() {
        try {

            const consumer = kafka.consumer({ groupId: 'UIGetReportAndSources' });
            let topic = 'reports';

            await consumer.connect();
            loggerR.info('connected to: ' + topic);
            await consumer.subscribe({ topic: 'reports', fromBeginning: true });

            //get each message and save it to reportHistory array
            consumer.run({
                eachMessage: async ({ topic, partition, message }) => {
                    let msg = JSON.parse(message.value.toString());
                    loggerR.info('Consumed message: ' + msg);

                    // If it is sources, save to source cache
                    if (Array.isArray(msg) && msg.length) {
                        console.log('his array');
                        this.sourcesHistory = msg;
                    } else {
                        console.log('pushing report to cache');
                        this.reportHistory.push(msg);

                        //Delet old reports and save last 5 reports
                        if (this.reportHistory.length > 100) {
                            this.reportHistory.splice(0, 1);
                        }
                    }
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

    addStatus(status) {
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