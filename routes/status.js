const { Router } = require('express');
const KafkaConsumers = require('../consumers/KafkaConsumers');
const router = Router();

/**
 * Return latest status of all user's requestes
 */
router.post('/get', async (req, res) => {

    //If dosn't found any status, return null
    if (KafkaConsumers.getStatusHistory() === null) {
        res.send(null);
    }

    let userId = req.body.userId;
    console.log(userId);

    let statuses = KafkaConsumers.getStatusHistory().map(v=>{
        if (v.message.userId===userId) {
            return v;
        }
    })
    //Return latest statuses
    res.send(statuses);
});


module.exports = router;
