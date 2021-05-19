const { Router } = require('express');
const router = Router();
const config = require('config');
const KafkaConsumers = require('../consumers/KafkaConsumers');

// Logger configuration
const log4js = require('log4js');
log4js.configure('./config/log4js-config.json');
const logger = log4js.getLogger('request');

const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    clientId: config.get('kafka.producers.request'),
    brokers: [config.get('kafka.broker')]
});

/**
 * push request to topic for analyse
 */
router.post('/push', async (req, res) => {
    try {
        let selectedSources = JSON.parse(JSON.stringify(req.body.selectedSources).toLowerCase());
        let sources = selectedSources.map(v => {
            return v.id;
        })
        if (findInCache(req.body.keywords, sources)) {
            console.log('RESTORING');
            let cachedReport = getReportFromCache(req.body.keywords, sources);
            console.log(JSON.stringify(cachedReport));

            let status = {
                requestId: cachedReport.requestId,
                status: 'RESTORED',
                keywords: cachedReport.keywords,
                date: cachedReport.date,
                userId: cachedReport.userId
            }

            KafkaConsumers.addStatus(status);
            return res.status(200).json({ message: 'Message, sended!' })
        }
        let msg = {
            'jiraIssues': {
                'jql': req.body.jiraJQLRequest,
                'jiraIssuesDate': req.body.jiraIssuesDate,
                'jiraIssuesStatus': req.body.jiraIssuesStatus
            },

            'ftpFiles': {
                'pathToDir': req.body.pathToDir,
                'extensionFilter': req.body.ftpExtention,
                'dateFilter': req.body.ftpDate
            },

            'confPages': {
                'confPagesDate': req.body.confPagesDate,
                'cql': req.body.cql
            },
            'status': 'COMPLETED',

            'keywords': req.body.keywords,
            'userId': req.body.userId,
            'selectedSources': JSON.parse(JSON.stringify(req.body.selectedSources).toLowerCase())

        }
        logger.info(` Sended search request: ${JSON.stringify(msg)}`);

        const producer = kafka.producer({ groupId: 'dataminer.consumer' });

        await producer.connect();
        await producer.send({
            topic: 'listening.ui.request',
            messages: [
                { value: JSON.stringify(msg) },
            ]
        });
        await producer.disconnect();

        return res.status(200).json({ message: 'Message, sended!' })
    } catch (e) {
        logger.error(`Enything went wrong while sending request. Current exception: ${e}`);
        res.status(500).json(`Enything went wrong while sending request. Current exception: ${e}`);
    }
});

/**
 * @param {*} keywords 
 * @param {*} sources 
 * @returns true if we find report with current keywords and sources in cache
 */
const findInCache = (keywords, sources) => {
    let founded = false;
    console.log(KafkaConsumers.getReportsHistory().length);
    KafkaConsumers.getReportsHistory().forEach((v) => {
        if (v.keywords.every(k => keywords.includes(k)) &&
            v.sources.every(s => sources.includes(s))) {
            founded = true;
        }
    });

    return founded;
}

/**
 * @param {*} keywords 
 * @param {*} sources 
 * @returns report from cache
 */
const getReportFromCache = (keywords, sources) => {
    let report = false;
    KafkaConsumers.getReportsHistory().forEach((v) => {
        if (v.keywords.every(k => keywords.includes(k)) &&
            v.sources.every(s => sources.includes(s))) {
            report = v;
        }
    });

    return report;
}

module.exports = router;
