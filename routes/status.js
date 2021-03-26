const { Router } = require('express');
const StatusConsumer = require('../consumers/StatusConsumer');
const router = Router();

let statusConsumer = new StatusConsumer();
/**
 * Return latest status of all user's requestes
 */
router.post('/get', async (req, res) => {

    //If dosn't found any status, return null
    if (statusConsumer.getStatusHistory() === null) {
        res.send(null);
    }

    //Return latest statuses
    res.send(statusConsumer.getStatusHistory());
});


module.exports = router;