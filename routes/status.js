const { Router } = require('express');
const StatusConsumer = require('../consumers/StatusConsumer');
const router = Router();

statusHistory = new StatusConsumer().getStatusHistory();
/**
 * Return latest status of all user's requestes
 */
router.post('/get', async (req, res) => {

    //If dosn't found any status, return null
    if (statusHistory === null) {
        res.send(null);
    }

    //Array with users Requestes Id and last index in history
    let resultStatuses = [];

    //Getting latest request statuses 
    statusHistory.forEach(element => {
        if (!resultStatuses.includes(element)) {
            resultStatuses.push(element);
        } else {
            resultStatuses.splice(resultStatuses.indexOf(element), 1, element)
        }
    });

    //Delete user requestes old statuses from history
    statusHistory.forEach(element => {
        if (!resultStatuses.includes(element)) {
            statusHistory.splice(statusHistory.indexOf(element), 1)
        }
    })

    //Return latest statuses
    res.send(resultStatuses)
});

module.exports = router;