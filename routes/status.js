const { Router } = require('express');
const StatusConsumer = require('../consumers/StatusConsumer');
const router = Router();

statusHistory = new StatusConsumer().getStatusHistory();
/**
 * Return latest status of all user's requestes
 */
router.post('/get', async (req, res) => {
    // let userId = req.body.userId;

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

/**
 * Statuses for testing
 */
router.post('/getSimpleStatus', async (req, res) => {
    //Simple array of user statuses
    let resultStatuses = [
        {
            messages: {
                requestId: '1111',
                userId: '123212321323',
                date: '12-12-12',
                keywords: 'How to ...',
                status: 'IN PROCESS'
            },
            timestamp: 10
        },
        {
            messages: {
                requestId: '2222',
                userId: '123212321323',
                date: '12-12-12',
                keywords: 'Why...',
                status: 'COMPLETED'
            },
            timestamp: 12
        },
        {
            messages: {
                requestId: '3333',
                userId: '123212321323',
                date: '12-12-12',
                keywords: 'Any words...',
                status: 'COMPLETED'
            },
            timestamp: 13
        },
        {
            messages: {
                requestId: '4444',
                userId: '123212321323',
                date: '12-12-12',
                keywords: 'Wtf bro?',
                status: 'IN PROCESS'
            },
            timestamp: 14
        },
        {
            messages: {
                requestId: '555',
                userId: '123212321323',
                date: '12-12-12',
                keywords: 'Check bootstrap table border...',
                status: 'COMPLETED'
            },
            timestamp: 15
        }];
    //Return latest statuses
    res.send(resultStatuses);
});

module.exports = router;