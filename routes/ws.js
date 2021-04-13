const { Router } = require('express');
const KafkaConsumers = require('../consumers/KafkaConsumers');
const router = Router();

router.ws('/ws  ', function (ws, req) {
    ws.on('connection', function (msg1) {
        let msg = {
            data: KafkaConsumers.getStatusHistory(),
            type: 'status'
        }
        console.log('-------------------Sended msg: ' + JSON.stringify(msg));
        ws.send(msg);
    });
});


module.exports = router;