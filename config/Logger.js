const log4js = require('log4js');

const createLogger = (logFilePath) => {
    log4js.configure({
        appenders: {
            fileLog: {
                type: 'file',
                filename: logFilePath
            }
        },
        categories: {
            default: {
                appenders: ['fileLog'], level: 'debug'
            }
        }
    });
    let logger = log4js.getLogger();
    return logger;
}

module.exports = createLogger;