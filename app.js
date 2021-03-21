const express = require("express");
const config = require('config');
const logger = require('./config/Logger')('./logs/App.log');
const PORT = config.get('port') || 7071;



const app = express();

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://206.81.22.187:7070"); // update to match the domain you will make the request from
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));


app.use('/api/request', require('./routes/request'));
app.use('/api/status', require('./routes/status'));
app.use('/api/report', require('./routes/report'));

app.listen(PORT, () => {
    logger.info(`Server listening on ${PORT}`);
});


